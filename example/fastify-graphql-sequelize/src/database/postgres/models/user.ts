import { Model, Column, Table, DataType } from 'sequelize-typescript'

@Table({
  paranoid: true,
  tableName: 'users'
})
class User extends Model {
  @Column({
    type: DataType.STRING
  })
  name!: string

  @Column({
    type: DataType.STRING
  })
  lastName!: string

  @Column({
    type: DataType.STRING
  })
  email!: string
}

export { User }
