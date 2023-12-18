import { CollectionWithId } from './types'

export async function getLocalCollections(): Promise<CollectionWithId[]> {
  return [
    {
      id: 'collection1',
      name: 'Collection 1',
    },
    {
      id: 'collection2',
      name: 'Collection 2',
    },
    {
      id: 'collection3',
      name: 'Collection 3',
    },
  ]
}
