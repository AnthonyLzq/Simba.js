<h1 align="center">
  <!-- <p align="center">Simba.js</p> -->
  <a href="./static/simba.png"><img src="https://i.ibb.co/QFX0WnH/simba-pink.png" alt="Simba.js"></a>
</h1>


[![NPM version](https://img.shields.io/npm/v/@anthonylzq/simba.js.svg?style=flat)](https://www.npmjs.com/package/@anthonylzq/simba.js)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/AnthonyLzq/simba.js/blob/master/LICENSE)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)
[![Lint](https://github.com/AnthonyLzq/simba.js/actions/workflows/lint.yml/badge.svg)](https://github.com/AnthonyLzq/simba.js/actions/workflows/lint.yml)
[![Tests for Simba APIs](https://github.com/AnthonyLzq/simba.js/actions/workflows/test.yml/badge.svg)](https://github.com/AnthonyLzq/simba.js/actions/workflows/test.yml)

Set up a modern backend app by running one command. This project has the goal to create a complete setup for a backend application using `TypeScript` and `Express` or `Fastify`. It will create many files that are usually created manually. Think about Simba.js like a [CRA](https://create-react-app.dev/), but for backend development. Check the [**project structure**](#project-structure) for more information.

## Installation

This package is meant to be installed globally in your computer by using:

```bash
npm i -g @anthonylzq/simba.js
```

## Usage

As developer you have two main options to create your new project, one is by running:

```bash
simba -q
```

By doing this your prompt will ask you the following questions:

- `Yarn or npm?`, only one of them is valid (lowercase).
- `Express or Fastify?`, only one of them is valid (lowercase).
- `Project name:`, at least one character must be provided.
- `Project description:`, at least one character must be provided.
- `Author:`, at least one character must be provided.
- `Email:`, a correct email address must be provided.
- `Project version (0.1.0):` the initial version of the project, `0.1.0` as default.
- `Select your license [1...7]:`, the license you have chosen for the project.
- `License year (current year):`, the year where your license starts, current year as default.
- `Will this project use GraphQL? [y/n]:`, yes or no question, only **y** or **n** is accepted. This is not case sensitive.
- `Will this project be deployed with Heroku? [y/n]:`.
- `Would you want to have a basic suit of tests with Jest? [y/n]:`.
- `Would you want to have a basic GitHub Action for the suit of tests and linting? [y/n]:`.

The second option you have is by passing flags in one single command. If you need help, please run:

```bash
simba -h
```

This will generate the following output:

```bash
"simba [options]" (if you it installed globally) or only "simba -q" if you want
to be asked for the options one by one.

Options:
  -N, --projectName              Project name.
  -D, --projectDescription       Project description.
  -a, --author                   Author of the project.
  -e, --email                    Email of the author.
  -H, --heroku                   Whether or not the project will be deployed
                                 using Heroku.        [boolean] [default: false]
  -l, --license                  Type of license for the project, it can be one
                                 of: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0
                                 and AGPL 3.0, in lowercase without its version.
                                                         [default: "unlicensed"]
  -v, --version                  Project initial version.     [default: "0.1.0"]
  -y, --licenseYear              Year when the license starts. [default: "2022"]
  -n, --npm                      Whether or not the project should use npm as
                                 package manager.     [boolean] [default: false]
  -f, --mainFile                 Main file of the project.
                                                       [default: "src/index.ts"]
  -q, --questions                Whether or not you want to be asked to answer
                                 the questions related to the project one by
                                 one.                 [boolean] [default: false]
  -F, --fastify                  Whether or not you want to use Fastify for your
                                 project.             [boolean] [default: false]
  -g, --graphql                  Whether or not you want to use GraphQL for your
                                 project.             [boolean] [default: false]
  -t, --tests                    Whether or not you want to have a basic suit of
                                 unit tests with Jest.[boolean] [default: false]
      --ghat, --gh-action-tests  Whether or not you want to have a GitHub Action
                                 with a CI for your tests and linting. If this
                                 option is set to true, the tests flag must be
                                 set to true.                   [default: false]
  -d, --database                 Which database you want to use, available
                                 databases are: MongoDB, PostgreSQL, MySQL,
                                 MariaDB, Sqlite and Microsoft SQL Server.
                                                              [default: "mongo"]
  -h, --help                     Show help                             [boolean]

Examples:
  simba -N 'Project Name' -D 'Project description' -a Anthony -e
  sluzquinosa@uni.pe -l mit -F -t -d mongo --ghat

Developed by AnthonyLzq
```

### Examples

Let's suppose you want to build a project that will be deployed to Heroku, so should run:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H
```

Here we are specifying that we want to create a new project called `myProject` using the `MIT` license, my name and my email are respectively: `myName` and `myEmail@email.com` and I want to use heroku to deploy this server.

As default, `yarn` is selected as package manager, but if you don't want to use it, you can pass the flag `-n` or `--npm` as follows:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -n
```

What if I want to use Fastify instead Express? Well, you only have to pass the `-F` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F
```

If I want to use a relational database instead MongoDB? Well, you only have to pass the `-d` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F -d postgresql
```

And how can I use GraphQL? Well, you only have to pass the `-g` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F -g
```

Finally, you may not want to use a license or one of the available licenses, don't worry, just don't pass the flag `-l` neither `--license` as follows:

```bash
simba -N myProject -D 'This is a test' -a myName -e myEmail@email.com -H
```

#### Why I didn't you use [`TypeGraphQL`](https://typegraphql.com/)?

[They don't support GraphQL v16.x.x](https://github.com/MichalLytek/type-graphql/issues/1100), until then.

## <a name="project-structure"></a>Project structure

If you want to check the content of the files, please check the [example](https://github.com/AnthonyLzq/simba.js/tree/master/example) folder, there you will an example for both, Express and Fastify (REST and GraphQL versions). Regardless of the option chosen, a new folder will be generated with the name of the project.

Also, if you are interested in the folder structure of each case, please take a look at:

- [Express case](./projectStructureExamples/express.txt)
- [Express-GraphQL case](./projectStructureExamples/express-graphql.txt)
- [Express-GraphQL-Sequelize case](./projectStructureExamples/express-GraphQL-sequelize.txt)
- [Express-Sequelize case](./projectStructureExamples/express-sequelize.txt)
- [Fastify case](./projectStructureExamples/fastify.txt)
- [Fastify-GraphQL case](./projectStructureExamples/fastify-graphql.txt)
- [Fastify-GraphQL-Sequelize case](./projectStructureExamples/fastify-graphql-sequelize.txt)
- [Fastify-Sequelize case](./projectStructureExamples/fastify-sequelize.txt)

### Some considerations

- You are able to run a server that has one main route, `home` (`/`), `user` (`api/user` or `api/user/:id`) and `docs` (`api/docs`), in case you are not using GraphQL.
- In case you are using GraphQL, there are 4 mutations (`storeUser`, `updateUser`, `deleteAllUsers` and `deleteUser`) and 2 queries available (`getUsers` and `getUser`), you can find them in the playground under the route `/api`.
- To connect your server with your `MongoDB` database, you need to provide your `uri` in the `.env`. By default, Simba will try to connect to a local database. The content of the `.env` file is:

  ```bash
  MONGO_URI = mongodb://mongo:mongo@mongo:27017/${projectName}
  ```

  Where `${projectName}` will be replaced by the name of the project you provided in lowercase.
- Once you have done that, now you can perform the following `HTTP REQUEST`: `GET`, `POST`, `PATCH` and `DELETE`.
- In order to use global variables, just add the one you need in the `src/@types/index.d.ts` file, and add a new `var` with its type to the `global` interface, as follows:
    ```ts
    // src/@types/index.d.ts

    // Some code...
    declare global {
      var globalStringVariable: string
      // Some more code...
    }
    // Some more code...

    // another file
    global.globalStringVariable = 'Hi mom, I am global'
    console.log({ globalStringVariable })
    ```

- The provided project structure is inspired in my personal experience as [`Node.js`](https://nodejs.org/en/) developer and the [`Nest`](https://nestjs.com/) framework. It follows a layered architecture:

  1. Presentation layer (network layer): it is represented by the network and schemas folders, which contains the routes and the schemas necessary for each route.
  2. Business layer (services layer): it is represented by the services folder, which contains all the code related to the business logic of your application.
  3. Persistance layer (database layer): it is represented by the database folder, which contains the database connection, models and queries (that will be used by the services). Multiple database connection are possible and should be implemented here.

- The server is fully tested and has no errors (at least for now), feel free to report one [here](https://github.com/AnthonyLzq/simba.js/issues).
- Support for windows and linux platforms is available.
- To check the content of the files generated, please check the `example` folder.
- If you provide a project name that contains spaces, something like 'My awesome Project',  every space will be replaced with a hyphen. So at the end your project name will be 'My-awesome-project', but in its README.md file, the hyphens will be removed and the project name will be parsed to title case (My Awesome Project).
- Finally, `git` will be initialized and a list of libraries will be installed. Check the [**notes**](#notes).
- Relative imports is already configured, you do not need to import a file using `../../../some/very/nested/stuff/in/other/folder`, you can use `some/very/nested/stuff/in/other/folder` assuming that your folder is under the `src` folder.
- The Fastify version is set to v3 because Apollo Server has not yet provided support for Fastify v4 yet, and it is difficult to have support for two different major versions of Fastify, so until Apollo Server supports Fastify v4, this package will use Fastify v3.
- Support for Heroku will be deprecated in the next major release because it drops its free tier.

## Who uses Simba.js?

<p align="left" style="display: flex; align-items: center;">
  <a href="https://chazki.com/">
    <img
      width="272"
      src="https://i.ibb.co/3kbN6gG/logo-chazki-blanco-250px.png"
      alt="Simba.js"
    >
  </a>
  <a href="https://www.mein.ai">
    <img
      width="269"
      src="https://static.wixstatic.com/media/e61b06_ed2d347ea1a44effa5a912e7d4fdd9a2~mv2.png/v1/fill/w_269,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/logoMein.png"
      alt="Simba.js"
    >
  </a>
</p>

## What is new?

Please check the [`changelog.md`](https://github.com/AnthonyLzq/simba.js/blob/master/CHANGELOG.md) file. Also, if you want to check what is coming, check the [road map](https://simbajs.notion.site/simbajs/783092dc7d444067b4c56a25d671f658?v=31060f3d17524ca58870e86c2960a6df).

### Version 6.x.x

In this major version I would be focusing on adding integrations for CI/CD and testing.

## <a name="notes"></a>Notes

Here is the list of the packages that are being installed, as `dependencies`:

- [`@sinclair/typebox`](https://www.npmjs.com/package/@sinclair/typebox)
- [`ajv`](https://www.npmjs.com/package/ajv)
- [`http-errors`](https://www.npmjs.com/package/http-errors)
- [`mongoose`](https://mongoosejs.com/)
- [`pino-pretty`](https://www.npmjs.com/package/pino-pretty)

As `devDependencies`:

- [`@types/http-errors`](https://www.npmjs.com/package/@types/http-errors)
- [`@types/node`](https://www.npmjs.com/package/@types/node)
- [`@typescript-eslint/eslint-plugin`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser)
- [`axios`](https://www.npmjs.com/package/axios)
- [`dotenv`](https://www.npmjs.com/package/dotenv)
- [`eslint`](https://www.npmjs.com/package/eslint)
- [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier)
- [`eslint-config-standard`](https://www.npmjs.com/package/eslint-config-standard)
- [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import)
- [`eslint-plugin-n`](https://www.npmjs.com/package/eslint-plugin-n) (in case you are using yarn as package manager)
- [`eslint-plugin-prettier`](https://www.npmjs.com/package/eslint-plugin-prettier)
- [`nodemon`](https://www.npmjs.com/package/nodemon)
- [`prettier`](https://www.npmjs.com/package/prettier)
- [`standard-version`](https://www.npmjs.com/package/standard-version)
- [`ts-loader`](https://www.npmjs.com/package/ts-loader)
- [`ts-node`](https://www.npmjs.com/package/ts-node)
- [`tsconfig-paths`](https://www.npmjs.com/package/tsconfig-paths)
- [`tsconfig-paths-webpack-plugin`](https://www.npmjs.com/package/tsconfig-paths-webpack-plugin)
- [`typescript`](https://www.npmjs.com/package/typescript)
- [`webpack`](https://www.npmjs.com/package/webpack)
- [`webpack-cli`](https://www.npmjs.com/package/webpack-cli)
- [`webpack-node-externals`](https://www.npmjs.com/package/webpack-node-externals)

### In case you are using GraphQL

As `dependencies`:
- [`@graphql-tools/schema`](https://www.npmjs.com/package/@graphql-tools/schema)
- [`ajv`](https://www.npmjs.com/package/ajv)
- [`ajv-formats`](https://www.npmjs.com/package/ajv-formats)
- [`apollo-server-core`](https://www.npmjs.com/package/apollo-server-core)
- [`graphql`](https://www.npmjs.com/package/graphql)

### In case you added a suit of tests:

As `devDependencies`:
- [`@jest/types`](https://www.npmjs.com/package/@jest/types)
- [`@types/jest`](https://www.npmjs.com/package/@types/jest)
- [`eslint-plugin-jest`](https://www.npmjs.com/package/eslint-plugin-jest)
- [`jest`](https://www.npmjs.com/package/jest)
- [`jest-unit`](https://www.npmjs.com/package/jest-unit)
- [`ts-jest`](https://www.npmjs.com/package/ts-jest)

### Express case

As `dependencies`:

- [`cors`](https://www.npmjs.com/package/cors)
- [`express`](https://www.npmjs.com/package/express)
- [`express-pino-logger`](https://www.npmjs.com/package/express-pino-logger)
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express)

As `devDependencies`:

- [`@types/express`](https://www.npmjs.com/package/@types/express)
- [`@types/cors`](https://www.npmjs.com/package/@types/cors)
- [`@types/express-pino-logger`](https://www.npmjs.com/package/@types/express-pino-logger)
- [`@types/swagger-ui-express`](https://www.npmjs.com/package/@types/swagger-ui-express)

#### In case you are using GraphQL

As `dependencies`:
- [`apollo-server-express`](https://www.npmjs.com/package/apollo-server-express)

### Fastify case

As `dependencies`:

- [`fastify`](https://www.npmjs.com/package/fastify)
- [`fastify-cors`](https://www.npmjs.com/package/fastify-cors)
- [`fastify-swagger`](https://www.npmjs.com/package/fastify-swagger)

#### In case you are using GraphQL

As `dependencies`:
- [`apollo-server-fastify`](https://www.npmjs.com/package/apollo-server-fastify)
- [`apollo-server-plugin-base`](https://www.npmjs.com/package/apollo-server-plugin-base)

Feel free to contribute to this project. Every contribution will be appreciated.

### In case you are using a relational database

As `dependencies`:

- [`sequelize`](https://www.npmjs.com/package/sequelize)
- [`sequelize-typescript`](https://www.npmjs.com/package/sequelize-typescript)
- [`sequelize-typescript-migration-lts`](https://www.npmjs.com/package/sequelize-typescript-migration-lts)

#### PostgreSQL case

As `dependencies`:

- [`pg`](https://www.npmjs.com/package/pg)
- [`pg-hstore`](https://www.npmjs.com/package/pg-hstore)

#### MySql case

As `dependencies`:

- [`mysql2`](https://www.npmjs.com/package/mysql2)

#### MariaDB case

As `dependencies`:

- [`mariadb`](https://www.npmjs.com/package/mariadb)

#### Sqlite case

As `dependencies`:

- [`sqlite3`](https://www.npmjs.com/package/sqlite3)

#### SQLServer case

As `dependencies`:

- [`tedious`](https://www.npmjs.com/package/tedious)

## Author

- **Anthony Luzquiños** - _Initial Work_ - _Documentation_ - [AnthonyLzq](https://github.com/AnthonyLzq).

## Contributors

- **Andree Anchi** - _Bug reports_ - [andreewaD](https://github.com/andreewD).
