'use strict'

const Sequelize = require('sequelize')

/**
 * Actions summary:
 *
 * createTable "users", deps: []
 *
 **/

const info = {
  revision: 1,
  name: 'init_database',
  created: '2022-08-01T00:19:30.599Z',
  comment: ''
}

const migrationCommands = [
  {
    fn: 'createTable',
    params: [
      'SequelizeMigrationsMeta',
      {
        revision: {
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        name: {
          allowNull: false,
          type: Sequelize.STRING
        },
        state: {
          allowNull: false,
          type: Sequelize.JSON
        }
      },
      {}
    ]
  },
  {
    fn: 'bulkDelete',
    params: [
      'SequelizeMigrationsMeta',
      [
        {
          revision: info.revision
        }
      ],
      {}
    ]
  },
  {
    fn: 'bulkInsert',
    params: [
      'SequelizeMigrationsMeta',
      [
        {
          revision: info.revision,
          name: info.name,
          state:
            '{"revision":1,"tables":{"users":{"tableName":"users","schema":{"id":{"seqType":"Sequelize.INTEGER","allowNull":false,"primaryKey":true,"autoIncrement":true},"name":{"seqType":"Sequelize.STRING"},"lastName":{"seqType":"Sequelize.STRING"},"email":{"seqType":"Sequelize.STRING"},"age":{"seqType":"Sequelize.INTEGER"},"createdAt":{"seqType":"Sequelize.DATE","allowNull":false},"updatedAt":{"seqType":"Sequelize.DATE","allowNull":false},"deletedAt":{"seqType":"Sequelize.DATE"}},"indexes":{}}}}'
        }
      ],
      {}
    ]
  },

  {
    fn: 'createTable',
    params: [
      'users',
      {
        id: {
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          type: Sequelize.INTEGER
        },
        name: {
          type: Sequelize.STRING
        },
        lastName: {
          type: Sequelize.STRING
        },
        email: {
          type: Sequelize.STRING
        },
        age: {
          type: Sequelize.INTEGER
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        deletedAt: {
          type: Sequelize.DATE
        }
      },
      {}
    ]
  }
]

const rollbackCommands = [
  {
    fn: 'bulkDelete',
    params: [
      'SequelizeMigrationsMeta',
      [
        {
          revision: info.revision
        }
      ],
      {}
    ]
  },

  {
    fn: 'dropTable',
    params: ['users']
  }
]

module.exports = {
  pos: 0,
  up(queryInterface, Sequelize) {
    let index = this.pos

    return new Promise(function (resolve, reject) {
      function next() {
        if (index < migrationCommands.length) {
          const command = migrationCommands[index]
          console.log('[#' + index + '] execute: ' + command.fn)
          index++
          queryInterface[command.fn]
            .apply(queryInterface, command.params)
            .then(next, reject)
        } else resolve()
      }
      next()
    })
  },
  down(queryInterface, Sequelize) {
    let index = this.pos

    return new Promise(function (resolve, reject) {
      function next() {
        if (index < rollbackCommands.length) {
          const command = rollbackCommands[index]
          console.log('[#' + index + '] execute: ' + command.fn)
          index++
          queryInterface[command.fn]
            .apply(queryInterface, command.params)
            .then(next, reject)
        } else resolve()
      }
      next()
    })
  },
  info
}
