﻿import { RouterCommandProcessor } from '../../../router'
import { RouterCommandProcessorOptions } from '../../../util'
import { CollectionOptions } from '../types'

import { CommandDescription } from '#commands'

export default class RootCollectionCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<CollectionOptions>
> {
  constructor(
    contextOptions: RouterCommandProcessorOptions<CollectionOptions>,
  ) {
    super(contextOptions)

    // set the collection id from the command. [id] in the path is the command name
    contextOptions.collectionId = contextOptions.commandName
  }
  get options() {
    return []
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'contracts',
        description: 'Manage contracts in this collection',
      },
      {
        name: 'workflows',
        description: 'Manage workflows in this collection',
      },
    ]
  }
}
