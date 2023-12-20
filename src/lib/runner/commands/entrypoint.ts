import { executeWithValue, PromptOption } from '../util'

import { CommandDescription, CommonOptions } from './types'

import { RouterCommandProcessor } from '#router'

export class EntryCommandProcessor extends RouterCommandProcessor<
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

  get help(): string | Promise<string> {
    return executeWithValue(super.help, (help) => {
      return this.joinHelpParts([
        `Welcome to the Bonadocs CLI!
Follow the usage instructions below to get started.

Usage: bonadocs <command> [options]
`,
        help,
      ])
    })
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'collections',
        description: 'Manage collections',
      },
    ]
  }
}
