import { Type } from '@sinclair/typebox'

const userSchema = Type.Object({
  id: Type.Optional(Type.String({ minLength: 24, maxLength: 24 })),
  lastName: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String())
})

const storeUserSchema = Type.Object({
  lastName: Type.String(),
  name: Type.String()
})

export { userSchema, storeUserSchema }
