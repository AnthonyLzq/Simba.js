import { mergeSchemas } from '@graphql-tools/schema'

import { User } from './User'

const mergedSchema = mergeSchemas({
  schemas: [User]
})

export { mergedSchema }
