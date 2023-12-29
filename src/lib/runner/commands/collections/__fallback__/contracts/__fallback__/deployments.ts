import { supportedChains } from '@bonadocs/core'

import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'

export default class ListDeploymentsCommandProcessor extends RoutedProcessorBase<ContractOptions> {
  get options() {
    return []
  }

  async process() {
    const deployments = this.contextOptions.contract.instances

    console.log('Deployments:')
    console.log(
      deployments
        .map(
          (instance) =>
            `${
              supportedChains.get(instance.chainId)?.name ||
              `EVM Chain: ${instance.chainId}`
            }: ${instance.address}`,
        )
        .join('\n'),
    )
  }

  protected get commandDescription(): string {
    return `List the deployments of the ${this.contextOptions.contract.name} contract across chains`
  }
}
