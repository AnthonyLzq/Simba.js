import { Request } from 'express'
import { DtoUser } from '../dto-interfaces'

/*
 * With this piece of code we ca personalize the attributes of the request,
 * in case we need it.
 */

interface CustomRequest extends Request {
  body: {
    args?: DtoUser
  }
}

export { CustomRequest as Request }
