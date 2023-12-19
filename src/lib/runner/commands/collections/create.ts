import { createCollection } from '../../../integrations/core'
import { PromptOption } from '../../util'
import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'

type CreateCollectionOptions = {
  name: string
  description: string
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
    const manager = await createCollection(options.name, options.description)
    console.log(`Created collection ${options.name} (${manager.id})`)
  }

  protected get commandDescription(): string {
    return 'Create a new collection with the provided name and description.'
  }
}
