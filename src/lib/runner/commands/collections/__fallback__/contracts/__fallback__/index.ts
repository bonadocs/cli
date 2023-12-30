import { ContractDefinition } from '@bonadocs/core'

import { ContractOptions } from './types'

import { CommandDescription } from '#commands'
import { RouterCommandProcessor, RouterCommandProcessorOptions } from '#router'

export default class RootContractCommandProcessor extends RouterCommandProcessor<
  RouterCommandProcessorOptions<ContractOptions>
> {
  constructor(contextOptions: RouterCommandProcessorOptions<ContractOptions>) {
    super(contextOptions)
  }

  async setup(): Promise<void> {
    await super.setup()
    this.contextOptions.contract = await this.getContract()
  }

  get options() {
    return []
  }

  protected get commands(): CommandDescription[] {
    return [
      {
        name: 'deployments',
        description: 'List the deployments of this contract across all chains',
      },
      {
        name: 'functions',
        description: 'List the functions in this contract',
      },
      {
        name: 'events',
        description: 'List the events in this contract',
      },
      {
        name: 'errors',
        description: 'List the named errors in this contract',
      },
      {
        name: 'abi',
        description: 'Print the contract ABI',
      },
      {
        name: 'run',
        description: 'Run or simulate a function in this contract',
      },
    ]
  }

  protected get commandDescription(): string {
    return `Manage contract '${
      this.contextOptions.contract?.name || '[not found]'
    }'`
  }

  private async getContract(): Promise<ContractDefinition> {
    const commandNameIndex =
      this.contextOptions.commandStack.findIndex((c) => c === 'contracts') + 1

    if (commandNameIndex === 0) {
      throw new Error(
        '[FATAL] Invalid command stack. Expected contracts command.',
      )
    }

    const commandName = this.contextOptions.commandStack[commandNameIndex]
    return this.getContractIdFromCommandName(commandName)
  }

  private async getContractIdFromCommandName(commandName: string) {
    const contract =
      this.contextOptions.collectionDataManager.contractManagerView.getContract(
        commandName,
      )
    if (contract) {
      return contract
    }

    const filteredContracts = [
      ...this.contextOptions.collectionDataManager.contractManagerView
        .contracts,
    ].filter((contract) =>
      contract.name.toLowerCase().includes(commandName.toLowerCase()),
    )

    if (filteredContracts.length === 0) {
      throw new Error(`Contract ${commandName} not found.`)
    }

    if (filteredContracts.length === 1) {
      return filteredContracts[0]
    }
    return this.promptForContractId(filteredContracts)
  }

  private async promptForContractId(
    filteredContracts: ContractDefinition[],
  ): Promise<ContractDefinition> {
    const contractChoices = filteredContracts.map((contract) => ({
      name: contract.name,
      value: contract.id,
    }))

    const answer = (await this.prompt([
      {
        name: 'contractId',
        aliases: ['c'],
        type: 'string',
        prompt: 'Which contract do you want to manage?',
        choices: contractChoices,
      },
    ])) as { contractId?: string }

    if (!answer.contractId) {
      throw new Error('Contract not specified')
    }

    return filteredContracts.find(
      (contract) => contract.id === answer.contractId,
    )!
  }
}
