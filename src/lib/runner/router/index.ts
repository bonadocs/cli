import {
  CommandProcessorBase,
  parseOptions,
  RouterCommandProcessorOptions,
} from '../util'

export abstract class RouterCommandProcessor<
  TContextOptions extends object | RouterCommandProcessorOptions,
  TParsedOptions extends TContextOptions = TContextOptions,
> extends CommandProcessorBase<
  TContextOptions,
  RouterCommandProcessorOptions<TParsedOptions>
> {
  command: string | undefined
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
    commandStack.push(commandName)

    const options = this.parseCommandOptions(commandName)
    if ('then' in options) {
      return options.then((options) => ({
        ...this.contextOptions,
        ...options,
        commandName,
        commandStack,
      }))
    }

    return {
      ...this.contextOptions,
      ...options,
      commandName,
      commandStack,
    }
  }

  async process(
    options: TContextOptions & RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    const command = this.command || ''

    const staticProcessor = await this.tryImportCommandProcessor(options)
    if (staticProcessor) {
      return staticProcessor.run(command)
    }

    const dynamicProcessor =
      await this.tryImportDynamicCommandProcessor(options)
    if (dynamicProcessor) {
      return dynamicProcessor.run(command)
    }

    throw new Error(`Command ${options.commandName} not found`)
  }

  protected parseCommandOptions(
    command: string,
  ): TParsedOptions | Promise<TParsedOptions> {
    const isInteractivityDisabled =
      'disableInteractivity' in this.contextOptions &&
      this.contextOptions.disableInteractivity === 'true'
    return parseOptions(this.options, command, isInteractivityDisabled) as
      | TParsedOptions
      | Promise<TParsedOptions>
  }

  private async tryImportCommandProcessor(
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    const result = await this.tryInstantiateCommandProcessor(
      `#commands/${options.commandStack.join('/')}`,
      options,
    )

    return (
      result ||
      (await this.tryInstantiateCommandProcessor(
        `#commands/${options.commandStack.join('/')}/index`.replace('//', '/'),
        options,
      ))
    )
  }

  private async tryImportDynamicCommandProcessor(
    options: RouterCommandProcessorOptions<TParsedOptions>,
  ) {
    const result = await this.tryInstantiateCommandProcessor(
      `#commands/${
        options.commandStack.slice(0, -1).join('/') + '/[id]'
      }`.replace('//', '/'),
      options,
    )
    return (
      result ||
      (await this.tryInstantiateCommandProcessor(
        `#commands/${
          options.commandStack.slice(0, -1).join('/') + '/[id]/index'
        }`.replace('//', '/'),
        options,
      ))
    )
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
    } catch (e) {
      if (
        !!e &&
        typeof e === 'object' &&
        'code' in e &&
        e.code === 'MODULE_NOT_FOUND'
      ) {
        return null
      }

      console.error(e)
      return null
    }
  }
}
