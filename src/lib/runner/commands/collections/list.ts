import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { getLocalCollections } from '#integrations/core'
import { PromptOption } from '#util'

export default class ListCollectionsCommandProcessor extends RoutedProcessorBase<CommonOptions> {
  get options(): PromptOption[] {
    return []
  }

  async process() {
    const collections = await getLocalCollections()
    console.log('Listing collections:')
    console.log(
      collections.map((c, i) => `${i + 1}. ${c.name} (${c.id})`).join(`\n`),
    )
  }

  protected get commandDescription(): string {
    return 'List all collections on this device'
  }
}
