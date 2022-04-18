import { Type } from '@sinclair/typebox'

const updateUserSchema = Type.Object(
  {
    id: Type.String({ minLength: 24, maxLength: 24 }),
    lastName: Type.String(),
    name: Type.String()
  },
  { additionalProperties: false }
)

const storeUserSchema = Type.Object(
  {
    lastName: Type.String({ minLength: 1 }),
    name: Type.String({ minLength: 1 })
  },
  { additionalProperties: false }
)

export { updateUserSchema, storeUserSchema }
