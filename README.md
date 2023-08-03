<h1 align="center">
  <!-- <p align="center">Simba.js</p> -->
  <a href="./static/simba.png"><img src="https://i.ibb.co/QFX0WnH/simba-pink.png" alt="Simba.js"></a>
</h1>


[![NPM version](https://img.shields.io/npm/v/@anthonylzq/simba.js.svg?style=flat)](https://www.npmjs.com/package/@anthonylzq/simba.js)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/AnthonyLzq/simba.js/blob/master/LICENSE)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)
[![Publish](https://github.com/AnthonyLzq/TypeScriptProjectGenerator/actions/workflows/publish.yml/badge.svg)](https://github.com/AnthonyLzq/TypeScriptProjectGenerator/actions/workflows/publish.yml)

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

- `Project name?`, at least one character must be provided.
- `Project description:`, at least one character must be provided.
- `Select your package manager`, `npm`, `yarn` and `pnpm` are available.
- `Author:`, at least one character must be provided.
- `Email:`, a correct email address must be provided.
- `Project version:` the initial version of the project, `0.1.0` as default.
- `License:`, the license you have chosen for the project.
- `License year (current year):`, the year where your license starts, current year as default.
- `Would you want to have a basic GitHub Action for the suit of tests and linting? [y/n]:`.
- `Express or Fastify?`, only one of them is valid (lowercase).
- `Will this project use GraphQL? [y/n]:`, yes or no question, only **y** or **n** is accepted. This is not case sensitive.
- `Which database do you want to use?`, `MongoDB`, `PostgreSQL`, `MySQL`, `MariaDB`, `Sqlite` and `Microsoft SQL Server` are available.

The second option you have is by passing flags in one single command. If you need help, please run:

```bash
simba -h
```

This will generate the following output:

```bash
Simba.js, the easiest way to create your TypeScript APIs

Usage:
"simba [options]" or only "simba -q" if you want to be asked for the options one
by one.

Options:
  -N, --projectName              Project name.
  -D, --projectDescription       Project description.
  -a, --author                   Author of the project.
  -e, --email                    Email of the author.
  -l, --license                  Type of license for the project, it can be one
                                 of: MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0
                                 and AGPL 3.0, in lowercase without its version.
                                                         [default: "unlicensed"]
  -v, --version                  Project initial version.     [default: "0.1.0"]
  -y, --licenseYear              Year when the license starts. [default: "2023"]
  -m, --manager                  Which package manager you want to use,
                                 available package managers are: npm, yarn and
                                 pnpm.                         [default: "pnpm"]
  -f, --mainFile                 Main file of the project.
                                                       [default: "src/index.ts"]
  -q, --questions                Whether or not you want to be asked to answer
                                 the questions related to the project one by
                                 one.                 [boolean] [default: false]
  -F, --fastify                  Whether or not you want to use Fastify for your
                                 project.             [boolean] [default: false]
  -g, --graphql                  Whether or not you want to use GraphQL for your
                                 project.             [boolean] [default: false]
      --ghat, --gh-action-tests  Whether or not you want to have a GitHub Action
                                 with a CI for your tests and linting. If this
                                 option is set to true, the tests flag must be
                                 set to true.                   [default: false]
  -d, --database                 Which database you want to use, available
                                 databases are: MongoDB (mongo), PostgreSQL
                                 (postgres), MySQL (mysql), MariaDB (mariadb),
                                 Sqlite (sqlite) and Microsoft SQL Server
                                 (sqlServer).                 [default: "mongo"]
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

As default, `pnpm` is selected as package manager, but if you don't want to use it, you can pass the flag `-m` or `--manager` as follows:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -m yarn
```

What if I want to use Fastify instead Express? Well, you only have to pass the `-F` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F
```

If I want to use a relational database instead MongoDB? Well, you only have to pass the `-d` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F -d postgres
```

The available databases are:
  - `MongoDB` (_mongo_)
  - `PostgreSQL` (_postgres_)
  - `MySQL` (_mysql_)
  - `MariaDB` (_mariadb_)
  - `Sqlite` (_sqlite_)
  - `Microsoft SQL Server` (_sqlServer_).

And how can I use GraphQL? Well, you only have to pass the `-g` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F -g
```

Finally, you may not want to use a license or one of the available licenses, don't worry, just don't pass the flag `-l` neither `--license` as follows:

```bash
simba -N myProject -D 'This is a test' -a myName -e myEmail@email.com -H
```

## <a name="project-structure"></a>Project structure

If you want to check the content of the files, please check the [example](https://github.com/AnthonyLzq/simba.js/tree/master/example) folder, there you will an example for both, Express and Fastify (REST and GraphQL versions). Regardless of the option chosen, a new folder will be generated with the name of the project.

Also, if you are interested in the folder structure of each case, please take a look at:

- [Express](./projectStructureExamples/express.txt)
- [Express-GraphQL](./projectStructureExamples/express-graphql.txt)
- [Express-Mongo](./projectStructureExamples/express-mongo.txt)
- [Express-Mongo-GraphQL](./projectStructureExamples/express-mongo-graphql.txt)
- [Fastify](./projectStructureExamples/fastify.txt)
- [Fastify-GraphQL](./projectStructureExamples/fastify-graphql.txt)
- [Fastify-Mongo](./projectStructureExamples/fastify-mongo.txt)
- [Fastify-Mongo-GraphQL](./projectStructureExamples/fastify-mongo-graphql.txt)

### Some considerations

- You are able to run a server that has one main route, `home` (`/`), `user` (`api/user` or `api/user/:id`) and `docs` (`api/docs`), in case you are not using GraphQL.
- In case you are using GraphQL, there are 3 mutations (`store`, `update`, and `deleteById`) and 1 query available (`getById`), you can find them in the playground under the route `/api`.
- To connect your server with your database, you need to provide your database url in the `.env`, except if you choose `sqlite`. By default, Simba will try to connect to a local database. The content of the `.env` file is:

  ```bash
  DATABASE_URL = mongodb://mongo:mongo@mongo:27017/${projectName} # in case you choose mongo
  # or
  DATABASE_URL = postgres://postgres:postgres@postgres:5432/${projectName} # in case you choose postgres
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

## Who uses Simba.js?

<table>
  <tr>
    <td align="center">
      <a href="https://chazki.com">
        <img src="https://i.ibb.co/3kbN6gG/logo-chazki-blanco-250px.png" width="160" />
      </a>
    </td>
    <td align="center">
      <a href="https://www.mein.ai">
        <img src="https://static.wixstatic.com/media/e61b06_ed2d347ea1a44effa5a912e7d4fdd9a2~mv2.png/v1/fill/w_269,h_64,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/logoMein.png" width="160" />
      </a>
    </td>
    <td align="center">
      <a href="https://www.securitec.pe">
        <img src="https://securitec.pe/LogoBlanco.svg" width="160" />
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">Chazki</td>
    <td align="center">Mein</td>
    <td align="center">Securitec</td>
  </tr>
</table>


## What is new?

Please check the [`changelog.md`](https://github.com/AnthonyLzq/simba.js/blob/master/CHANGELOG.md) file. Also, if you want to check what is coming, check the [road map](https://simbajs.notion.site/simbajs/783092dc7d444067b4c56a25d671f658?v=31060f3d17524ca58870e86c2960a6df).

## <a name="notes"></a>Notes

Here is the list of the packages that are being installed, as `dependencies`:

- [`debug`](https://www.npmjs.com/package/debug)
- [`zod`](https://www.npmjs.com/package/zod)
- [`http-errors`](https://www.npmjs.com/package/http-errors)
- [`@prisma/client`](https://www.npmjs.com/package/@prisma/client)

As `devDependencies`:

- [`@jest/types`](https://www.npmjs.com/package/@jest/types)
- [`@types/debug`](https://www.npmjs.com/package/@types/debug)
- [`@types/http-errors`](https://www.npmjs.com/package/@types/http-errors)
- [`@types/jest`](https://www.npmjs.com/package/@types/jest)
- [`@types/node`](https://www.npmjs.com/package/@types/node)
- [`@typescript-eslint/eslint-plugin`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser)
- [`axios`](https://www.npmjs.com/package/axios)
- [`dotenv`](https://www.npmjs.com/package/dotenv)
- [`eslint`](https://www.npmjs.com/package/eslint)
- [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier)
- [`eslint-config-standard`](https://www.npmjs.com/package/eslint-config-standard)
- [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import)
- [`eslint-plugin-jest`](https://www.npmjs.com/package/eslint-plugin-jest)
- [`eslint-plugin-n`](https://www.npmjs.com/package/eslint-plugin-n) (in case you are using yarn as package manager)
- [`eslint-plugin-node`](https://www.npmjs.com/package/eslint-plugin-node)
- [`eslint-plugin-prettier`](https://www.npmjs.com/package/eslint-plugin-prettier)
- [`eslint-plugin-promise`](https://www.npmjs.com/package/eslint-plugin-promise)
- [`jest`](https://www.npmjs.com/package/jest)
- [`jest-unit`](https://www.npmjs.com/package/jest-unit)
- [`nodemon`](https://www.npmjs.com/package/nodemon)
- [`prettier`](https://www.npmjs.com/package/prettier)
- [`prisma`](https://www.npmjs.com/package/prisma)
- [`standard-version`](https://www.npmjs.com/package/standard-version)
- [`ts-loader`](https://www.npmjs.com/package/ts-loader)
- [`ts-node`](https://www.npmjs.com/package/ts-node)
- [`tsconfig-paths`](https://www.npmjs.com/package/tsconfig-paths)
- [`ts-jest`](https://www.npmjs.com/package/ts-jest)
- [`typescript`](https://www.npmjs.com/package/typescript)

### In case you are using GraphQL

As `dependencies`:
- [`@apollo/server`](https://www.npmjs.com/package/@apollo/server)
- [`class-validator`](https://www.npmjs.com/package/class-validator)
- [`graphql`](https://www.npmjs.com/package/graphql)
- [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata)
- [`type-graphql`](https://www.npmjs.com/package/type-graphql/v/2.0.0-beta.2)

### Express case

As `dependencies`:

- [`cors`](https://www.npmjs.com/package/cors)
- [`express`](https://www.npmjs.com/package/express)
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express)

As `devDependencies`:

- [`@types/express`](https://www.npmjs.com/package/@types/express)
- [`@types/cors`](https://www.npmjs.com/package/@types/cors)
- [`@types/swagger-ui-express`](https://www.npmjs.com/package/@types/swagger-ui-express)

### Fastify case

As `dependencies`:

- [`fastify`](https://www.npmjs.com/package/fastify)
- [`@fastify/swagger`](https://www.npmjs.com/package/@fastify/swagger)
- [`@fastify/swagger-ui`](https://www.npmjs.com/package/@fastify/swagger-ui)
- [`@fastify/cors`](https://www.npmjs.com/package/@fastify/cors)
- [`fastify-type-provider-zod`](https://www.npmjs.com/package/fastify-type-provider-zod)

#### In case you are using GraphQL

As `dependencies`:
- [`@as-integrations/fastify`](https://www.npmjs.com/package/@as-integrations/fastify)


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

Feel free to contribute to this project. Every contribution will be appreciated.

## Author

- **Anthony Luzquiños** - _Initial Work_ - _Documentation_ - [AnthonyLzq](https://github.com/AnthonyLzq).

## Contributors

- **Andree Anchi** - _Bug reports_ - [andreewaD](https://github.com/andreewD).
