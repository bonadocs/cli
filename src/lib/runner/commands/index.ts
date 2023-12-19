import { hideBin } from 'yargs/helpers'

export * from './base'
export * from './types'

export function runStandalone() {
  runCommand(hideBin(process.argv).join(' ')).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

export async function runCommand(command: string) {
  // dynamic import is used to avoid circular dependencies
  const { EntryCommandProcessor } = await import('./entrypoint')
  const processor = new EntryCommandProcessor()
  await processor.run(command)
}
