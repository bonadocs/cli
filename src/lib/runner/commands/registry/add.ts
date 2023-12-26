import { CommonOptions } from '../types'

import { RoutedProcessorBase } from '#commands'
import { getLocalCollections, loadCollectionById } from '#integrations/core'
import {
  fetchTags,
  getGitHubUsername,
  registerProtocol,
} from '#integrations/registry'
import { PromptOption } from '#util'

type RegisterProtocolOptions = {
  collectionId: string
  githubToken: string
  website: string
  logoUrl: string
  githubOrganization: string
  documentationWebsite: string
  tags: string
} & CommonOptions

export default class RegisterProtocolCommandProcessor extends RoutedProcessorBase<
  CommonOptions,
  RegisterProtocolOptions
> {
  get options() {
    return this.getOptions()
  }

  async process(options: RegisterProtocolOptions) {
    const githubUsername = await getGitHubUsername(options.githubToken)
    if (!githubUsername) {
      throw new Error('Invalid GitHub token.')
    }
    console.log('GitHub Username:', githubUsername)
    const collection = await loadCollectionById(options.collectionId)
    const collectionUrl = await collection.publishToIPFS()
    await registerProtocol(options.githubToken, {
      name: collection.metadataView.name,
      slug: this.nameToSlug(collection.metadataView.name),
      description: collection.metadataView.description,
      collection: collectionUrl,
      owners: githubUsername,
      chains: Array.from(
        new Set(
          Array.from(collection.contractManagerView.contracts).flatMap((c) =>
            c.instances.map((i) => i.chainId),
          ),
        ),
      ).join(','),
      tags: options.tags,
      website: options.website,
      logo: options.logoUrl,
      links: [
        {
          label: 'Documentation Website',
          url: options.documentationWebsite,
          imgURI: options.logoUrl,
        },
        {
          label: 'GitHub',
          url: `https://github.com/${options.githubOrganization}`,
        },
      ],
    })
  }

  protected get commandDescription(): string {
    return 'Add a protocol to the registry from a local collection'
  }

  private async getOptions(): Promise<PromptOption[]> {
    const collectionWithIds = await getLocalCollections()
    collectionWithIds.sort((a, b) => a.name.localeCompare(b.name))
    const tags = await fetchTags()
    return [
      {
        name: 'collectionId',
        aliases: ['c'],
        prompt: 'Which protocol do you want to register?',
        type: 'string',
        required: true,
        choices: collectionWithIds.map((choice) => {
          return {
            name: choice.name,
            value: choice.id,
          }
        }),
        validationErrorMessage: 'The specified protocol does not exist.',
      },
      {
        name: 'githubToken',
        aliases: ['g'],
        prompt:
          'Paste a personal GitHub token here (needed to generate the repo fork):',
        type: 'string',
        required: true,
        validationErrorMessage: 'The specified GitHub token is invalid.',
        validate: (token) => {
          return typeof token === 'string' && token.length > 0
        },
      },
      {
        name: 'website',
        aliases: ['w'],
        prompt: 'Enter the protocol website (ex. https://example.com):',
        type: 'string',
        required: true,
        validationErrorMessage: 'The website URL is invalid.',
        validate: (url) => {
          if (typeof url !== 'string' || url.trim().length === 0) {
            return false
          }

          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
      },
      {
        name: 'logoUrl',
        aliases: ['l'],
        prompt: 'Enter the logo URL:',
        type: 'string',
        required: true,
        validationErrorMessage: 'The logo URL is invalid.',
        validate: (url) => {
          if (typeof url !== 'string' || url.trim().length === 0) {
            return false
          }

          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
      },
      {
        name: 'documentationWebsite',
        aliases: ['d'],
        prompt: 'Enter the documentation website URL:',
        type: 'string',
        required: true,
        validationErrorMessage: 'The documentation website URL is invalid.',
        validate: (url) => {
          if (typeof url !== 'string' || url.trim().length === 0) {
            return false
          }

          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
      },
      {
        name: 'githubOrganization',
        aliases: ['o'],
        prompt: 'Protocol GitHub Organization:',
        type: 'string',
        required: true,
        validationErrorMessage: 'The GitHub Organization is invalid.',
        validate: (orgName) => {
          const invalidGitHubNameRegex = /[^a-zA-Z0-9-]/
          return (
            typeof orgName === 'string' &&
            orgName.trim().length > 0 &&
            !invalidGitHubNameRegex.test(orgName)
          )
        },
      },
      {
        name: 'tags',
        aliases: ['t'],
        prompt:
          'Select the most appropriate category (update the fork PR to add more):',
        type: 'string',
        required: true,
        validationErrorMessage: `The tags are invalid. Available tags are: ${tags.join(
          ', ',
        )}.`,
        validate: (tags) => {
          if (typeof tags !== 'string' || tags.trim().length === 0) {
            return false
          }

          const tagsArray = tags.split(',')
          if (tagsArray.length === 0) {
            return false
          }

          for (const tag of tagsArray) {
            if (!tags.includes(tag)) {
              return false
            }
          }

          return true
        },
        choices: tags.map((tag) => {
          return {
            name: tag,
            value: tag,
          }
        }),
      },
    ]
  }

  private nameToSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '')
  }
}
