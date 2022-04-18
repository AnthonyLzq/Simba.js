import { gql } from 'apollo-server-core'

const User = gql`
  type User {
    id: ID!
    name: String!
    lastName: String!
    updatedAt: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: ID!): User!
  }

  input StoreUserInput {
    lastName: String!
    name: String!
  }

  input UpdateUserInput {
    id: String!
    lastName: String!
    name: String!
  }

  type Mutation {
    storeUser(user: StoreUserInput!): User!
    deleteAllUsers: String
    updateUser(user: UpdateUserInput!): User!
    deleteUser(id: ID!): String
  }
`

export { User }
