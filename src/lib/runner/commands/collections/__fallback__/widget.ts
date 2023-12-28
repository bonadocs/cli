import { CollectionOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class DisplayCollectionCommandProcessor extends RoutedProcessorBase<CollectionOptions> {
  get options() {
    return []
  }

  async process() {
    const functions = [await this.promptForContractFunction()]
    while (await this.promptForAdditionalFunction()) {
      functions.push(await this.promptForContractFunction())
      console.log('Added function')
    }

    console.log('Generating widget')
    const widgetURI =
      await this.contextOptions.collectionDataManager!.contractManagerView.generateWidget(
        functions,
      )

    console.log('Widget generated\n')
    console.log('Widget URI: ', widgetURI)
    console.log('\n\nIn your markdown, add the following:\n\n')
    console.log(`<BonadocsWidget widgetConfigUri="${widgetURI}" />`)
  }

  protected get commandDescription(): string {
    return 'Generate a widget from this collection.'
  }

  private async promptForAdditionalFunction(): Promise<boolean> {
    const answer = (await this.prompt([
      {
        name: 'add',
        aliases: ['a'],
        prompt: 'Add another function?',
        type: 'boolean',
        required: true,
      },
    ])) as { add: boolean }
    return answer.add
  }

  private async promptForContractFunction(): Promise<string> {
    const contractAnswer = (await this.prompt([
      {
        name: 'contract',
        aliases: ['c'],
        prompt: 'Choose Contract:',
        type: 'string',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager!.contractManagerView
            .contracts,
        ].map((contract) => ({
          name: contract.name,
          value: contract.id,
        })),
      },
    ])) as { contract: string }
    if (!contractAnswer.contract) {
      throw new Error('Contract is required')
    }
    const contract =
      this.contextOptions.collectionDataManager!.contractManagerView.getContract(
        contractAnswer.contract,
      )
    if (!contract) {
      throw new Error(`Contract '${contractAnswer.contract}' not found`)
    }

    const functionAnswer = (await this.prompt([
      {
        name: 'func',
        aliases: ['f'],
        prompt: 'Choose Function:',
        type: 'string',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.getContractDetailsView(
            contract.id,
          ).functions,
        ].map((func) => ({
          name: func.signature,
          value: func.fragmentKey,
        })),
      },
    ])) as { func: string }

    if (!functionAnswer.func) {
      throw new Error('Function is required')
    }
    return functionAnswer.func
  }
}
