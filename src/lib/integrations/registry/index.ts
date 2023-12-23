import * as childProcess from 'child_process'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'

import { Collection } from '@bonadocs/core'
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

let httpClient: AxiosInstance

const registryRepo = {
  owner: 'bonadocs',
  name: 'protocol-registry',
}

export async function registerProtocol(
  githubToken: string,
  protocol: ProtocolMetadata,
) {
  await validateProtocolMetadata(protocol)
  initializeHttpClient(githubToken)

  const random = Math.floor(Math.random() * 100000)
  const forkName = `bonadocs-protocol-registry-${protocol.slug}-${random}`
  const fork = await createFork(forkName)
  const repoPath = await cloneFork(fork)
  await updateFiles(protocol, repoPath)
  commitAndPushChanges(protocol.name, repoPath)
}

async function tmpdir() {
  const randomName = Math.random().toString(36).substring(2, 15)
  const dir = path.join(os.tmpdir(), '.bonadocs', randomName)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

async function createFork(protocolSlug: string): Promise<string> {
  try {
    const random = Math.floor(Math.random() * 100000)
    const forkName = `bonadocs-protocol-registry-${protocolSlug}-${random}`

    const response = await httpClient.post(
      `/repos/${registryRepo.owner}/${registryRepo.name}/forks`,
      {
        name: forkName,
        default_branch_only: true,
      },
    )

    const forkedRepoFullName = response.data.full_name
    console.log(`Fork created successfully: ${forkedRepoFullName}`)
    return forkedRepoFullName
  } catch (error) {
    console.error(
      'Error creating fork:',
      error instanceof Error ? error.message : error,
    )
    throw error
  }
}

async function cloneFork(fork: string): Promise<string> {
  try {
    // Clone the forked repository to a temporary folder
    const tempRepoPath = await tmpdir()
    childProcess.execSync(
      `git clone https://github.com/${fork}.git ${tempRepoPath}`,
    )
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
  const metadataFilePath = path.join(repoPath, `/data/${protocolSlug}.json`)
  await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2))
}

async function appendName(file: string, slug: string, name: string) {
  // validate slug
  const content = await fs.readFile(file, 'utf-8')
  const slugs = content.split('\n').map((line) => line.split(':')[0].trim())
  if (slugs.includes(slug)) {
    throw new Error(`Slug ${slug} already exists`)
  }
  await fs.appendFile(file, `${slug}: ${name}\n`)
}

async function appendSlug(file: string, slug: string) {
  const content = await fs.readFile(file, 'utf-8')
  const slugs = content.split('\n').map((line) => line.trim())
  if (slugs.includes(slug)) {
    throw new Error(`Slug ${slug} already exists`)
  }
  await fs.appendFile(file, `${slug}\n`)
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

  await Collection.createFromURI(metadata.collection)

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
  childProcess.execSync(
    `cd ${repoPath} && git add . && git commit -m "Add ${protocolName}" && git push origin main`,
  )

  console.log('Changes committed and pushed successfully.')
}
