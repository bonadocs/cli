import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type RemoveWorkflowOptions = {
  workflowId: string
} & CollectionOptions

export default class RemoveWorkflowCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  RemoveWorkflowOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'workflowId',
        aliases: ['w'],
        prompt: 'Which workflow do you want to remove?',
        type: 'string',
        description: 'The id of the workflow to remove',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.workflowManagerView
            .workflows,
        ].map((choice) => ({
          name: `${choice.name} (${choice.id})`,
          value: choice.id,
        })),
      },
    ]
  }

  async process(options: RemoveWorkflowOptions) {
    const workflowId = options.workflowId
    const workflow =
      this.contextOptions.collectionDataManager.workflowManagerView.getWorkflow(
        workflowId,
      )

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found.`)
    }

    // delete the entire workflow
    await this.deleteWorkflow(workflowId)
    console.log(`Workflow ${workflow.name} deleted.`)
  }

  private deleteWorkflow(workflowId: string) {
    return this.contextOptions.collectionDataManager.workflowManagerView.removeWorkflow(
      workflowId,
    )
  }

  protected get commandDescription(): string {
    return 'Remove the workflow with the provided id.'
  }
}
