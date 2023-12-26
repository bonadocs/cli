import * as childProcess from 'child_process'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import axios, { AxiosInstance } from 'axios'

type ProtocolMetadataLink = {
  label: string
  imgURI?: string
  url: string
}

export type ProtocolMetadata = {
  name: string
  slug: string
  description: string
  collection: string
  owners: string
  website: string
  logo: string
  tags: string
  chains: string
  links: ProtocolMetadataLink[]
}

let httpClient: AxiosInstance | undefined

const registryRepo = {
  owner: 'bonadocs',
  name: 'protocol-registry',
}

export async function getGitHubUsername(gitHubToken: string): Promise<string> {
  initializeHttpClient(gitHubToken)
  const response = await httpClient!.get('/user')
  return response.data.login
}

export async function fetchTags(): Promise<string[]> {
  const response = await axios.get(
    `https://raw.githubusercontent.com/${registryRepo.owner}/${registryRepo.name}/main/tags.txt`,
  )
  return response.data
    .split('\n')
    .filter((s: string) => s.trim())
    .map((s: string) => s.trim())
}

export async function registerProtocol(
  githubToken: string,
  protocol: ProtocolMetadata,
) {
  console.log('Registering protocol...')
  await validateProtocolMetadata(protocol)
  initializeHttpClient(githubToken)
  const fork = await createFork(protocol.slug)
  let repoPath: string | undefined
  try {
    console.log('Waiting 10 seconds for fork to be available for cloning...')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const repoPath = await cloneFork(fork)
    await updateFiles(protocol, repoPath)
    commitAndPushChanges(protocol.name, repoPath)
    const username = await getGitHubUsername(githubToken)
    await createPullRequest(username, protocol.name)
  } catch (error) {
    await deleteFork(fork)
    console.error(
      'Error registering protocol:',
      error instanceof Error ? error.message : error,
    )
    throw error
  } finally {
    if (repoPath) {
      await fs.rm(repoPath, { recursive: true, force: true })
    }
    console.log('Command done processing.')
  }
}

async function tmpdir() {
  const randomName = Math.random().toString(36).substring(2, 15)
  const dir = path.join(os.tmpdir(), '.bonadocs', randomName)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

async function createFork(
  protocolSlug: string,
  fromDelete = false,
): Promise<string> {
  try {
    console.log('Creating fork...')
    const random = Math.floor(Math.random() * 100000)
    const forkName = `bonadocs-protocol-registry-${protocolSlug}-${random}`

    const response = await httpClient!.post(
      `/repos/${registryRepo.owner}/${registryRepo.name}/forks`,
      {
        name: forkName,
        default_branch_only: true,
      },
    )

    const forkedRepoFullName = response.data.full_name
    if (forkedRepoFullName && forkedRepoFullName.endsWith(forkName)) {
      console.log(`Fork created successfully: ${forkedRepoFullName}`)
      return forkedRepoFullName
    } else if (forkedRepoFullName && !fromDelete) {
      await deleteFork(forkedRepoFullName)
      return createFork(protocolSlug, true)
    }
  } catch (error) {
    console.error(
      'Error creating fork:',
      error instanceof Error ? error.message : error,
    )
    throw error
  }
  throw new Error('Failed to create fork.')
}

async function deleteFork(fork: string): Promise<void> {
  try {
    const response = await httpClient!.delete(`/repos/${fork}`)
    if (response.status === 204) {
      console.log(`Fork deleted successfully: ${fork}`)
      return
    }
  } catch (error) {
    console.error(
      'Error deleting fork:',
      error instanceof Error ? error.message : error,
    )
    throw error
  }
  throw new Error(
    'Failed to delete fork. Please delete it manually or provide a token with delete_repo permissions.',
  )
}

async function createPullRequest(
  githubUsername: string,
  protocolName: string,
): Promise<void> {
  try {
    console.log('Creating pull request...')
    const response = await httpClient!.post(
      `/repos/${registryRepo.owner}/${registryRepo.name}/pulls`,
      {
        title: `Add ${protocolName}`,
        head: `${githubUsername}:main`,
        base: 'main',
      },
    )

    const pullRequestNumber = response.data.number
    if (pullRequestNumber) {
      console.log(`Pull request created successfully: ${pullRequestNumber}`)
      return
    }
  } catch (error) {
    console.error(
      'Error creating pull request:',
      error instanceof Error ? error.message : error,
    )
    throw error
  }
  throw new Error('Failed to create pull request')
}

async function cloneFork(fork: string): Promise<string> {
  try {
    // Clone the forked repository to a temporary folder
    console.log('Cloning fork...')
    const tempRepoPath = await tmpdir()
    childProcess.execSync(
      `git clone https://github.com/${fork}.git ${tempRepoPath}`,
    )
    console.log('Fork cloned successfully.')
    return tempRepoPath
  } catch (error) {
    console.error(
      'Error cloning fork:',
      error instanceof Error ? error.message : error,
    )
    throw error
  }
}

async function updateFiles(
  metadata: ProtocolMetadata,
  repoPath: string,
): Promise<void> {
  console.log('Updating files...')
  const namesFilePath = path.join(repoPath, '/names.txt')
  const protocolSlug = metadata.slug

  // Append protocol name and slug to /names.txt
  await appendName(namesFilePath, protocolSlug, metadata.name)

  // Append protocol slug to relevant /chains/evm[chainId].txt files
  for (const chainId of metadata.chains.split(',')) {
    const chainFilePath = path.join(repoPath, `/chains/evm${chainId}.txt`)
    await appendSlug(chainFilePath, protocolSlug)
  }

  // Append protocol slug to relevant /tags/[tag].txt files
  for (const tag of metadata.tags.split(',')) {
    const tagFilePath = path.join(repoPath, `/tags/${tag}.txt`)
    await appendSlug(tagFilePath, protocolSlug)
  }

  // Write metadata to /data/[slug].json
  console.log('Writing metadata...')
  const metadataFilePath = path.join(repoPath, `/data/${protocolSlug}.json`)
  await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2))
  console.log('Metadata written successfully.')
  console.log('Files updated successfully.')
}

