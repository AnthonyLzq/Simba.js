import { Static, Type } from '@sinclair/typebox'

const id = Type.String({
  pattern: '^[a-zA-Z0-9]{24,}$'
})

type Id = Static<typeof id>

const idSchema = Type.Object({ id })

type IdSchema = Static<typeof idSchema>

export { id, Id, idSchema, IdSchema }
export * from './user'
