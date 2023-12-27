import { CollectionDataManager } from '@bonadocs/core'

import { CollectionOptions } from './types'

import { CommandDescription } from '#commands'
import {
  CollectionWithId,
  getLocalCollections,
  loadCollectionById,
} from '#integrations/core'
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
    this.contextOptions.collectionDataManager =
      await this.getCollectionDataManager()
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
      {
        name: 'widget',
        description: 'Generate a widget from this collection',
      },
    ]
  }

  protected get commandDescription(): string {
    return `Manage collection '${
      this.contextOptions.collectionDataManager?.metadataView.name ||
      '[not found]'
    }'`
  }

  private async getCollectionDataManager(): Promise<CollectionDataManager> {
    const localCollections = await getLocalCollections()

    const commandNameIndex =
      this.contextOptions.commandStack.findIndex((c) => c === 'collections') + 1

    if (commandNameIndex === 0) {
      throw new Error(
        '[FATAL] Invalid command stack. Expected collections command.',
      )
    }

    const commandName = this.contextOptions.commandStack[commandNameIndex]
    const collection = await this.getCollectionFromCommandName(
      localCollections,
      commandName,
    )
    return loadCollectionById(collection.id)
  }

  private async getCollectionFromCommandName(
    localCollections: CollectionWithId[],
    commandName: string,
  ) {
    const collection = localCollections.find(
      (collection) => collection.id.toLowerCase() === commandName.toLowerCase(),
    )

    if (collection) {
      return collection
    }

    const filteredCollections = localCollections.filter((collection) =>
      collection.name.toLowerCase().includes(commandName.toLowerCase()),
    )

    if (filteredCollections.length === 0) {
      throw new Error(`Collection ${commandName} not found`)
    }

    if (filteredCollections.length === 1) {
      return filteredCollections[0]
    }

    return this.promptForCollection(filteredCollections)
  }

  private async promptForCollection(filteredCollections: CollectionWithId[]) {
    const answer = (await this.prompt([
      {
        name: 'collectionId',
        aliases: ['c'],
        type: 'string',
        prompt: `Multiple collections match the provided name. Select collection:`,
        required: true,
        choices: filteredCollections.map((collection) => ({
          name: `${collection.name} (${collection.id})`,
          value: collection.id,
        })),
      },
    ])) as { collectionId?: string }

    if (!answer.collectionId) {
      throw new Error('No collection selected')
    }

    return filteredCollections.find(
      (collection) => collection.id === answer.collectionId,
    )!
  }
}
