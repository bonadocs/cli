import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { loadCollectionFromURI } from '#integrations/core'
import { PromptOption } from '#util'

type LoadCollectionOptions = {
  uri: string
} & CommonOptions

export default class LoadCollectionCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  LoadCollectionOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'uri',
        aliases: ['u'],
        prompt: 'Collection URI:',
        type: 'string',
        required: true,
        validate: (value) => {
          if (typeof value !== 'string' || value.trim().length === 0) {
            return false
          }

          try {
            new URL(value)
            return true
          } catch {
            return false
          }
        },
      },
    ]
  }

  async process(options: LoadCollectionOptions) {
    const collection = await loadCollectionFromURI(options.uri)
    console.log(
      `Loaded collection ${collection.metadataView.name} (${collection.id})`,
    )
  }

  protected get commandDescription(): string {
    return 'Load a new collection with the provided name and description.'
  }
}
