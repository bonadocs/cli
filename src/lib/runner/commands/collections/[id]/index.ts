import { RouterCommandProcessor } from '../../../router'
import { RouterCommandProcessorOptions } from '../../../util'
import { CollectionOptions } from '../types'

export default class RootCollectionCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<CollectionOptions>
> {
  constructor(
    contextOptions: RouterCommandProcessorOptions<CollectionOptions>,
  ) {
    super(contextOptions)

    // set the collection id from the command. [id] in the path is the command name
    contextOptions.collectionId = contextOptions.commandName
  }
  get options() {
    return []
  }

  get help() {
    return `Usage ${this.contextOptions.collectionId} <command> [options]

Commands:
  contracts                       Manage contracts in collection
  workflows                       Manage workflows in collection
  print                           Print collection as json

Options:
  -I, --disable-interactivity     Disable interactivity

Get options for a specific command with:
  bonadocs <command> --help
`
  }
}
