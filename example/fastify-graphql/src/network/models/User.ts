import 'reflect-metadata'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
class User {
  @Field(() => Int)
  id!: number

  @Field()
  lastName!: string

  @Field()
  name!: string

  @Field({ nullable: true })
  createdAt?: string

  @Field({ nullable: true })
  updatedAt?: string
}

export { User }
