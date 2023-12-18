﻿import { getLocalCollections } from '../../../integrations/core'
import { PromptOption, RoutedProcessorBase } from '../../util'
import { CommonOptions } from '../types'

import { CollectionOptions } from './types'

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
    const collectionWithIds = await getLocalCollections()
    return [
      {
        name: 'collection-id',
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

  get help() {
    return `Delete the collection with the provided id.

Options
  --id <id>           The id of the collection to be deleted
`
  }
}