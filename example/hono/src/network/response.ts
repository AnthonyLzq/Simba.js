import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

const response = ({
  error,
  message,
  c,
  status
}: {
  error: boolean
  message: unknown
  c: Context
  status: ContentfulStatusCode
}) => {
  return c.json({ error, message }, status)
}

export { response }
