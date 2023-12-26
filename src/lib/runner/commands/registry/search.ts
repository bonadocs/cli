import { quickSearch } from '@bonadocs/core'

import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type SearchRegistryOptions = {
  query: string
} & CommonOptions

export default class SearchRegistryCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  SearchRegistryOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'query',
        aliases: ['q'],
        description: 'The search query',
        prompt: 'Query:',
        type: 'string',
        required: true,
      },
    ]
  }

  async process(options: SearchRegistryOptions) {
    const results = await quickSearch({
      q: options.query,
      pageSize: 30,
    })

    console.log(
      results.items
        .map((result, index) => `${index + 1}. ${result.name} (${result.slug})`)
        .join('\n'),
    )
  }

  protected get commandDescription(): string {
    return 'Load a new collection with the provided name and description.'
  }
}
