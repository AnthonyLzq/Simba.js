const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {Boolean} args.express
 * @param {String} args.projectName
 */
module.exports = async ({ express, projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/@types \
${projectName}/src/@types/models \
${express ? `${projectName}/src/@types/custom` : ''}`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const types = {
    index: {
      content: `/* eslint-disable no-var */
declare global {}

export {}
`,
      file: `${projectName}/src/@types/index.d.ts`
    },
    models: {
      user: {
        content: `interface UserDBO {
  id: string
  name: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}
`,
        file: `${projectName}/src/@types/models/user.d.ts`
      }
    },
    ...(express && {
      custom: {
        request: {
          content: `type ExpressRequest = import('express').Request

interface CustomRequest extends ExpressRequest {
  body: {
    args?: import('schemas').UserDTO
  }
  // We can add custom headers via intersection, remember that for some reason
  // headers must be in Snake-Pascal-Case
  headers: import('http').IncomingHttpHeaders & {
    'Custom-Header'?: string
  }
}
`,
          file: `${projectName}/src/@types/custom/request.d.ts`
        },
        response: {
          content: `type ExpressResponse = import('express').Response

interface CustomResponse extends ExpressResponse {
  newValue?: string
}
`,
          file: `${projectName}/src/@types/custom/response.d.ts`
        }
      }
    })
  }

  await writeFile(types.index.file, types.index.content)
  await writeFile(types.models.user.file, types.models.user.content)

  if (express) {
    await writeFile(types.custom.request.file, types.custom.request.content)
    await writeFile(types.custom.response.file, types.custom.response.content)
  }
}