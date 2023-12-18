import { hideBin } from 'yargs/helpers'

import { RouterCommandProcessor } from '../router'
import { PromptOption, RouterCommandProcessorOptions } from '../util'

import { CommonOptions } from './types'

export function runStandalone() {
  runCommand(hideBin(process.argv).join(' '))
}

export function runCommand(command: string) {
  const processor = new EntryCommandProcessor()
  processor.run(command).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

class EntryCommandProcessor extends RouterCommandProcessor<
  object,
  CommonOptions
> {
  constructor() {
    super({})
  }

  get options(): PromptOption[] {
    return [
      {
        name: 'disable-interactivity',
        aliases: ['I'],
        prompt: 'Do you want to disable interactivity?',
        type: 'boolean',
        default: false,
      },
      {
        name: 'help',
        aliases: ['h'],
        prompt: 'Show help message?',
        type: 'boolean',
        default: false,
      },
    ]
  }

  async process(
    options: Record<string, never> &
      RouterCommandProcessorOptions<CommonOptions>,
  ): Promise<void> {
    if (!options.commandName) {
      console.log(this.help)
      return
    }

    return super.process(options)
  }

  get help() {
    return `Usage bonadocs <command> [options]

Commands:
  collections                     Manage collections

Options:
  -I, --disable-interactivity     Disable interactivity

Get options for a specific command with:
  bonadocs <command> --help
`
  }
}
