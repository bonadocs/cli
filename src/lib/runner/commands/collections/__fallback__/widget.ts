import { CollectionOptions } from './types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type WidgetOptions = {
  workflowId?: string
  printAll?: boolean
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
    console.log('\n\nIn your markdown, add the following:\n\n')

    if (options.workflowId) {
      console.log(`<BonadocsWidget widgetConfigUri="${widgetURI}" />`)
      return
    }

    if (!options.printAll) {
      this.printInstructions(widgetURI)
      return
    }

    this.printAllWidgetConfig(widgetURI)
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
}
