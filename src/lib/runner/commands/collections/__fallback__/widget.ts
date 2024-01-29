import * as path from 'path'

import { FunctionFragment } from 'ethers'
import { glob } from 'glob'

import { CollectionOptions } from './types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type WidgetOptions = {
  workflowId?: string
  printAll?: boolean
  file?: string
  edit: boolean
} & CollectionOptions

export default class WidgetCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  WidgetOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'workflowId',
        aliases: ['w'],
        prompt: 'Workflow ID:',
        type: 'string',
        choices: [
          ...this.contextOptions.collectionDataManager!.workflowManagerView
            .workflows,
        ].map((w) => ({
          name: w.name,
          value: w.id,
        })),
      },
      {
        name: 'printAll',
        aliases: ['a'],
        prompt: 'Print all widget config?',
        type: 'boolean',
        default: false,
      },
      {
        name: 'file',
        aliases: ['f'],
        prompt:
          'Markdown file to update - glob syntax supported for multiple files:',
        type: 'string',
      },
      {
        name: 'edit',
        aliases: ['e'],
        prompt: 'Edit file in place? (This will not create backup files)',
        type: 'boolean',
        default: false,
      },
    ]
  }

  async process(options: WidgetOptions) {
    console.log('Generating widget')
    const widgetURI =
      await this.contextOptions.collectionDataManager!.workflowManagerView.generateWidget(
        options.workflowId,
      )

    console.log('Widget generated\n')
    console.log('Widget URI: ', widgetURI)

    if (options.workflowId) {
      console.log('\n\nIn your markdown, add the following:\n\n')
      console.log(`<BonadocsWidget widgetConfigUri="${widgetURI}" />`)
      return
    }

    if (options.printAll) {
      this.printAllWidgetConfig(widgetURI)
      return
    }

    if (options.file) {
      await this.processFile(options.file, widgetURI, options.edit)
      console.log('Widget added to markdown files')
      return
    }

    this.printInstructions(widgetURI)
    return
  }

  protected get commandDescription(): string {
    return 'Generate a widget from this collection.\nUse -w to specify a workflow ID to generate.\nAn open-ended widget will be generated if no workflow is specified.'
  }

  private printInstructions(widgetURI: string) {
    console.log(
      `<BonadocsWidget widgetConfigUri="${widgetURI}" contract="ContractNameHere" functionKey="selectorOrSignatureHere" />`,
    )
    console.log('\n\nNOTE:')
    console.log(
      '1. The contract name must be the name or ID of a contract in this collection.',
    )
    console.log(
      '2. The function key must be the selector or signature of a function in that contract.',
    )
    console.log(
      `3. You can get a list of contracts by running 'bonadocs collections ${this.contextOptions.collectionDataManager.id} contracts list'`,
    )
    console.log(
      `4. You can get a list of functions in a contract by running 'bonadocs collections ${this.contextOptions.collectionDataManager.id} contracts ContractName functions'`,
    )
  }

  private printAllWidgetConfig(widgetURI: string) {
    console.log('\n\nIn your markdown, add the following as needed:\n\n')
    for (const contract of this.contextOptions.collectionDataManager
      .contractManagerView.contracts) {
      const iface =
        this.contextOptions.collectionDataManager.contractManagerView.getInterface(
          contract.interfaceHash,
        )!

      iface.forEachFunction((fn) => {
        console.log(
          `${contract.name}.${fn.format(
            'sighash',
          )}: <BonadocsWidget widgetConfigUri="${widgetURI}" contract="${
            contract.id
          }" functionKey="${fn.selector}" />\n`,
        )
      })
    }
  }

  private async processFile(file: string, widgetURI: string, edit: boolean) {
    const functionsContracts = this.getFunctionsContracts()
    const files = await glob(file, { nodir: true, dot: true })
    if (!files.length) {
      console.log('No files found matching glob pattern')
      return
    }

    const commonRoot = await this.getCommonRoot(files)
    await Promise.all(
      files.map((f) =>
        this.addWidgetToMarkdownFile(
          commonRoot,
          f,
          widgetURI,
          functionsContracts,
          edit,
        ),
      ),
    )
  }

  private async addWidgetToMarkdownFile(
    commonRoot: string,
    file: string,
    widgetURI: string,
    functionContracts: Map<string, string[]>,
    edit: boolean,
  ) {
    const fs = await import('fs/promises')

    const contents = await this.getFileContentsWithWidgetInserted(
      widgetURI,
      path.relative(commonRoot, file),
      await fs.readFile(file, 'utf-8'),
      functionContracts,
    )

    const fileExtension = path.extname(file)
    const fileName =
      path.basename(file, fileExtension) + (edit ? '' : '-bonadocs')
    await fs.writeFile(
      path.join(path.dirname(file), fileName + fileExtension),
      contents.trim() + '\n',
    )
  }

  private getFunctionsContracts(): Map<string, string[]> {
    const result = new Map<string, string[]>()
    for (const contract of this.contextOptions.collectionDataManager
      .contractManagerView.contracts) {
      const iface =
        this.contextOptions.collectionDataManager.contractManagerView.getInterface(
          contract.interfaceHash,
        )!

      iface.forEachFunction((fn) => {
        const functionKey = fn.format('sighash')
        if (!result.has(functionKey)) {
          result.set(functionKey, [])
        }
        result.get(functionKey)!.push(contract.name)
      })
    }
    return result
  }

  private async getFileContentsWithWidgetInserted(
    widgetURI: string,
    file: string,
    content: string,
    functionsContracts: Map<string, string[]>,
  ): Promise<string> {
    let newContent = ''
    const lines = content.split('\n')
    let isCodeBlock = false
    let currentCodeBlock = ''
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim().startsWith('```')) {
        isCodeBlock = !isCodeBlock
      }

      if (isCodeBlock) {
        currentCodeBlock += line + '\n'
        continue
      } else if (currentCodeBlock) {
        try {
          const functionKey = this.getFunctionKey(currentCodeBlock)!
          const contracts = functionsContracts.get(functionKey)!
          const fileNameWithoutExtension = path.basename(
            file,
            path.extname(file),
          )
          const contract =
            contracts.length === 1
              ? contracts[0]
              : contracts.find(
                  (c) =>
                    c.toLowerCase() === fileNameWithoutExtension.toLowerCase(),
                ) ||
                (await this.promptForContract(functionKey, file, i, contracts))
          const widgetTag = `<BonadocsWidget widgetConfigUri="${widgetURI}" contract="${contract}" functionKey="${functionKey}" />`
          newContent += '\n' + widgetTag + '\n'
        } catch {
          newContent += currentCodeBlock + line + '\n'
        } finally {
          currentCodeBlock = ''
        }
        continue
      }

      newContent += line + '\n'
    }
    return newContent
  }

  private getFunctionKey(codeBlock: string): string | undefined {
    try {
      // trim language section
      codeBlock = codeBlock
        .split('\n')
        .slice(1)
        .join(' ')
        .replace('override', '')
        .replace(/\s+/g, ' ')
        .replace(/;\s*$/, '')
        .trim()
      const fragment = FunctionFragment.from(codeBlock)
      return fragment.format('sighash')
    } catch {
      return undefined
    }
  }

  private async promptForContract(
    functionKey: string,
    file: string,
    line: number,
    contracts: string[],
  ): Promise<string> {
    const answer = (await this.prompt([
      {
        name: 'contract',
        prompt: `Contract for function ${functionKey} on line ${line} of ${file}:`,
        type: 'string',
        choices: contracts.map((c) => ({
          name: c,
          value: c,
        })),
        required: true,
      },
    ])) as { contract?: string }

    if (!answer.contract) {
      throw new Error('Contract is required')
    }
    return answer.contract
  }

  private async getCommonRoot(files: string[]): Promise<string> {
    let commonRoot = path.dirname(files[0])
    for (const file of files) {
      const dir = path.dirname(file)
      while (!dir.startsWith(commonRoot)) {
        commonRoot = path.dirname(commonRoot)
      }
    }
    return commonRoot
  }
}
