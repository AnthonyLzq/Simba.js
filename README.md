# Simba.js

[![NPM version](https://img.shields.io/npm/v/@anthonylzq/simba.js.svg?style=flat)](https://www.npmjs.com/package/@anthonylzq/simba.js)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/AnthonyLzq/simba.js/blob/master/LICENSE)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

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
- `Will this project be deployed with Heroku? [y/n]:`, yes or no question, only **y** or **n** is accepted. This is not case sensitive.

The second option you have is by passing flags in one single command. If you need help, please run:

```bash
simba -h
```

This will generate the following output:

```bash
"simba [options]" (if you it installed globally) or only "simba -q" if you want
to be asked for the options one by one

Options:
  -N, --projectName         Project name
  -D, --projectDescription  Project description
  -a, --author              Author of the project
  -e, --email               Email of the author
  -H, --heroku              Whether or not the project will be deployed using
                            Heroku                    [boolean] [default: false]
  -l, --license             Type of license for the project, it can be one of:
                            MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL
                            3.0, in lowercase without its version
                                                         [default: "unlicensed"]
  -v, --version             Project initial version           [default: "0.1.0"]
  -y, --licenseYear         Year when the license starts       [default: "2022"]
  -n, --npm                 Whether or not the project should use npm as package
                            manager                   [boolean] [default: false]
  -f, --mainFile            Main file of the project   [default: "src/index.ts"]
  -q, --questions           Whether or not you want to be asked to answer the
                            questions related to the project one by one
                                                      [boolean] [default: false]
  -F, --fastify             Whether or not you want to use Fastify for your
                            project                   [boolean] [default: false]
  -h, --help                Show help                                  [boolean]

Examples:
  simba -N 'Project Name' -D 'Project description' -a Anthony -e
  sluzquinosa@uni.pe

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

And what if I want to use Fastify instead Express? Well, you only have to pass the `-F` flag:

```bash
simba -N myProject -D 'This is a test' -l mit -a myName -e myEmail@email.com -H -F
```

Finally, you may not want to use a license or one of the available licenses, don't worry, just don't pass the flag `-l` neither `--license` as follows:

```bash
simba -N myProject -D 'This is a test' -a myName -e myEmail@email.com -H
```

## <a name="project-structure"></a>Project structure

Regardless of the option chosen, a new folder will be generated with the name of the project, it will contain the following structure, depending if you have chosen Express or Fastify:

### Express case

```
📂node_modules
📂src
 ┣ 📂@types
 ┃ ┣ 📂custom
 ┃ ┃ ┣ 📜request.d.ts
 ┃ ┃ ┗ 📜response.d.ts
 ┃ ┣ 📂dto
 ┃ ┃ ┗ 📜user.d.ts
 ┃ ┣ 📂models
 ┃ ┃ ┗ 📜user.d.ts
 ┃ ┗ 📜index.d.ts
 ┣ 📂database
 ┃ ┣ 📂mongo
 ┃ ┃ ┣ 📂models
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┣ 📂queries
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┗ 📜index.ts
 ┃ ┗ 📜index.ts
 ┣ 📂network
 ┃ ┣ 📂routes
 ┃ ┃ ┣ 📂schemas
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┣ 📜home.ts
 ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┗ 📜user.ts
 ┃ ┣ 📜index.ts
 ┃ ┣ 📜response.ts
 ┃ ┣ 📜routes.ts
 ┃ ┗ 📜server.ts
 ┣ 📂services
 ┃ ┣ 📂utils
 ┃ ┃ ┣ 📂messages
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┗ 📜index.ts
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.ts
 ┣ 📂utils
 ┃ ┣ 📜docs.json
 ┃ ┗ 📜index.ts
 ┗ 📜index.ts
📜.env
📜.eslintignore
📜.eslintrc
📜.gitignore
📜CHANGELOG.md
📜Dockerfile
📜heroku.yml
📜index.http
📜LICENSE
📜nodemon.json
📜package.json
📜README.md
📜index.http
📜tsconfig.base.json
📜tsconfig.json
📜webpack.config.js
📜yarn.lock (or package-lock.json)
```

### Fastify case

```
📂node_modules
📂src
 ┣ 📂@types
 ┃ ┣ 📂dto
 ┃ ┃ ┗ 📜user.d.ts
 ┃ ┣ 📂models
 ┃ ┃ ┗ 📜user.d.ts
 ┃ ┗ 📜index.d.ts
 ┣ 📂database
 ┃ ┣ 📂mongo
 ┃ ┃ ┣ 📂models
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┣ 📂queries
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┗ 📜index.ts
 ┃ ┗ 📜index.ts
 ┣ 📂network
 ┃ ┣ 📂routes
 ┃ ┃ ┣ 📂schemas
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┣ 📜docs.ts
 ┃ ┃ ┣ 📜home.ts
 ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┗ 📜user.ts
 ┃ ┣ 📜index.ts
 ┃ ┣ 📜response.ts
 ┃ ┣ 📜routes.ts
 ┃ ┗ 📜server.ts
 ┣ 📂services
 ┃ ┣ 📂utils
 ┃ ┃ ┣ 📂messages
 ┃ ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┃ ┗ 📜user.ts
 ┃ ┃ ┗ 📜index.ts
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.ts
 ┗ 📜index.ts
📜.env
📜.eslintignore
📜.eslintrc
📜.gitignore
📜CHANGELOG.md
📜Dockerfile
📜heroku.yml
📜index.http
📜LICENSE
📜nodemon.json
📜package.json
📜README.md
📜index.http
📜tsconfig.base.json
📜tsconfig.json
📜webpack.config.js
📜yarn.lock (or package-lock.json)
```

If you want to check the content of the files, please check the [example](https://github.com/AnthonyLzq/simba.js/tree/master/example) folder, there you will an example for both, Express and Fastify.

### Some considerations

- This project was based in other project from my own, [`typescript-project-generator`](https://www.npmjs.com/package/typescript-project-generator), but only considering the `express-mongoose` part.
- You are able to run a server that has one main route, `home` (`/`), `user` (`api/user` or `api/user/:id`) and `docs` (`api/docs`).
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

  1. Presentation layer (network layer): it is represented by the network folder, which contains the routes and the necessary schemas for each route.
  2. Business layer (services layer): it is represented by the services folder, which contains all the code related to the business logic of your application.
  3. Persistance layer (database layer): it is represented by the database folder, which contains the database connection, models and queries (that will be used by the services). Multiple database connection are possible and should be implemented here.

- The server is fully tested and has no errors (at least for now), feel free to report one [here](https://github.com/AnthonyLzq/simba.js/issues).
- Support for windows and linux platforms is available.
- To check the content of the files generated, please check the `example` folder.
- If you provide a project name that contains spaces, something like 'My awesome Project',  every space will be replaced with a hyphen. So at the end your project name will be 'My-awesome-project', but in its README.md file, the hyphens will be removed and the project name will be parsed to title case (My Awesome Project).
- Finally, `git` will be initialized and a list of libraries will be installed. Check the [**notes**](#notes).
- Relative imports is already configured, you do not need to import a file using `../../../some/very/nested/stuff/in/other/folder`, you can use `some/very/nested/stuff/in/other/folder` assuming that your folder is under the `src` folder.

## What is new?

Please check the [`changelog.md`](https://github.com/AnthonyLzq/simba.js/blob/master/CHANGELOG.md) file. Also, if you want to check what is coming, check the [road map](https://simbajs.notion.site/simbajs/783092dc7d444067b4c56a25d671f658?v=31060f3d17524ca58870e86c2960a6df). 

## <a name="notes"></a>Notes

Here is the list of the packages that are being installed, as `devDependencies`:

- [`@types/http-errors`](https://www.npmjs.com/package/@types/http-errors)
- [`@types/node`](https://www.npmjs.com/package/@types/node)
- [`@typescript-eslint/eslint-plugin`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser)
- [`dotenv`](https://www.npmjs.com/package/dotenv)
- [`eslint`](https://www.npmjs.com/package/eslint)
- [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier)
- [`eslint-config-standard`](https://www.npmjs.com/package/eslint-config-standard)
- [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import)
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

As `dependencies`:

- [`http-errors`](https://www.npmjs.com/package/http-errors)
- [`mongoose`](https://mongoosejs.com/)

### Express case

As `devDependencies`:

- [`@types/express`](https://www.npmjs.com/package/@types/express)
- [`@types/morgan`](https://www.npmjs.com/package/@types/morgan)
- [`@types/swagger-ui-express`](https://www.npmjs.com/package/@types/swagger-ui-express)

As `dependencies`:

- [`express`](https://expressjs.com/)
- [`joi`](https://joi.dev/api/?v=17.4.2)
- [`morgan`](https://www.npmjs.com/package/morgan)
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express)

### Fastify case

As `dependencies`:

- [`@sinclair/typebox`](https://www.npmjs.com/package/@sinclair/typebox)
- [`fastify`](https://www.npmjs.com/package/fastify)
- [`fastify-swagger`](https://www.npmjs.com/package/fastify-swagger)

Feel free to contribute to this project. Every contribution will be appreciated.

## Author

- **Anthony Luzquiños** - _Initial Work_ - _Documentation_ - [AnthonyLzq](https://github.com/AnthonyLzq).

## Contributors

- **Andree Anchi** - _Bug reports_ - [andreewaD](https://github.com/andreewD).
