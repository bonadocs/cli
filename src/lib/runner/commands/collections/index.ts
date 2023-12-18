import { RouterCommandProcessor } from '../../router'
import { CommonOptions } from '../types'

export default class RootCollectionsCommandProcessor extends RouterCommandProcessor<CommonOptions> {
  get options() {
    return []
  }

  get help() {
    return `Usage collections <command> [options]

Commands:
  create                          Create collection
  delete                          Delete collection
  list                            List collections
  rename                          Rename collection
  [id]                            Manage collection with id

Options:
  -I, --disable-interactivity     Disable interactivity

Get options for a specific command with:
  bonadocs <command> --help
`
  }
}
