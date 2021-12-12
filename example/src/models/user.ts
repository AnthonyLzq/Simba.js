/* eslint-disable no-underscore-dangle */
import { Document, model, Schema } from 'mongoose'

interface IUser extends Document {
  lastName: string
  name: string
  updatedAt: Date
}

const User = new Schema(
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
    timestamps: {
      createdAt: false,
      updatedAt: true
    }
  }
)

User.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: function (_: any, ret: any) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.updatedAt
  },
  versionKey: false,
  virtuals: true
})

const UserModel = model<IUser>('users', User)

export { IUser, UserModel }
