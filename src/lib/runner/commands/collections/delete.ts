import {
  deleteCollection,
  getLocalCollections,
} from '../../../integrations/core'
import { PromptOption } from '../../util'
import { CommonOptions } from '../types'

import { CollectionOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class DeleteCollectionCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  CollectionOptions
> {
  get options(): Promise<PromptOption[]> {
    return this.getOptions()
  }

  async process(options: CollectionOptions) {
    await deleteCollection(options.collectionId)
    console.log(`Collection ${options.collectionId} deleted.`)
  }

  private async getOptions(): Promise<PromptOption[]> {
    const collectionWithIds = await getLocalCollections()
    return [
      {
        name: 'collectionId',
        aliases: ['c'],
        prompt: 'Which collection do you want to delete?',
        type: 'string',
        required: true,
        choices: collectionWithIds.map((choice) => {
          return {
            name: choice.name,
            value: choice.id,
          }
        }),
        validationErrorMessage: 'The specified collection does not exist.',
        validate: (value) => {
          return (
            collectionWithIds.some((collection) => collection.id === value) ??
            false
          )
        },
      },
    ]
  }

  protected get commandDescription(): string {
    return 'Delete the collection with the provided id.'
  }
}
