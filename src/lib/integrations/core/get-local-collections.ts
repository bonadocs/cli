import { getLocalCollectionNames } from '@bonadocs/core'

import { CollectionWithId } from './types'

export async function getLocalCollections(): Promise<CollectionWithId[]> {
  const collections = await getLocalCollectionNames()
  return Object.entries(collections).map(([id, { name }]) => ({
    id,
    name,
  }))
}
