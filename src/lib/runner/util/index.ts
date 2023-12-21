import inquirer, { InputQuestion, Question } from 'inquirer'
import yargs, { Options } from 'yargs'

type PrimitiveOptionValue = string | number | boolean
type OptionValue = PrimitiveOptionValue | PrimitiveOptionValue[]

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
  /**
   * If string, it forms a require group with other options with the same value.
   * At least one option in the group must be provided. The value must be the
   * name of the primary option in the group.
   */
  required?: boolean | string
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

export async function promptUserForOptions<T>(
  promptOptions: PromptOption[],
  parsedOptions: Record<string, OptionValue>,
): Promise<T> {
  const pendingOptions: PromptOption[] = []
  for (const option of promptOptions) {
    // skip options that have already been provided
    if (parsedOptions[option.name] != null) {
      continue
    }

    // skip options that are not required
    if (!option.required) {
      continue
    }

    // skip options in a require group and only prompt for the primary option
    if (
      typeof option.required === 'string' &&
      option.required !== option.name
    ) {
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
    validate: (value, answers) => {
      if (option.required && value == null) {
        if (typeof option.required === 'boolean') {
          return false
        }

        if (!answers) {
          return false
        }

        const optionsInGroup = options.filter(
          (o) => o.required === option.required,
        )
        if (!optionsInGroup.some((o) => answers[o.name] != null)) {
          return false
        }
      }

      if (option.validate == null) {
        return true
      }

      if (option.choices && !option.choices.some((c) => c === value)) {
        return false
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

export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof value === 'object' && value != null && 'then' in value
}

export function executeWithValue<T, V>(
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
    } else if (
      values[option.name] != null &&
      option.validate &&
      !option.validate(values[option.name])
    ) {
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
