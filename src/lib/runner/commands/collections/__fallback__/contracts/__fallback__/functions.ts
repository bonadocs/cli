import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class ListFunctionsCommandProcessor extends RoutedProcessorBase<ContractOptions> {
  get options() {
    return []
  }

  async process() {
    const contractManagerView =
      this.contextOptions.collectionDataManager.contractManagerView
    const iface = contractManagerView.getInterface(
      this.contextOptions.contract.interfaceHash,
    )

    if (!iface) {
      throw new Error(`Contract interface not found`)
    }

    console.log('Functions:')
    iface.forEachFunction((fn) => {
      console.log(fn.format('full'))
    })
  }

  protected get commandDescription(): string {
    return `List the functions of the ${this.contextOptions.contract.name} contract`
  }
}
