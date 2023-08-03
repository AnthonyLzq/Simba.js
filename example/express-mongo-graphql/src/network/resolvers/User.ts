import 'reflect-metadata'
import { Arg, Field, InputType, Mutation, Query, Resolver } from 'type-graphql'

import { User } from 'network/models'
import { UserService } from 'services'

@InputType()
class UserInput {
  @Field()
  name!: string

  @Field()
  lastName!: string
}

@Resolver(User)
class UserResolver {
  readonly #userService = new UserService()

  @Query(() => User)
  async getById(@Arg('id') id: string) {
    return this.#userService.getById(id)
  }

  @Mutation(() => User)
  async store(@Arg('user') user: UserInput) {
    return this.#userService.store(user)
  }

  @Mutation(() => User)
  async update(@Arg('id') id: string, @Arg('user') user: UserInput) {
    return this.#userService.update(id, user)
  }

  @Mutation(() => String)
  async deleteById(@Arg('id') id: string) {
    return this.#userService.deleteById(id)
  }
}

export { UserResolver }
