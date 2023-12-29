import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class ListErrorsCommandProcessor extends RoutedProcessorBase<ContractOptions> {
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

    console.log('Errors:')
    iface.forEachError((err) => {
      console.log(err.format('full'))
    })
  }

  protected get commandDescription(): string {
    return `List the errors of the ${this.contextOptions.contract.name} contract`
  }
}
