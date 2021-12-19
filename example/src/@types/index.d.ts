/* eslint-disable no-var */
import { IncomingHttpHeaders } from 'http'
import { Request, Response } from 'express'

declare global {
  interface ResponseProps {
    error: boolean
    message: unknown
    res: Response
    status: number
  }
  // This variable is global, so it will be available everywhere in the code
  var response: ({ error, message, res, status }: ResponseProps) => void

  // We can personalize the response and request objects in case we need it by
  // adding new optional attributes to this interface
  interface CustomResponse extends Response {
    newValue?: string
  }

  interface CustomRequest extends Request {
    body: {
      args?: DtoUser
    }
    // We can add custom headers via intersection, remember that for some reason
    // headers must be in Snake-Pascal-Case
    headers: IncomingHttpHeaders & {
      'Custom-Header'?: string
    }
  }
}

export {}
