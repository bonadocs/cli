import { WorkflowDefinition } from '@bonadocs/core'

import { CollectionOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type AddWorkflowOptions = {
  name: string
} & CollectionOptions

export default class AddWorkflowCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  AddWorkflowOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'name',
        aliases: ['n'],
        prompt: 'Name:',
        type: 'string',
        required: true,
        validate: (value) => {
          return typeof value === 'string' && value.length > 0
        },
      },
    ]
  }

  async process(options: AddWorkflowOptions): Promise<void> {
    const workflow: WorkflowDefinition = {
      id: '',
      name: options.name,
      execution: [await this.promptForContractFunction()],
      variables: [],
    }

    const workflowId =
      await this.contextOptions.collectionDataManager.workflowManagerView.addWorkflow(
        workflow,
      )

    console.log(`Initialized workflow '${workflowId}' with function`)
    while (await this.promptForAdditionalFunction()) {
      const functionKey = await this.promptForContractFunction()
      await this.contextOptions.collectionDataManager.workflowManagerView.addWorkflowFunction(
        workflowId,
        functionKey,
      )
      console.log(`Added function to workflow '${workflowId}'`)
    }
    console.log(`Done setting up workflow '${workflowId}'`)
  }

  protected get commandDescription(): string {
    return `Add a new workflow to collection '${this.contextOptions.collectionDataManager.metadataView.name}'`
  }

  private async promptForAdditionalFunction(): Promise<boolean> {
    const answer = (await this.prompt([
      {
        name: 'add',
        aliases: ['a'],
        prompt: 'Add another function?',
        type: 'boolean',
        required: true,
      },
    ])) as { add: boolean }
    return answer.add
  }

  private async promptForContractFunction(): Promise<string> {
    const contractAnswer = (await this.prompt([
      {
        name: 'contract',
        aliases: ['c'],
        prompt: 'Choose Contract:',
        type: 'string',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager!.contractManagerView
            .contracts,
        ].map((contract) => ({
          name: contract.name,
          value: contract.id,
        })),
      },
    ])) as { contract: string }
    if (!contractAnswer.contract) {
      throw new Error('Contract is required')
    }
    const contract =
      this.contextOptions.collectionDataManager!.contractManagerView.getContract(
        contractAnswer.contract,
      )
    if (!contract) {
      throw new Error(`Contract '${contractAnswer.contract}' not found`)
    }

    const functionAnswer = (await this.prompt([
      {
        name: 'func',
        aliases: ['f'],
        prompt: 'Choose Function:',
        type: 'string',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.getContractDetailsView(
            contract.id,
          ).functions,
        ].map((func) => ({
          name: func.signature,
          value: func.fragmentKey,
        })),
      },
    ])) as { func: string }

    if (!functionAnswer.func) {
      throw new Error('Function is required')
    }
    return functionAnswer.func
  }
}
