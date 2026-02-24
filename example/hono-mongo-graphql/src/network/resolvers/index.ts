import { buildSchema } from 'type-graphql'
import { UserResolver } from './User'

const buildSchemas = async () => {
  const schema = await buildSchema({
    resolvers: [UserResolver],
    validate: { forbidUnknownValues: false }
  })

  return schema
}

export { buildSchemas }
