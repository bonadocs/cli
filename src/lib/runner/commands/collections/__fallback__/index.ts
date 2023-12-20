import { CollectionOptions } from '../types'

import { CommandDescription } from '#commands'
import { getLocalCollections } from '#integrations/core'
import { RouterCommandProcessor, RouterCommandProcessorOptions } from '#router'

export default class RootCollectionCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<CollectionOptions>
> {
  constructor(
    contextOptions: RouterCommandProcessorOptions<CollectionOptions>,
  ) {
    super(contextOptions)
  }

  async setup(): Promise<void> {
    await super.setup()
    const localCollections = await getLocalCollections()

    const collection = localCollections.find(
      (collection) =>
        collection.id.toLowerCase() ===
          this.contextOptions.commandName.toLowerCase() ||
        collection.name
          .toLowerCase()
          .includes(this.contextOptions.commandName.toLowerCase()),
    )

    if (!collection) {
      throw new Error(`Collection ${this.contextOptions.commandName} not found`)
    }
    this.contextOptions.collectionId = collection.id
  }

  get options() {
    return []
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'contracts',
        description: 'Manage contracts in this collection',
      },
      {
        name: 'workflows',
        description: 'Manage workflows in this collection',
      },
      {
        name: 'display',
        description: 'Display this collection',
      },
    ]
  }
}
