import { CollectionOptions } from '../../types'

import { RouterCommandProcessor, RouterCommandProcessorOptions } from '#router'

export default class RootContractCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<CollectionOptions>
> {
  constructor(
    contextOptions: RouterCommandProcessorOptions<CollectionOptions>,
  ) {
    super(contextOptions)
  }

  get options() {
    return []
  }

  protected get commands() {
    return [
      {
        name: 'list',
        description: `List the contracts in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'add',
        description: `Add a contract to collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'remove',
        description: `Remove a contract from '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'rename',
        description: `Rename a contract in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
    ]
  }

  protected get commandDescription(): string {
    return `Manage the contracts in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`
  }
}
