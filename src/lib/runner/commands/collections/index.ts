import { RouterCommandProcessor } from '../../router'
import { PromptOption, RouterCommandProcessorOptions } from '../../util'
import { CommonOptions } from '../types'

export default class RootCollectionCommandProcessor extends RouterCommandProcessor<CommonOptions> {
  get options(): PromptOption[] {
    return []
  }

  async process(options: RouterCommandProcessorOptions<CommonOptions>) {
    try {
      await super.process(options)
    } catch {
      console.log(this.help)
    }
  }

  get help() {
    return `Usage collections <command> [options]

Commands:
  create                          Create collection
  delete                          Create collection
  list                            Create collection
  rename                          Create collection

Options:
  -I, --disable-interactivity     Disable interactivity

Get options for a specific command with:
  bonadocs <command> --help
`
  }
}
