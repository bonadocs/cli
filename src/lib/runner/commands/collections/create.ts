﻿import { PromptOption, RoutedProcessorBase } from '../../util'
import { CommonOptions } from '../types'

type CreateCollectionOptions = {
  name?: string
  description?: string
} & CommonOptions

export default class CreateCollectionCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  CreateCollectionOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'name',
        aliases: ['n'],
        prompt: 'Name:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
      {
        name: 'description',
        aliases: ['d'],
        prompt: 'Description:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
    ]
  }

  async process(options: CreateCollectionOptions) {
    console.log('Creating collection', options)
  }

  get help() {
    return `Create a new collection with the provided name and description.

Options
  --name <name>           Name of the collection
  --description <desc>    Description of the collection
`
  }
}