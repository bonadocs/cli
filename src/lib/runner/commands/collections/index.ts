﻿import { CommandDescription, CommonOptions } from '#commands'
import { RouterCommandProcessor } from '#router'

export default class RootCollectionsCommandProcessor extends RouterCommandProcessor<CommonOptions> {
  get options() {
    return []
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'create',
        description: 'Create a new collection',
      },
      {
        name: 'list',
        description: 'List all collections',
      },
      {
        name: 'delete',
        description: 'Delete a collection',
      },
      {
        name: 'rename',
        description: 'Rename a collection',
      },
      {
        name: '[id]',
        description: 'Manage collection with the specified id or name',
      },
    ]
  }
}
