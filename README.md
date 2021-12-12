# Simba.js

Set up a modern backend app by running one command. This project has the goal to create a complete setup for a backend application using `TypeScript` and `Express`. It will create many files that are usually created manually. Currently the following files are being created:

- `.env`
- `.eslintignore`
- `.eslintrc.js`
- `.gitignore`
- `CHANGELOG.md`
- `Dockerfile`
- `heroku.yml` (optional)
- `LICENSE` (optional, `MIT` as example)
- `nodemon.json`
- `package.json`
- `README.md`
- `tsconfig.json`
- `webpack.config.js`

## Installation

This package is meant to be installed globally in your computer by using:

```bash
npm i -g simba.js
```

## Usage

<!-- Also, if you don't want to install it globally, you can use npx as follows:

```bash
npx simba.js
``` -->

As developer you have two main options to create your new project, one is by running:

```bash
simba -q
```

By doing this your prompt will ask you the following questions:

- `Yarn or npm?`, only one of them is valid.
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
Usage: npx simba [options] or simba [options] (if you it installed globally) or
only simba if you want to be asked for the options one by one

Options:
  -a, --author              Author of the project
  -e, --email               Email of the author
  -N, --projectName         Project name
  -D, --projectDescription  Project description
  -H, --heroku              Whether or not the project will be deployed using
                            Heroku                    [boolean] [default: false]
  -l, --license             Type of license for the project, it can be one of:
                            MIT, Apache 2.0, MPL 2.0, LGPL 3.0, GPL 3.0 and AGPL
                            3.0, in lowercase without its version
                                                         [default: "unlicensed"]
  -v, --version             Project initial version           [default: "0.1.0"]
  -y, --licenseYear         Year when the license starts       [default: "2021"]
  -n, --npm                 Whether or not the project should use npm as package
                            manager                   [boolean] [default: false]
  -f, --mainFile            Main file of the project   [default: "src/index.ts"]
  -q, --questions           Whether or not you want to be asked to answer the
                            questions related to the project one by one
                                                      [boolean] [default: false]
  -h, --help                Show help                                  [boolean]

Examples:
  simba -a Anthony -e sluzquinosa@uni.pe -N "Project Name" -D "Project
  description"

Developed by AnthonyLzq
```

Regardless of the option chosen, a new folder will be generated with the name of the project, it will contain the following structure:

```
📦node_modules
📦src
 ┣ 📂@types
 ┃ ┣ 📜index.d.ts
 ┣ 📂controllers
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.ts
 ┣ 📂dto-interfaces
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.dto.ts
 ┣ 📂models
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.ts
 ┣ 📂network
 ┃ ┣ 📜index.ts
 ┃ ┣ 📜routes.ts
 ┃ ┗ 📜server.ts
 ┣ 📂routes
 ┃ ┣ 📜home.ts
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜user.ts
 ┣ 📂utils
 ┃ ┣ 📜index.ts
 ┃ ┗ 📜response.ts
 ┗ 📜index.ts
📜.env
📜.eslintignore
📜.eslintrc.js
📜.gitignore
📜CHANGELOG.md
📜Dockerfile
📜heroku.yml
📜LICENSE
📜nodemon.json
📜package.json
📜README.md
📜tsconfig.json
📜webpack.config.js
📜yarn.lock (or package-lock.json)
```

### Examples

Let's suppose you want to build a project that will be deployed to Heroku, so should run:

```bash
simba -a myName -e myEmail@email.com -N myProject -D 'This is a test' -H -l mit
```

Here we are specifying that we want to create a new project called `myProject` using the `MIT` license, and my name and my email are respectively: `myName` and `myEmail@email.com`.

As default, `yarn` is selected as package manager, but you don't want to use it, so you can pass the flag `-n` or `--npm` as follows:

```bash
simba -a myName -e myEmail@email.com -N myProject -D 'This is a test' -H -l mit -n
```

Finally, you may not want to use a license or one of the available licenses, don't worry, just don't pass the flag `-l` neither `--license` as follows:

```bash
simba -a myName -e myEmail@email.com -N myProject -D 'This is a test' -H
```

### Some considerations

- This project is based in other project from my own, [`typescript-project-generator`](https://www.npmjs.com/package/typescript-project-generator), but only considering the `express-mongoose-node` part.
- You are able to run a server that has one main route, `home` (`/`), and another one, `user` (`/user` or `/user/:userId`).
- To connect your server with your `MongoDB` database, you need to provide your `uri` in the `.env`. By default, we will try to connect to a local database. The content of the `.env` file is:

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
    globalStringVariable = 'Hi mom, I am global'
    console.log({ globalStringVariable })
    ```

