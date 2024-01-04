import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'

export default class ListWorkflowsCommandProcessor extends RoutedProcessorBase<CollectionOptions> {
  get options() {
    return []
  }

  async process() {
    const workflows =
      this.contextOptions.collectionDataManager.workflowManagerView.workflows

    console.log('Listing workflows:')
    for (const workflow of workflows) {
      console.log(`${workflow.name} (${workflow.id})`)
    }
  }

  protected get commandDescription(): string {
    return 'List all workflows in this collection'
  }
}
