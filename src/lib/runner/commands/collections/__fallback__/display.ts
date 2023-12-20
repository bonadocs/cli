import { loadCollectionById } from '../../../../integrations/core'
import { PromptOption } from '../../../util'
import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'

type DisplayCollectionOptions = {
  format: string
} & CollectionOptions

export default class DisplayCollectionCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  DisplayCollectionOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'format',
        aliases: ['f'],
        prompt: 'Format:',
        type: 'string',
        choices: ['json', 'json-minified'],
        default: 'json',
        required: true,
      },
    ]
  }

  async process(options: DisplayCollectionOptions) {
    console.log(
      `Displaying collection ${options.collectionId} using format ${options.format}`,
    )

    const collection = await loadCollectionById(options.collectionId)
    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(collection.data, null, 2))
        break
      case 'json-minified':
        console.log(JSON.stringify(collection.data))
        break
      default:
        console.error(
          `Unknown format '${options.format}'. Supported formats are 'json' and 'json-minified'`,
        )
    }
  }

  protected get commandDescription(): string {
    return 'Create a new collection with the provided name and description.'
  }
}
