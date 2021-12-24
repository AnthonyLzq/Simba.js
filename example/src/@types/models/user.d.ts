interface IUser {
  _id: import('mongoose').Types.ObjectId
  name: string
  lastName: string
  updatedAt: Date
}
