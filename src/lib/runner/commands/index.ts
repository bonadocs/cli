import { hideBin } from 'yargs/helpers'

export * from './base'
export * from './types'

export const fileName = module.filename

export function runStandalone() {
  runCommand(hideBin(process.argv).join(' '))
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
}

export async function runCommand(command: string) {
  // dynamic import is used to avoid circular dependencies
  const { EntryCommandProcessor } = await import('./entrypoint')
  const processor = new EntryCommandProcessor()
  await processor.run(command)
}
