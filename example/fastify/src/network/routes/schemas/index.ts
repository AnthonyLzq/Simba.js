import { Type } from '@sinclair/typebox'

const idSchema = Type.String({ minLength: 24, maxLength: 24 })

export { idSchema }
export * from './user'
