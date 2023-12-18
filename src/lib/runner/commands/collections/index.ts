import { RouterCommandProcessor } from '../../router'
import { PromptOption } from '../../util'
import { CommonOptions } from '../types'

export default class RootCollectionCommandProcessor extends RouterCommandProcessor<CommonOptions> {
  get options(): PromptOption[] {
    return []
  }

  get help() {
    return `Usage collections <command> [options]

Commands:
  create                          Create collection
  delete                          Delete collection
  list                            List collections
  rename                          Rename collection

Options:
  -I, --disable-interactivity     Disable interactivity

Get options for a specific command with:
  bonadocs <command> --help
`
  }
}
