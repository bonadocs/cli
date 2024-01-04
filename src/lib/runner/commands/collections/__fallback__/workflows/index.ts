import { CollectionOptions } from '../types'

import { RouterCommandProcessor, RouterCommandProcessorOptions } from '#router'

export default class RootWorkflowsCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<CollectionOptions>
> {
  constructor(
    contextOptions: RouterCommandProcessorOptions<CollectionOptions>,
  ) {
    super(contextOptions)
  }

  get options() {
    return []
  }

  protected get commands() {
    return [
      {
        name: 'list',
        description: `List the workflows in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'add',
        description: `Add a workflow to collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'remove',
        description: `Remove a workflow from '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
      {
        name: 'rename',
        description: `Rename a workflow in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`,
      },
    ]
  }

  protected get commandDescription(): string {
    return `Manage the workflows in collection '${this.contextOptions.collectionDataManager.metadataView.name}'`
  }
}
