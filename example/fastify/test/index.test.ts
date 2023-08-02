import axios from 'axios'
import { Static, TObject, TProperties, Type } from '@sinclair/typebox'
import Ajv from 'ajv'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
})

const BASE_URL = 'http://localhost:1996'
const validator = <T extends TProperties>(
  schema: TObject<T>,
  object: unknown
) => {
  const validate = ajv.compile(schema)

  return validate(object)
}
const baseResponseDto = Type.Object({
  error: Type.Boolean(),
  message: Type.String()
})

type BaseResponseDTO = Static<typeof baseResponseDto>

describe('Simba.js tests', () => {
  beforeAll(async () => {
    await Server.start()
  })

  describe('API endpoints tests', () => {
    let userID = 0

    describe('API: GET /', () => {
      it('Should return 200 with a successful operation', async () => {
        const result = await axios.get<BaseResponseDTO>(BASE_URL)

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(validator(baseResponseDto, result.data)).toBe(true)
      })
    })

    describe('API: POST /api/users', () => {
      const storeUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type StoreUserDTO = Static<typeof storeUserResponse>

      it('Should create a user successfully', async () => {
        const result = await axios.post<StoreUserDTO>(`${BASE_URL}/api/users`, {
          args: {
            lastName: 'Lzq',
            name: 'Anthony'
          }
        })

        userID = result.data.message.id ?? userID
        expect(userID).toBeTruthy()
        expect(result.status).toBe(201)
        expect(result.data.error).toBe(false)
        expect(validator(storeUserResponse, result.data)).toBe(true)
      })
    })

    describe('API: GET /api/user/:id', () => {
      const getOneUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type GetOneUserDTO = Static<typeof getOneUserResponse>

      it('Should return a user', async () => {
        const result = await axios.get<GetOneUserDTO>(
          `${BASE_URL}/api/user/${userID}`
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(validator(getOneUserResponse, result.data)).toBe(true)
      })
    })

    describe('API: PATCH /api/user/:id', () => {
      const updateUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type UpdateUserDTO = Static<typeof updateUserResponse>

      it('Should update a user successfully', async () => {
        const result = await axios.patch<UpdateUserDTO>(
          `${BASE_URL}/api/user/${userID}`,
          {
            args: {
              lastName: 'Luzquiños',
              name: 'Anthony'
            }
          }
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(validator(updateUserResponse, result.data)).toBe(true)
      })
    })

    describe('API: DELETE /api/user/:id', () => {
      it('Should delete the created user', async () => {
        const result = await axios.delete<BaseResponseDTO>(
          `${BASE_URL}/api/user/${userID}`
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(validator(baseResponseDto, result.data)).toBe(true)
      })
    })
  })

  afterAll(async () => {
    await Server.stop()
  })
})
