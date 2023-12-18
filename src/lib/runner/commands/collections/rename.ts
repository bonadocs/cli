import { getLocalCollections } from '../../../integrations/core'
import { PromptOption, RoutedProcessorBase } from '../../util'
import { CommonOptions } from '../types'

type RenameCollectionOptions = {
  collectionId: string
  name: string
} & CommonOptions

export default class RenameCollectionCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  RenameCollectionOptions
> {
  get options(): Promise<PromptOption[]> {
    return this.getOptions()
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
      {
        name: 'name',
        aliases: ['n'],
        prompt: 'New name for the collection:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
    ]
  }

  async process(options: RenameCollectionOptions) {
    console.log('Renaming collection', options)
  }

  get help() {
    return `Rename a new collection with the provided name and description.

Options
  --name <name>           Name of the collection
  --description <desc>    Description of the collection
`
  }
}
