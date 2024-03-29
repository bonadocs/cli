import { stopUnifiedStorage } from '@bonadocs/core'
import { hideBin } from 'yargs/helpers'

export * from './base'
export * from './types'

export const fileName = module.filename

export function runStandalone() {
  runCommand(hideBin(process.argv).join(' ')).catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

export async function runCommand(command: string) {
  const { EntryCommandProcessor } = await import('./entrypoint')
  const processor = new EntryCommandProcessor()
  await processor.run(command)
  stopUnifiedStorage()
}
