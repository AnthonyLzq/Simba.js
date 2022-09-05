import { gql } from 'apollo-server-core'

const User = gql`
  type User {
    id: Int!
    name: String!
    lastName: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: Int!): User!
  }

  input StoreUserInput {
    lastName: String!
    name: String!
  }

  input UpdateUserInput {
    id: Int!
    lastName: String!
    name: String!
  }

  type Mutation {
    storeUser(user: StoreUserInput!): User!
    deleteAllUsers: String
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: Int!): String
  }
`

export { User }
