import { CollectionOptions } from '../../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type RenameContractOptions = {
  contractId: string
  name: string
} & CollectionOptions

export default class RenameContractCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  RenameContractOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'contractId',
        aliases: ['c'],
        prompt: 'Which contract do you want to rename?',
        type: 'string',
        description: 'The contract to rename',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.contractManagerView
            .contracts,
        ].map((contract) => ({
          name: contract.name,
          value: contract.id,
        })),
      },
      {
        name: 'name',
        aliases: ['n'],
        prompt: 'New name for the contract:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
    ]
  }

  async process(options: RenameContractOptions) {
    const contract =
      this.contextOptions.collectionDataManager.contractManagerView.getContract(
        options.contractId,
      )

    if (!contract) {
      throw new Error(`Contract ${options.contractId} not found.`)
    }

    const oldName = contract.name
    this.contextOptions.collectionDataManager.contractManagerView.renameContract(
      contract.id,
      options.name,
    )
    console.log(`Contract ${oldName} renamed to ${options.name}.`)
  }

  protected get commandDescription(): string {
    return 'Rename the collection with the provided id.'
  }
}
