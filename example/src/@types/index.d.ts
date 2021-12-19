/* eslint-disable no-var */
declare global {
  interface ResponseProps {
    error: boolean
    message: unknown
    res: CustomResponse
    status: number
  }
  // This variable is global, so it will be available everywhere in the code
  var response: ({ error, message, res, status }: ResponseProps) => void
}

export {}
