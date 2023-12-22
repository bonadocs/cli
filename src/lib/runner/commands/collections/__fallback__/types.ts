import { CollectionDataManager } from '@bonadocs/core'

import { CommonOptions } from '#commands'

export type CollectionOptions = {
  collectionDataManager: CollectionDataManager
} & CommonOptions
