import { access } from 'fs/promises'
import * as path from 'path'

/**
 * Find the command processor module name for the given command stack
 * @param rootDir
 * @param commandStack
 * @param fallbackFileName
 */
export async function findCommandProcessorModule(
  rootDir: string,
  commandStack: string[],
  fallbackFileName = '__fallback__',
): Promise<string | null> {
  const foundPath = []

  if (!commandStack.length) {
    return null
  }

  while (foundPath.length < commandStack.length) {
    const filePath = path.join(rootDir, ...foundPath)

    if (await exists(path.join(filePath, commandStack[foundPath.length]))) {
      foundPath.push(commandStack[foundPath.length])
    } else if (
      await exists(path.join(filePath, commandStack[foundPath.length] + '.js'))
    ) {
      foundPath.push(commandStack[foundPath.length] + '.js')
    } else if (await exists(path.join(filePath, fallbackFileName))) {
      foundPath.push(fallbackFileName)
    } else if (await exists(path.join(filePath, fallbackFileName + '.js'))) {
      foundPath.push(fallbackFileName + '.js')
    } else {
      return null
    }
  }

  // remove the extension from the last file
  foundPath[foundPath.length - 1] = foundPath[foundPath.length - 1].replace(
    /\.[^/.]+$/,
    '',
  )
  return `#commands/${foundPath.join('/')}`
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
