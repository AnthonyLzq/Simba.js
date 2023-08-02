import z from 'zod'

const id = z.preprocess(val => Number(val), z.number())

type Id = z.infer<typeof id>

const idSchema = z.object({ id })

type IdSchema = z.infer<typeof idSchema>

export { id, Id, idSchema, IdSchema }