- The provided project structure is inspired in my personal experience as [`Node.js`](https://nodejs.org/en/) developer and the [`Nest`](https://nestjs.com/) framework.
- The server is fully tested and has no errors (at least for now), feel free to report one [here](https://github.com/AnthonyLzq/simba.js/issues).
- Support for windows and linux platforms is available.
- To check the content of the files generated, please check the `example` folder.
- If you provide a project name that contains spaces, something like 'My awesome Project',  every space will be replaced with a hyphen. So at the end your project name will be 'My-awesome-project', but in its README.md file, the hyphens will be removed and the project name will be parsed to title case (My Awesome Project).
- Finally, `git` will be initialized and a list of libraries will be installed. Check the [**notes**](#notes).

## What is new?

Please check the `changelog.md` file.

## <a name="notes"></a>Notes

Here is the list of the packages that are being installed, as `devDependencies`:

- [`@types/express`](https://www.npmjs.com/package/@types/express)
- [`@types/http-errors`](https://www.npmjs.com/package/@types/http-errors)
- [`@types/morgan`](https://www.npmjs.com/package/@types/morgan)
- [`@types/node`](https://www.npmjs.com/package/@types/node/v/14.17.5)
- [`@types/swagger-ui-express`](https://www.npmjs.com/package/@types/swagger-ui-express)
- [`@typescript-eslint/eslint-plugin`](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- [`@typescript-eslint/parser`](https://www.npmjs.com/package/@typescript-eslint/parser)
- [`dotenv`](https://www.npmjs.com/package/dotenv)
- [`eslint`](https://www.npmjs.com/package/eslint)
- [`eslint-config-airbnb-typescript`](https://www.npmjs.com/package/eslint-config-airbnb-typescript)
- [`eslint-config-prettier`](https://www.npmjs.com/package/eslint-config-prettier)
- [`eslint-plugin-import`](https://www.npmjs.com/package/eslint-plugin-import)
- [`eslint-plugin-prettier`](https://www.npmjs.com/package/eslint-plugin-prettier)
- [`eslint-plugin-sort-keys-fix`](https://www.npmjs.com/package/eslint-plugin-sort-keys-fix)
- [`eslint-plugin-typescript-sort-keys`](https://www.npmjs.com/package/eslint-plugin-typescript-sort-keys)
- [`nodemon`](https://www.npmjs.com/package/nodemon)
- [`prettier`](https://www.npmjs.com/package/prettier)
- [`standard-version`](https://www.npmjs.com/package/standard-version)
- [`ts-loader`](https://www.npmjs.com/package/ts-loader)
- [`ts-node`](https://www.npmjs.com/package/ts-node)
- [`typescript`](https://www.npmjs.com/package/typescript)
- [`webpack`](https://www.npmjs.com/package/webpack)
- [`webpack-cli`](https://www.npmjs.com/package/webpack-cli)
- [`webpack-node-externals`](https://www.npmjs.com/package/webpack-node-externals)

As `dependencies`:

- [`express`](https://expressjs.com/)
- [`http-errors`](https://www.npmjs.com/package/http-errors)
- [`joi`](https://joi.dev/api/?v=17.4.2)
- [`mongoose`](https://mongoosejs.com/)
- [`morgan`](https://www.npmjs.com/package/morgan)
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express)

Feel free to contribute to this project. Every contribution will be appreciated.

## Author

- **Anthony Luzquiños** - _Initial Work_ - _Documentation_ - [AnthonyLzq](https://github.com/AnthonyLzq).
