import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class PrintABICommandProcessor extends RoutedProcessorBase<ContractOptions> {
  get options() {
    return []
  }

  async process() {
    const contractManagerView =
      this.contextOptions.collectionDataManager.contractManagerView
    const contractInterface = contractManagerView.getContractInterface(
      this.contextOptions.contract.interfaceHash,
    )

    if (!contractInterface) {
      throw new Error(`Contract interface not found`)
    }

    console.log('ABI:')
    console.log(contractInterface.abi)
  }

  protected get commandDescription(): string {
    return `Print the ABI of the ${this.contextOptions.contract.name} contract`
  }
}
