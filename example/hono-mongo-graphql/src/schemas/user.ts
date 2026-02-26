import z from 'zod'

import { id } from './id'

const user = z.object({
  lastName: z.string(),
  name: z.string()
})

type User = z.infer<typeof user>

const userWithId = user.extend({ id })

type UserWithId = z.infer<typeof userWithId>

const userDto = z.object({
  id: id.optional(),
  lastName: z.string(),
  name: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

type UserDTO = z.infer<typeof userDto>

const storeUserDto = z.object({
  args: user
})

type StoreUserDTO = z.infer<typeof storeUserDto>

export {
  userDto,
  UserDTO,
  userWithId,
  UserWithId,
  user,
  User,
  storeUserDto,
  StoreUserDTO
}
