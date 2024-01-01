import {
  ContractDetailsView,
  Executor,
  FunctionFragmentView,
  supportedChains,
  TransactionReceiptWithParsedLogs,
} from '@bonadocs/core'
import { isAddress, isHexString, toBigInt } from 'ethers'

import { ContractOptions } from './types'

import { RoutedProcessorBase } from '#commands'
import { PromptOption } from '#util'

type RunFunctionOptions = {
  function: string
  chainId: number
  executeOnMainnet: boolean
  verbose: boolean
  from?: string
  gas?: number
  gasPrice?: number
  value?: number
} & ContractOptions

export default class RunFunctionCommandProcessor extends RoutedProcessorBase<
  ContractOptions,
  RunFunctionOptions
> {
  #view: ContractDetailsView | undefined

  async setup(): Promise<void> {
    await super.setup()
    this.#view =
      this.contextOptions.collectionDataManager.getContractDetailsView(
        this.contextOptions.contract.id,
      )

    if (!this.#view) {
      throw new Error('Contract details could not be loaded')
    }
  }

  get options(): PromptOption[] {
    return [
      {
        name: 'function',
        aliases: ['f'],
        type: 'string',
        required: true,
        description: 'The function to run',
        prompt: 'Select a function to run:',
        choices: this.#view!.functions.map((fn) => ({
          name: fn.fragment.format('full'),
          value: fn.fragment.format('sighash'),
        })),
      },
      {
        name: 'chainId',
        aliases: ['c'],
        type: 'number',
        required: true,
        description: 'The chain id of the network to run on',
        prompt: 'Select a chain to run on:',
        choices: this.contextOptions.contract.instances.map((instance) => ({
          name:
            supportedChains.get(instance.chainId)?.name ||
            `Chain ${instance.chainId}`,
          value: instance.chainId,
        })),
        default:
          this.contextOptions.contract.instances.length === 1
            ? this.contextOptions.contract.instances[0].chainId
            : undefined,
      },
      {
        name: 'executeOnMainnet',
        aliases: ['m'],
        type: 'boolean',
        required: true,
        description:
          'Whether to execute the function on mainnet or simulate it',
        default: false,
      },
      {
        name: 'verbose',
        aliases: ['m'],
        type: 'boolean',
        required: true,
        description: 'Whether to display verbose output',
        default: false,
      },
      {
        name: 'from',
        aliases: ['F'],
        type: 'string',
        description: 'The address to execute the function from',
        prompt: 'Enter the address to execute the function from:',
        validate: (value) => isAddress(value),
      },
      {
        name: 'gas',
        aliases: ['g'],
        type: 'string',
        description: 'The gas limit to use',
        prompt: 'Enter the gas limit to use:',
        validate: (value) => {
          try {
            return toBigInt(value as string) > 0
          } catch {
            return false
          }
        },
      },
      {
        name: 'gasPrice',
        aliases: ['p'],
        type: 'number',
        description: 'The gas price to use',
        prompt: 'Enter the gas price to use:',
        validate: (value) => {
          try {
            return toBigInt(value as string) > 0
          } catch {
            return false
          }
        },
      },
      {
        name: 'value',
        aliases: ['v'],
        type: 'string',
        description: 'The value to send',
        prompt: 'Enter the value to send:',
        validate: (value) => {
          try {
            return toBigInt(value as string) > 0
          } catch {
            return false
          }
        },
      },
    ]
  }

  async process(options: RunFunctionOptions): Promise<void> {
    const fn = this.#view!.getFunctionFragment(options.function)
    if (!fn) {
      throw new Error(`Function ${options.function} not found`)
    }

    const functionFragmentView =
      await this.contextOptions.collectionDataManager.getFunctionFragmentView(
        this.contextOptions.contract.id,
        fn.fragmentKey,
      )
    if (!functionFragmentView) {
      throw new Error(`Failed to load function fragment view`)
    }

    await this.promptForArgs(functionFragmentView)

    const contractAddress = this.contextOptions.contract.instances.find(
      (i) => i.chainId === options.chainId,
    )?.address
    if (!contractAddress) {
      throw new Error(`Contract not deployed on chain ${options.chainId}`)
    }

    const executor = new Executor(options.chainId, [
      {
        contractInterface: this.#view!.contractInterface,
        address: contractAddress,
        fragmentView: functionFragmentView,
        context: {
          variableMapping: {},
          overrides: {
            value: options.value,
            from: options.from,
            gasLimit: options.gas,
            gasPrice: options.gasPrice,
          },
          simulationOverrides: {
            accounts: [],
          },
        },
      },
    ])

    const results = options.executeOnMainnet
      ? await executor.execute()
      : await executor.simulate()
    const result = results[0]

    console.log('Result:')
    console.log(JSON.stringify(result, null, 2))
    /* await this.contextOptions.collectionDataManager.dropFunctionFragmentView(
      this.contextOptions.contract.id,
      fn.fragmentKey,
    ) */
  }

  protected get commandDescription(): string {
    return `List the functions of the ${this.contextOptions.contract.name} contract`
  }

  private async promptForArgs(funcView: FunctionFragmentView) {
    for (let i = 0; i < funcView.displayData.length; i++) {
      const entry = funcView.displayData[i]
      const spaces = ''.padEnd(entry.indent * 2, ' ')

      if (entry.baseType === 'array' && entry.length === -1) {
        await this.allocateDynamicArrayValues(
          funcView,
          entry.name,
          entry.index,
          spaces,
        )
        continue
      }
      if (entry.baseType === 'tuple') {
        // skip tuples, the structure is already flattened and the user
        // will be prompted for the individual fields
        continue
      }

      const answer = (await this.prompt([
        {
          name: 'value',
          aliases: [],
          type: entry.baseType === 'boolean' ? 'boolean' : 'string',
          required: true,
          description: 'The value of the argument',
          prompt: `${spaces}Enter a value for '${entry.name}':`,
          validate: (value) => {
            if (typeof value === 'boolean') {
              return entry.baseType === 'boolean'
            }

            if (typeof value !== 'string') {
              return false
            }

            try {
              if (/^u?int\d*$/.test(entry.baseType)) {
                return toBigInt(value) != null
              }
              switch (entry.baseType) {
                case 'address':
                  return isAddress(value)
                case 'bytes':
                  return isHexString(value)
                case 'string':
                  return true
                case 'boolean':
                  return value === 'true' || value === 'false'
              }
            } catch {
              return false
            }

            return true
          },
        },
      ])) as { value?: string }

      if (answer.value == null) {
        throw new Error(`Invalid value for '${entry.name}'`)
      }
      await funcView.setDataValue(answer.value, entry.path)
    }
  }

  private async allocateDynamicArrayValues(
    funcView: FunctionFragmentView,
    name: string,
    arrayDefinitionIndex: number,
    spaces: string,
  ) {
    const answer = (await this.prompt([
      {
        name: 'value',
        aliases: [],
        type: 'number',
        required: true,
        description: 'The length of the array',
        prompt: `${spaces}Length of '${name}':`,
      },
    ])) as { value?: number }

    if (answer.value == null) {
      throw new Error(`Invalid length for '${name}'`)
    }

    // start from 1 because the array is already allocated with 1 item
    for (let i = 1; i < answer.value; i++) {
      await funcView.addArrayItem(arrayDefinitionIndex)
    }
  }
}
