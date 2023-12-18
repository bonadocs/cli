import inquirer, { InputQuestion, Question } from 'inquirer'
import yargs, { Choices, Options } from 'yargs'

type PrimitiveOptionValue = string | number | boolean
type OptionValue = PrimitiveOptionValue | PrimitiveOptionValue[]

export type RouterCommandProcessorOptions<
  T extends object = Record<string, never>,
> = {
  commandName: string
  commandStack: string[]
} & T

export type PromptOption = {
  name: string
  aliases: string[]
  prompt: string
  description?: string
  required?: boolean
  choices?: Choices
} & (
  | {
      type: 'string'
      default?: string
    }
  | {
      type: 'number'
      default?: number
    }
  | {
      type: 'boolean'
      default?: boolean
    }
  | {
      type: 'array'
      default: PrimitiveOptionValue[]
      delimiter?: string
    }
)

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
    const options = {
      ...this.contextOptions,
      ...(await this.parseOptions(command)),
    }

    await this.process(options)
  }

  abstract get help(): string

  abstract get options(): PromptOption[]

  parseOptions(command: string): TParsedOptions | Promise<TParsedOptions> {
    const isInteractivityDisabled =
      'disableInteractivity' in this.contextOptions &&
      this.contextOptions.disableInteractivity === 'false'
    return parseOptions(this.options, command, isInteractivityDisabled) as
      | TParsedOptions
      | Promise<TParsedOptions>
  }

  async process(options: TContextOptions & TParsedOptions): Promise<void> {
    if ('help' in options && options.help) {
      console.log(this.help)
      return
    }
  }
}

export abstract class RoutedProcessorBase<
  TContextOptions extends object,
  TParsedOptions extends TContextOptions,
> extends CommandProcessorBase<
  RouterCommandProcessorOptions<TContextOptions>,
  RouterCommandProcessorOptions<TParsedOptions>
> {}

export function parseOptions<T>(
  promptOptions: PromptOption[],
  command: string,
  isInteractivityDisabled: boolean,
): T | Promise<T> {
  const options = yargs(command)
    .options(
      promptOptions.reduce(
        (options, option) => {
          options[option.name] = {
            alias: option.aliases,
            description: option.description,
            type: option.type,
            default: option.default,
          }
          return options
        },
        {} as Record<string, Options>,
      ),
    )
    .parse()

  if (isInteractivityDisabled) {
    return options as T | Promise<T>
  }

  if ('then' in options) {
    return (options as Promise<Record<string, OptionValue>>).then(
      (parsedOptions: Record<string, OptionValue>) =>
        promptUserForOptions(promptOptions, parsedOptions),
    )
  }

  return promptUserForOptions(
    promptOptions,
    options as Record<string, OptionValue>,
  )
}

async function promptUserForOptions<T>(
  promptOptions: PromptOption[],
  parsedOptions: Record<string, OptionValue>,
): Promise<T> {
  const pendingOptions = []
  for (const option of promptOptions) {
    if (parsedOptions[option.name] != null) {
      continue
    }

    pendingOptions.push(option)
  }

  const answers = await showPrompt(pendingOptions)

  return {
    ...parsedOptions,
    ...answers,
  } as T
}

function showPrompt(
  options: PromptOption[],
): Promise<Record<string, OptionValue>> {
  const questions: Question[] = options.map((option) => ({
    name: option.name,
    message: option.prompt,
    default: option.default,
    ...mapTypeBasedParams(option),
  }))
  return inquirer.prompt(questions)
}

function mapTypeBasedParams(option: PromptOption): Partial<Question> {
  const { type, choices } = option
  const params: Partial<Question | InputQuestion> = {
    type: 'input',
  }
  switch (type) {
    case 'number':
      params.type = 'number'
      break
    case 'boolean':
      params.type = 'confirm'
      break
  }

  if (choices) {
    params.type = type === 'array' ? 'checkbox' : 'list'
  }

  if (type === 'array' && params.type === 'input') {
    const inputParams = params as InputQuestion
    inputParams.transformer = (input) => {
      return input
        .split(option.delimiter || ',')
        .map((s: string | number) => (typeof s === 'string' ? s.trim() : s))
        .filter(
          (s: string | number) =>
            s != null && (typeof s !== 'string' || s.length),
        )
    }
  }

  return params
}
