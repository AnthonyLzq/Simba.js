import { Static, Type } from '@sinclair/typebox'

const id = Type.String()

type Id = Static<typeof id>

const idSchema = Type.Object({ id })

type IdSchema = Static<typeof idSchema>

export { id, Id, idSchema, IdSchema }
