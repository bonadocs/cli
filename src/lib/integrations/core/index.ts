import {
  Collection,
  CollectionMetadataView,
  deleteCollectionName,
  getCollectionStore,
  getLocalCollectionNames,
} from '@bonadocs/core'

import { CollectionWithId } from './types'

export { CollectionWithId }

export async function getLocalCollections(): Promise<CollectionWithId[]> {
  const collections = await getLocalCollectionNames()
  return Object.entries(collections).map(([id, { name }]) => ({
    id,
    name,
  }))
}

export async function createCollection(name: string, description: string) {
  const manager = Collection.createBlankCollection(name, description).manager
  await manager.saveToLocal()
  return manager
}

export async function loadCollectionFromURI(uri: string) {
  const collection = await Collection.createFromURI(uri)
  await collection.manager.saveToLocal()
  return collection.manager
}

export async function loadCollectionById(id: string) {
  const collection = await Collection.createFromLocalStore(id)
  return collection.manager
}

export async function renameCollection(id: string, name: string) {
  const store = await getCollectionStore(id)
  const snapshot = await store.get('data')
  if (!snapshot) {
    throw new Error(`Collection ${id} not found`)
  }

  const manager = Collection.createFromSnapshot(snapshot).manager
  const metadataView = new CollectionMetadataView(manager)
  await metadataView.rename(name)
}

export async function deleteCollection(id: string) {
  const store = await getCollectionStore(id)
  await store.remove(id)
  deleteCollectionName(id)
}
