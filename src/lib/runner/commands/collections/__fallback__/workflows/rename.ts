import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type RenameWorkflowOptions = {
  workflowId: string
  name: string
} & CollectionOptions

export default class RenameWorkflowCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  RenameWorkflowOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'workflowId',
        aliases: ['w'],
        prompt: 'Which workflow do you want to rename?',
        type: 'string',
        description: 'The workflow to rename',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.workflowManagerView
            .workflows,
        ].map((workflow) => ({
          name: `${workflow.name} (${workflow.id})`,
          value: workflow.id,
        })),
      },
      {
        name: 'name',
        aliases: ['n'],
        prompt: 'New name for the workflow:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
    ]
  }

  async process(options: RenameWorkflowOptions) {
    const workflow =
      this.contextOptions.collectionDataManager.workflowManagerView.getWorkflow(
        options.workflowId,
      )

    if (!workflow) {
      throw new Error(`Workflow ${options.workflowId} not found.`)
    }

    const oldName = workflow.name
    await this.contextOptions.collectionDataManager.workflowManagerView.renameWorkflow(
      workflow.id,
      options.name,
    )
    console.log(`Workflow ${oldName} renamed to ${options.name}.`)
  }

  protected get commandDescription(): string {
    return 'Rename the workflow with the provided id.'
  }
}