async function appendName(file: string, slug: string, name: string) {
  console.log('Appending name...')
  const content = await fs.readFile(file, 'utf-8')
  const slugs = content.split('\n').map((line) => line.split(':')[0].trim())
  if (slugs.includes(slug)) {
    throw new Error(`Slug ${slug} already exists`)
  }
  await fs.appendFile(file, `${slug}: ${name}\n`)
  console.log('Name appended successfully.')
}

async function appendSlug(file: string, slug: string) {
  console.log(`Appending slug to ${file}...`)
  let content: string
  try {
    content = await fs.readFile(file, 'utf-8')
  } catch {
    await fs.writeFile(file, '')
    content = ''
  }

  const slugs = content.split('\n').map((line) => line.trim())
  if (slugs.includes(slug)) {
    throw new Error(`Slug ${slug} already exists`)
  }
  await fs.appendFile(file, `${slug}\n`)
  console.log('Slug appended successfully.')
}

async function validateProtocolMetadata(metadata: ProtocolMetadata) {
  if (!metadata.name?.trim()) {
    throw new Error('Protocol name is required')
  }

  metadata.name = metadata.name.trim()
  if (!metadata.slug?.trim()) {
    throw new Error('Protocol slug is required')
  }
  metadata.slug = metadata.slug.trim()

  if (/[^a-z0-9-]/.test(metadata.slug)) {
    throw new Error(
      'Protocol slug must only contain lowercase letters, numbers, and dashes',
    )
  }

  if (!metadata.description?.trim()) {
    throw new Error('Protocol description is required')
  }
  metadata.description = metadata.description.trim()

  if (!metadata.collection?.trim()) {
    throw new Error('Protocol collection URI is required')
  }
  metadata.collection = metadata.collection.trim()

  if (!metadata.owners?.trim()) {
    throw new Error(
      'Protocol owners must be specified as a comma-separated list',
    )
  }
  metadata.owners = metadata.owners
    .split(',')
    .map((s) => s.trim())
    .join(',')

  if (!metadata.website?.trim()) {
    throw new Error('Protocol website is required')
  }
  metadata.website = metadata.website.trim()

  try {
    new URL(metadata.website)
  } catch (error) {
    throw new Error('Protocol website must be a valid URL')
  }

  if (!metadata.logo?.trim()) {
    throw new Error('Protocol logo is required')
  }
  metadata.logo = metadata.logo.trim()

  try {
    new URL(metadata.logo)
  } catch (error) {
    throw new Error('Protocol logo must be a valid URL')
  }

  if (!metadata.tags?.trim()) {
    throw new Error('Protocol tags are required')
  }
  metadata.tags = metadata.tags
    .split(',')
    .map((s) => s.trim())
    .join(',')

  if (!metadata.chains?.trim()) {
    throw new Error('Protocol chains are required')
  }
  metadata.chains = metadata.chains
    .split(',')
    .map((s) => s.trim())
    .join(',')

  for (const link of metadata.links) {
    if (!link.label?.trim()) {
      throw new Error('Link label is required')
    }
    link.label = link.label.trim()

    if (!link.url?.trim()) {
      throw new Error('Link URL is required')
    }
    link.url = link.url.trim()

    try {
      new URL(link.url)
    } catch (error) {
      throw new Error('Link URL must be a valid URL')
    }

    if (!link.imgURI?.trim()) {
      continue
    }
    link.imgURI = link.imgURI.trim()

    try {
      new URL(link.imgURI)
    } catch (error) {
      throw new Error('Link image URI must be a valid URL')
    }
  }
}

function initializeHttpClient(token: string) {
  if (httpClient) {
    return
  }

  httpClient = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    validateStatus: () => true,
  })
}

function commitAndPushChanges(protocolName: string, repoPath: string) {
  console.log('Committing and pushing changes...')
  childProcess.execSync(
    `cd ${repoPath} && git add . && git commit -m "Add ${protocolName}" && git push origin main`,
  )

  console.log('Changes committed and pushed successfully.')
}
