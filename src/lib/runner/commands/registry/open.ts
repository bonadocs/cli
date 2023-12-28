import { Collection, deepSearch } from '@bonadocs/core'

import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { getLocalCollections } from '#integrations/core'
import { PromptOption } from '#util'

type OpenProtocolOptions = {
  slug: string
  force?: boolean
} & CommonOptions

export default class OpenProtocolCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  OpenProtocolOptions
> {
  get options(): Promise<PromptOption[]> {
    return this.getOptions()
  }

  async process(options: OpenProtocolOptions) {
    const results = await deepSearch({
      q: options.slug,
      pageSize: 30,
    })

    const protocol = results.items.find(
      (result) => result.slug.toLowerCase() === options.slug.toLowerCase(),
    )

    if (!protocol) {
      throw new Error(`Protocol not found: ${options.slug}`)
    }

    const collection = await Collection.createFromURI(protocol.collection)
    const localCollections = await getLocalCollections()
    const matchingLocalCollection = localCollections.find(
      (localCollection) =>
        localCollection.id === collection.manager.id ||
        localCollection.name.toLowerCase() ===
          collection.manager.metadataView.name.toLowerCase(),
    )

    if (!matchingLocalCollection || options.force) {
      await collection.manager.saveToLocal()
      console.log(
        `Protocol ${options.slug} saved locally as ${collection.manager.metadataView.name} (${collection.manager.id})`,
      )
      return
    }

    if (matchingLocalCollection.id === collection.manager.id) {
      console.log(
        `Protocol ${options.slug} already exists locally (${collection.manager.id}). Use --force to overwrite.`,
      )
      return
    }

    const timestampSuffix = new Date().toISOString().replace(/\D+/g, '')
    const newName = `${collection.manager.metadataView.name}-${timestampSuffix}`
    await collection.manager.metadataView.rename(newName)
    await collection.manager.saveToLocal()
    console.log(
      `Protocol ${options.slug} saved locally as ${newName} (${collection.manager.id})`,
    )
  }

  protected get commandDescription(): string {
    return 'Load a new collection with the provided name and description.'
  }

  private async getOptions(): Promise<PromptOption[]> {
    return [
      {
        name: 'slug',
        aliases: ['s'],
        description: 'The protocol slug',
        prompt: 'Slug:',
        type: 'string',
        required: true,
      },
      {
        name: 'force',
        aliases: ['f'],
        description: 'Overwrite existing collection',
        prompt: 'Overwrite existing collection?',
        type: 'boolean',
        default: false,
      },
    ]
  }
}
