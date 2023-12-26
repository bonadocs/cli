import { preIndexDataForSearchDB } from '@bonadocs/core'

import { CommandDescription, CommonOptions } from '#commands'
import { RouterCommandProcessor } from '#router'

export default class RootRegistryCommandProcessor extends RouterCommandProcessor<CommonOptions> {
  get options() {
    return []
  }

  async setup(): Promise<void> {
    await super.setup()
    await preIndexDataForSearchDB()
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'add',
        description: 'Register a protocol from a local collection',
      },
      {
        name: 'search',
        description: 'Search for a protocol in the registry',
      },
      {
        name: 'open',
        description: 'Download and open a protocol from the registry',
      },
    ]
  }
}
