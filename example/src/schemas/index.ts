import Joi from 'joi'

import { userSchema } from './user'

const idSchema = Joi.string().length(24).required()

export { idSchema, userSchema }
