﻿import * as path from 'path'

import { findCommandProcessorModule } from './util'

import {
  CommandDescription,
  CommandProcessorBase,
  fileName as commandsRootFileName,
} from '#commands'
import { executeWithValue, parseOptions, PromptOption } from '#util'

export type RouterCommandProcessorOptions<
  T extends object = Record<string, never>,
> = {
  commandName: string
  commandStack: string[]
} & T

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
    if (!options.commandName) {
      this.printHelp()
      return
    }

    const command = this.command || ''

    const processor = await this.loadCommandProcessor(options)

    // When the command is empty and the current command is a router
    if (!processor) {
      throw new Error(`Command '${options.commandName}' not found`)
    }
    return processor.run(command)
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

  private async loadCommandProcessor(
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
      throw new Error(
        `Command processor for ${options.commandName} does not extend CommandProcessorBase`,
      )
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
        // we have to explicitly add /index because we are using
        // subpath imports without extensions
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
