import { ContractDefinition, supportedChains } from '@bonadocs/core'

import { CollectionOptions } from '../../types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type DeleteContractOptions = {
  contractId: string
} & CollectionOptions

export default class DeleteContractCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  DeleteContractOptions
> {
  get options(): PromptOption[] {
    return [
      {
        name: 'contractId',
        aliases: ['c'],
        prompt: 'Which contract do you want to delete?',
        type: 'string',
        description:
          'The contract to delete as <contractId>:[chainId]:[address], chainId and address are optional.',
        required: true,
        choices: [
          ...this.contextOptions.collectionDataManager.contractManagerView
            .contracts,
        ].flatMap((choice) =>
          choice.instances.map((instance) => {
            return {
              name: `${choice.name} (${
                supportedChains.get(instance.chainId)?.name ?? 'Unknown'
              }: ${instance.address})`,
              value: `${choice.id}:${instance.chainId}:${instance.address}`,
            }
          }),
        ),
      },
    ]
  }

  async process(options: DeleteContractOptions) {
    const [contractId, chainId, address] = options.contractId.split(':')
    const contract =
      this.contextOptions.collectionDataManager.contractManagerView.getContract(
        contractId,
      )

    if (!contract) {
      throw new Error(`Contract ${contractId} not found.`)
    }

    if (!chainId) {
      // delete the entire contract
      await this.deleteContract(contractId)
      console.log(`Contract ${contract.name} deleted.`)
      return
    }

    if (!address) {
      // delete all instances of the contract on the specified chain
      await this.deleteContractInstances(contract, Number(chainId))
      console.log(
        `All instances of ${contract.name} (${
          contract.id
        }) on ${supportedChains.get(Number(chainId))?.name} deleted.`,
      )
      return
    }

    await this.deleteContractInstance(contract, Number(chainId), address)
    console.log(
      `Contract ${contract.name} at ${address} on ${supportedChains.get(
        Number(chainId),
      )?.name} deleted.`,
    )
  }

  private deleteContract(contractId: string) {
    return this.contextOptions.collectionDataManager.contractManagerView.removeContract(
      contractId,
    )
  }

  private async deleteContractInstances(
    contract: ContractDefinition,
    chainId: number,
  ) {
    const instances = contract.instances.filter(
      (instance) => instance.chainId === chainId,
    )

    for (const instance of instances) {
      await this.contextOptions.collectionDataManager.contractManagerView.removeContractInstance(
        contract.id,
        instance.chainId,
        instance.address,
      )
    }
  }

  private deleteContractInstance(
    contract: ContractDefinition,
    chainId: number,
    address: string,
  ) {
    return this.contextOptions.collectionDataManager.contractManagerView.removeContractInstance(
      contract.id,
      chainId,
      address,
    )
  }

  protected get commandDescription(): string {
    return 'Delete the collection with the provided id.'
  }
}
