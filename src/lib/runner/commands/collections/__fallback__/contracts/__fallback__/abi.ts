import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class PrintABICommandProcessor extends RoutedProcessorBase<ContractOptions> {
  get options() {
    return []
  }

  async process() {
    const contractManagerView =
      this.contextOptions.collectionDataManager.contractManagerView
    const contract = contractManagerView.getContractInterface(
      this.contextOptions.contract.interfaceHash,
    )

    console.log('ABI:')
    console.log(contract.abi)
  }

  protected get commandDescription(): string {
    return `Print the ABI of the ${this.contextOptions.contract.name} contract`
  }
}
