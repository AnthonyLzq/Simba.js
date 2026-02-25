import { type ZodType, z } from 'zod'

const jsonResponse = (schema: ZodType, description: string) => ({
  description,
  content: {
    'application/json': {
      schema: z.object({
        error: z.boolean(),
        message: schema
      })
    }
  }
})

const jsonBody = (schema: ZodType) => ({
  content: {
    'application/json': {
      schema
    }
  }
})

export { jsonResponse, jsonBody }
