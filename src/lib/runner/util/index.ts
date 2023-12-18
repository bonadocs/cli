import inquirer, { InputQuestion, Question } from 'inquirer'
import yargs, { Options } from 'yargs'

type PrimitiveOptionValue = string | number | boolean
type OptionValue = PrimitiveOptionValue | PrimitiveOptionValue[]

export type RouterCommandProcessorOptions<
  T extends object = Record<string, never>,
> = {
  commandName: string
  commandStack: string[]
} & T

export type Choice =
  | string
  | number
  | {
      name: string
      value: string | number
    }

export type PromptOption = {
  name: string
  aliases: string[]
  prompt: string
  description?: string
  required?: boolean
  choices?: Choice[]
  validationErrorMessage?: string
  validate?: (
    value: string | number | boolean | PrimitiveOptionValue[],
  ) => boolean | Promise<boolean>
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

    if (this.enableExplicitHelp && 'help' in options && options.help) {
      console.log(this.help)
      return
    }

    await this.process(options)
  }

  get enableExplicitHelp(): boolean {
    return true
  }

  abstract get help(): string

  abstract get options(): PromptOption[] | Promise<PromptOption[]>

  parseOptions(command: string): TParsedOptions | Promise<TParsedOptions> {
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
  TParsedOptions extends TContextOptions,
> extends CommandProcessorBase<
  RouterCommandProcessorOptions<TContextOptions>,
  RouterCommandProcessorOptions<TParsedOptions>
> {}

export function parseOptions<T extends object>(
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
            choices: option.choices?.map((c) =>
              typeof c === 'string' || typeof c === 'number' ? c : c.value,
            ),
          }
          return options
        },
        {} as Record<string, Options>,
      ),
    )
    .help(false)
    .parse() as Record<string, OptionValue>

  fixHelp(options)

  // skip validation and prompts if help is requested
  if (options.help) {
    return options as T
  }

  if (!isInteractivityDisabled) {
    return promptUserForOptions<T>(promptOptions, options)
  }

  validateOptionValues(promptOptions, options)
  return options as T
}

async function promptUserForOptions<T>(
  promptOptions: PromptOption[],
  parsedOptions: Record<string, OptionValue>,
): Promise<T> {
  const pendingOptions = []
  for (const option of promptOptions) {
    // skip options that have already been provided
    if (parsedOptions[option.name] != null) {
      continue
    }

    pendingOptions.push(option)
  }

  const answers = await showPrompt(pendingOptions)

  const finalOptions = { ...parsedOptions, ...answers }
  validateOptionValues(promptOptions, finalOptions)
  return finalOptions as T
}

function showPrompt(
  options: PromptOption[],
): Promise<Record<string, OptionValue>> {
  const questions: Question[] = options.map((option) => ({
    name: option.name,
    message: option.prompt,
    default: option.default,
    choices: option.choices,
    validate: (value) => {
      if (option.required && value == null) {
        return false
      }

      if (option.validate == null) {
        return true
      }

      return option.validate(value as never)
    },
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
    inputParams.filter = (input) => {
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

export function isPromise<T extends object>(
  value: T | Promise<T>,
): value is Promise<T> {
  return 'then' in value
}

export function executeWithValue<T extends object, V>(
  value: T | Promise<T>,
  func: (a: T) => V | Promise<V>,
): V | Promise<V> {
  return isPromise(value) ? value.then((v) => func(v)) : func(value)
}

function validateOptionValues(
  options: PromptOption[],
  values: Record<string, OptionValue>,
) {
  const errors = []
  for (const option of options) {
    if (option.required && values[option.name] == null) {
      errors.push(`${option.name} is required`)
    } else if (option.validate && !option.validate(values[option.name])) {
      errors.push(option.validationErrorMessage || `${option.name} is invalid`)
    }
  }

  if (errors.length) {
    terminateWithValidationErrors(errors)
  }
}

function terminateWithValidationErrors(errors: string[]) {
  console.error(`Command failed with errors:\n${errors.join('\n')}`)
  process.exit(1)
}

// yargs disables help and loses the help config so we must add it back manually
function fixHelp(options: Record<string, OptionValue>) {
  if (options.h) {
    options.help = true
  } else {
    options.help = false
    options.h = false
  }
}
