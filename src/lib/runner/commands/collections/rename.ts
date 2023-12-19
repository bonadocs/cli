import {
  getLocalCollections,
  renameCollection,
} from '../../../integrations/core'
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
    const collections = await getLocalCollections()
    const collection = collections.find(
      (collection) => collection.id === options.collectionId,
    )
    if (!collection) {
      console.error('Collection not found')
      return
    }

    await renameCollection(options.collectionId, options.name)
    console.log(
      `Renamed collection ${collection.name} to ${options.name} (${options.collectionId})`,
    )
  }

  get help() {
    return `Rename the collection with the specified id to name

Options
  --collection-id | -c <id>       Id of the collection to rename
  --name | -n <name>              New name to set
`
  }
}
