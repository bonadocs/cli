import { CollectionOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class DisplayCollectionCommandProcessor extends RoutedProcessorBase<CollectionOptions> {
  get options() {
    return []
  }

  async process() {
    const activeNetworks = new Set<number>([0])
    const functions = [await this.promptForContractFunction(activeNetworks)]
    while ((await this.promptForAdditionalFunction()) && activeNetworks.size) {
      functions.push(await this.promptForContractFunction(activeNetworks))
      console.log('Added function')
    }

    if (!activeNetworks.size) {
      throw new Error('No common networks between selected contracts')
    }
    console.log('Generating widget')
  }

  protected get commandDescription(): string {
    return 'Generate a widget from this collection.'
  }

  private async generateWidget(functions: string[]) {}

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

  private async promptForContractFunction(
    activeNetworks: Set<number>,
  ): Promise<string> {
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

    const chainIds = contract.instances.map((instance) => instance.chainId)
    if (activeNetworks.has(0)) {
      activeNetworks.delete(0)
      addAll(activeNetworks, chainIds)
    } else {
      intersect(activeNetworks, chainIds)
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

function intersect(a: Set<number>, b: number[]) {
  const intersection = new Set(b.filter((value) => a.has(value)))

  // remove from a if not in intersection
  for (const value of a) {
    if (!intersection.has(value)) {
      a.delete(value)
    }
  }
}

function addAll(a: Set<number>, b: number[]) {
  for (const value of b) {
    a.add(value)
  }
}
