import { getApi, supportedChains } from '@bonadocs/core'
import { Interface, isAddress } from 'ethers'

import { PromptOption } from '../../../../util'
import { CollectionOptions } from '../../types'

import { RoutedProcessorBase } from '#commands'

type AddContractOptions = {
  name: string
  chain: number
  address: string
  abi?: string
  interface?: string
  verified?: boolean
} & CollectionOptions

export default class AddContractCommandProcessor extends RoutedProcessorBase<
  CollectionOptions,
  AddContractOptions
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
      {
        name: 'chain',
        aliases: ['c'],
        prompt: 'Chain:',
        type: 'number',
        choices: [...supportedChains.entries()].map(([chainId, config]) => ({
          name: config.name,
          value: chainId,
        })),
        required: true,
      },
      {
        name: 'address',
        aliases: ['a'],
        prompt: 'Address:',
        type: 'string',
        required: true,
        validate: (value) => {
          return (
            typeof value === 'string' && value.length > 0 && isAddress(value)
          )
        },
      },
      {
        name: 'interface',
        aliases: ['i'],
        prompt: 'Which interface does this contract use:',
        type: 'string',
        validationErrorMessage: 'Contract interface not found',
        required: false,
        choices: [
          ...this.contextOptions.collectionDataManager.contractManagerView
            .interfaces,
        ].map((iface) => ({
          name: iface.name,
          value: iface.hash,
        })),
      },
      {
        name: 'abi',
        aliases: [],
        prompt: 'Paste your ABI:',
        type: 'string',
        validationErrorMessage: 'Invalid ABI',
        required: false,
        validate: (value) => {
          if (typeof value !== 'string' || value.length === 0) {
            return false
          }

          try {
            new Interface(value)
            return true
          } catch {
            return false
          }
        },
      },
    ]
  }

  async process(options: AddContractOptions): Promise<void> {
    const interfaceHash = await this.getInterfaceHash(options)

    if (!interfaceHash) {
      console.error('ABI is required')
      this.printHelp()
      return
    }

    await this.contextOptions.collectionDataManager.contractManagerView.addContract(
      {
        id: '',
        name: options.name,
        interfaceHash: interfaceHash,
        instances: [],
      },
      options.chain,
      options.address,
    )
    console.log(`Contract ${options.name} added`)
  }

  private async getInterfaceHash(options: AddContractOptions) {
    let interfaceHash: string | undefined
    if (options.interface) {
      interfaceHash =
        this.contextOptions.collectionDataManager.contractManagerView.getContractInterface(
          options.interface,
        )?.hash
    } else if (options.abi) {
      interfaceHash =
        await this.contextOptions.collectionDataManager.contractManagerView.addContractInterface(
          options.name,
          options.abi,
        )
    } else {
      const abi = await getApi()?.loadContractABI(
        options.chain,
        options.address,
      )
      if (abi) {
        interfaceHash =
          await this.contextOptions.collectionDataManager.contractManagerView.addContractInterface(
            options.name,
            abi,
          )
      }
    }

    if (!interfaceHash) {
      return this.promptForInterfaceHash(options)
    }

    return interfaceHash
  }

  private async promptForInterfaceHash(options: AddContractOptions) {
    if (
      this.contextOptions.collectionDataManager.contractManagerView.interfaces.next()
        .value
    ) {
      options.interface = await this.promptForInterfaceSelection()
    }

    if (options.interface !== 'new') {
      return options.interface
    }

    let interfaceHash: string | undefined
    options.abi = await this.promptForABI()
    if (options.abi) {
      interfaceHash =
        await this.contextOptions.collectionDataManager.contractManagerView.addContractInterface(
          options.name,
          options.abi,
        )
    }

    return interfaceHash
  }

  private async promptForInterfaceSelection() {
    const interfaceOption = this.options.find((o) => o.name === 'interface')!
    const answer = await this.prompt([
      {
        ...interfaceOption,
        required: true,
        choices: [
          {
            name: 'Add new interface',
            value: 'new',
          },
          ...interfaceOption.choices!,
        ],
      },
    ])

    return answer.interface
  }

  private async promptForABI() {
    const answer = await this.prompt([
      {
        ...this.options.find((o) => o.name === 'abi')!,
        required: true,
      },
    ])
    return answer.abi
  }

  protected get commandDescription(): string {
    return `Add a new contract to collection '${this.contextOptions.collectionDataManager.metadataView.name}'`
  }
}
