import * as path from 'path'

import {
  executeWithValue,
  parseOptions,
  PromptOption,
  RouterCommandProcessorOptions,
} from '../util'

import { findCommandProcessorModule } from './util'

import {
  CommandDescription,
  CommandProcessorBase,
  fileName as commandsRootFileName,
} from '#commands'

export abstract class RouterCommandProcessor<
  TContextOptions extends object | RouterCommandProcessorOptions,
  TParsedOptions extends TContextOptions = TContextOptions,
> extends CommandProcessorBase<
  TContextOptions,
  RouterCommandProcessorOptions<TParsedOptions>
> {
  command: string | undefined

  get enableExplicitHelp(): boolean {
    return false
  }

  get help(): string | Promise<string> {
    return executeWithValue(this.options, (options) => {
      return this.joinHelpParts([
        this.commandDescription,
        this.getUsageString(options),
        this.getCommandHelp(),
        this.getOptionsHelp(options),
      ])
    })
  }

  protected getUsageString(options: PromptOption[]): string {
    return super.getUsageString(options) + ' <command> [options]'
  }

  parseOptions(command: string) {
    command = command.trim()
    const indexOfSpace = command.indexOf(' ')
    const commandName =
      indexOfSpace === -1 ? command : command.slice(0, indexOfSpace)
    this.command = indexOfSpace === -1 ? '' : command.slice(indexOfSpace + 1)

    const commandStack: string[] = []
    if (
      'commandStack' in this.contextOptions &&
      this.contextOptions.commandStack
    ) {
      commandStack.push(...this.contextOptions.commandStack)
    }
    if (commandName) {
      commandStack.push(commandName)
    }

    const options = this.parseCommandOptions(command)
    return executeWithValue(options, (options) => ({
      ...this.contextOptions,
      ...options,
      commandName,
      commandStack,
    }))
  }

  async process(options: RouterCommandProcessorOptions<TParsedOptions>) {
    try {
      if (!options.commandName) {
        this.printHelp()
        return
      }

      const command = this.command || ''

      let processor = await this.tryImportCommandProcessor(options)
      if (!processor) {
        processor = await this.tryImportDynamicCommandProcessor(options)
      }

      // When the command is empty and the current command is a router
      if (!processor) {
        console.log(`Command '${options.commandName}' not found`)
        this.printHelp()
        return
      }

      return processor.run(command)
    } catch {
      this.printHelp()
    }
  }

  protected get commandDescription(): string {
    return ''
  }

  protected abstract get commands(): CommandDescription[]

  protected parseCommandOptions(
    command: string,
  ): TParsedOptions | Promise<TParsedOptions> {
    const isInteractivityDisabled =
      'disableInteractivity' in this.contextOptions &&
      this.contextOptions.disableInteractivity === 'true'
    return executeWithValue(this.options, (options) =>
      parseOptions<TParsedOptions>(options, command, isInteractivityDisabled),
    )
  }

  private getCommandHelp(): string {
    if (!this.commands.length) {
      return ''
    }

    return (
      'Commands:\n' +
      this.commands
        .map((command) => {
          return `  ${command.name.padEnd(30)} ${command.description}`
        })
        .join('\n')
    )
  }

  private tryImportCommandProcessor(
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    return this.tryInstantiateCommandProcessor(
      `#commands/${options.commandStack.join('/')}`,
      options,
    )
  }

  private async tryImportDynamicCommandProcessor(
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    const root = path.dirname(commandsRootFileName)
    const moduleName = await findCommandProcessorModule(
      root,
      options.commandStack,
    )

    if (!moduleName) {
      return null
    }
    return this.tryInstantiateCommandProcessor(moduleName, options)
  }

  private async instantiateCommandProcessor(
    moduleName: string,
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    const processorModule = await import(moduleName)
    const processor = new processorModule.default(options)
    if (!(processor instanceof CommandProcessorBase)) {
      console.error(
        `Command processor for ${options.commandName} does not extend CommandProcessorBase`,
      )
      return null
    }
    return processor
  }

  private async tryInstantiateCommandProcessor(
    moduleName: string,
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    try {
      return await this.instantiateCommandProcessor(moduleName, options)
    } catch {
      try {
        return await this.instantiateCommandProcessor(
          moduleName + '/index',
          options,
        )
      } catch {
        return null
      }
    }
  }
}
