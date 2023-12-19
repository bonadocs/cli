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
  }

  protected get commandDescription(): string {
    return 'Create a new collection with the provided name and description.'
  }
}
