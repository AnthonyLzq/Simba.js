/* eslint-disable @typescript-eslint/ban-types */
import { Model, model, Schema } from 'mongoose'

const UserSchema = new Schema<UserDBO>(
  {
    lastName: {
      required: true,
      type: String
    },
    name: {
      required: true,
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: {
      transform: (_, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
      }
    }
  }
)

type UserModelType = Model<UserDBO, {}, {}>

const UserModel = model<UserDBO, UserModelType>('users', UserSchema)

export { UserModel, UserModelType }
