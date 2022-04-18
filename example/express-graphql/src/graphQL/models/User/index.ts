import { makeExecutableSchema } from '@graphql-tools/schema'

import { User as UserTD } from './typeDefs'
import { Query } from './queriesResolver'
import { Mutation } from './mutationsResolver'

const resolvers = {
  Query,
  Mutation
}

const User = makeExecutableSchema({
  typeDefs: UserTD,
  resolvers
})

export { User }
