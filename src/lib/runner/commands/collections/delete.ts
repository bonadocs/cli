import { PromptOption, RoutedProcessorBase } from '../../util'
import { CommonOptions } from '../types'

import { CollectionOptions } from './types'

type CollectionWithId = {
  id: string
  name: string
}

export default class DeleteCollectionCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  CollectionOptions
> {
  get options(): Promise<PromptOption[]> {
    return this.getOptions()
  }

  async process(options: CollectionOptions) {
    console.log('Deleting collection', options)
  }

  private async getOptions(): Promise<PromptOption[]> {
    const choices = await this.getCollectionsWithIds()
    return [
      {
        name: 'collection-id',
        aliases: ['c'],
        prompt: 'Which collection do you want to delete?',
        type: 'string',
        required: true,
        choices: choices.map((choice) => {
          return {
            name: choice.name,
            value: choice.id,
          }
        }),
        validationErrorMessage: 'The specified collection does not exist.',
        validate: (value) => {
          return choices.some((collection) => collection.id === value) ?? false
        },
      },
    ]
  }

  private async getCollectionsWithIds(): Promise<CollectionWithId[]> {
    return [
      {
        id: 'collection1',
        name: 'Collection 1',
      },
      {
        id: 'collection2',
        name: 'Collection 2',
      },
      {
        id: 'collection3',
        name: 'Collection 3',
      },
    ]
  }

  get help() {
    return `Delete the collection with the provided id.

Options
  --id <id>           The id of the collection to be deleted
`
  }
}
