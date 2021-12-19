import { model, Schema } from 'mongoose'

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
    },
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        delete ret.updatedAt
      },
      versionKey: false,
      virtuals: true
    }
  }
)

const UserModel = model<IUser>('users', User)

export { UserModel }
