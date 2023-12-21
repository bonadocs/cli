import { CollectionOptions } from '../types'

import { CommandDescription } from '#commands'
import { getLocalCollections, loadCollectionById } from '#integrations/core'
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

    const commandNameIndex =
      this.contextOptions.commandStack.findIndex((c) => c === 'collections') + 1

    if (commandNameIndex === 0) {
      throw new Error(
        '[FATAL] Invalid command stack. Expected collections command.',
      )
    }

    const commandName = this.contextOptions.commandStack[commandNameIndex]
    const collection = localCollections.find(
      (collection) =>
        collection.id.toLowerCase() === commandName.toLowerCase() ||
        collection.name.toLowerCase().includes(commandName.toLowerCase()),
    )

    if (!collection) {
      throw new Error(`Collection ${commandName} not found`)
    }
    this.contextOptions.collectionDataManager = await loadCollectionById(
      collection.id,
    )
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

  protected get commandDescription(): string {
    return `Manage collection '${this.contextOptions.collectionDataManager.metadataView.name}'`
  }
}
