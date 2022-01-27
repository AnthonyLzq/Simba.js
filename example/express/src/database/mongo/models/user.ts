import { model, Schema } from 'mongoose'

const User = new Schema<IUser>(
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
    versionKey: false,
    toJSON: {
      transform(_, ret) {
        ret.id = ret._id.toString()
        ret.updatedAt = ret.updatedAt.toISOString()
        delete ret._id
        delete ret.__v
      },
      virtuals: true
    }
  }
)

const UserModel = model<IUser>('users', User)

export { UserModel }
