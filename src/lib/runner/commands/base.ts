import { RouterCommandProcessorOptions } from '#router'
import {
  executeWithValue,
  parseOptions,
  PromptOption,
  promptUserForOptions,
} from '#util'

/**
 * A CommandProcessor is expected to be exported as a default export
 * from the file that defines the command. The subclass constructor
 * must match the definition of the CommandProcessorBase constructor.
 */
export abstract class CommandProcessorBase<
  TContextOptions extends object,
  TParsedOptions extends TContextOptions,
> {
  protected constructor(protected readonly contextOptions: TContextOptions) {}

  async run(command: string) {
    try {
      await this.setup()

      const options = {
        ...this.contextOptions,
        ...(await this.parseOptions(command)),
      }

      if (this.enableExplicitHelp && 'help' in options && options.help) {
        this.printHelp()
        return
      }

      await this.process(options)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('\n\nHelp:\n')) {
        throw new Error(`${err.message}\n\nHelp:\n${await this.help}`)
      } else {
        throw err
      }
    }
  }

  async setup() {}

  get enableExplicitHelp(): boolean {
    return true
  }

  get help(): string | Promise<string> {
    return executeWithValue(this.options, (options) => {
      return this.joinHelpParts([
        this.commandDescription,
        this.getUsageString(options),
        this.getOptionsHelp(options),
      ])
    })
  }

  protected async prompt(
    promptOptions: PromptOption[],
  ): Promise<Partial<TParsedOptions>> {
    const isInteractivityDisabled =
      'disableInteractivity' in this.contextOptions &&
      this.contextOptions.disableInteractivity === true

    if (isInteractivityDisabled) {
      return {}
    }

    return await promptUserForOptions<TParsedOptions>(promptOptions, {})
  }

  protected joinHelpParts(
    parts: Array<string | undefined>,
    separator = '\n\n',
  ): string {
    return parts.filter((part) => part?.trim()).join(separator)
  }

  printHelp() {
    executeWithValue(this.help, (help) => console.log('\n' + help))
  }

  protected abstract get commandDescription(): string

  protected getUsageString(options: PromptOption[]): string {
    if (
      'commandStack' in this.contextOptions &&
      Array.isArray(this.contextOptions.commandStack) &&
      this.contextOptions.commandStack.length
    ) {
      return `Usage: bonadocs ${this.contextOptions.commandStack.join(' ')}${
        options.length ? ' [options]' : ''
      }`
    }

    return ''
  }

  protected getOptionsHelp(options: PromptOption[]): string {
    let help = ''
    if (options.length) {
      help += 'Options:\n'
      for (const option of options) {
        const aliases = option.aliases.length
          ? `-${option.aliases.join(', ')}`
          : ''
        help += `  --${option.name}, ${aliases}  ${option.description}\n`
      }
    }

    return help
  }

  protected abstract get options(): PromptOption[] | Promise<PromptOption[]>

  protected parseOptions(
    command: string,
  ): TParsedOptions | Promise<TParsedOptions> {
    const isInteractivityDisabled =
      'disableInteractivity' in this.contextOptions &&
      this.contextOptions.disableInteractivity === true
    return executeWithValue(this.options, (options) =>
      parseOptions<TParsedOptions>(options, command, isInteractivityDisabled),
    )
  }

  abstract process(_: TParsedOptions): Promise<void>
}

export abstract class RoutedProcessorBase<
  TContextOptions extends object,
  TParsedOptions extends TContextOptions = TContextOptions,
> extends CommandProcessorBase<
  RouterCommandProcessorOptions<TContextOptions>,
  RouterCommandProcessorOptions<TParsedOptions>
> {}
