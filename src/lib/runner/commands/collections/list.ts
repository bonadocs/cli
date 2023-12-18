import { getLocalCollections } from '../../../integrations/core'
import { PromptOption, RoutedProcessorBase } from '../../util'
import { CommonOptions } from '../types'

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

  get help() {
    return 'List all collections on this device'
  }
}
