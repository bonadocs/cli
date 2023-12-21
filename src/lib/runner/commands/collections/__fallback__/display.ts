import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

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
    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(options.collectionDataManager.data, null, 2))
        break
      case 'json-minified':
        console.log(JSON.stringify(options.collectionDataManager.data))
        break
      default:
        throw new Error(
          `Unknown format '${options.format}'. Supported formats are 'json' and 'json-minified'`,
        )
    }
  }

  protected get commandDescription(): string {
    return 'Create a new collection with the provided name and description.'
  }
}
