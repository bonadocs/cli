import { CollectionOptions } from '../../types'

import { RoutedProcessorBase } from '#commands'

export default class ListContractsCommandProcessor extends RoutedProcessorBase<CollectionOptions> {
  get options() {
    return []
  }

  async process() {
    const contracts =
      this.contextOptions.collectionDataManager.contractManagerView.contracts

    console.log('Listing contracts:')
    for (const contract of contracts) {
      console.log(`${contract.name} (${contract.id})`)
    }
  }

  protected get commandDescription(): string {
    return 'List all collections on this device'
  }
}
