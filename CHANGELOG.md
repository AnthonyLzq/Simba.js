# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.1.1](https://github.com/AnthonyLzq/simba.js/compare/v2.1.0...v2.1.1) (2022-01-27)


### Features

* removed nargs for questions ([ca80e33](https://github.com/AnthonyLzq/simba.js/commit/ca80e334cbbb01a9936bc9de85dc89514ab05a5c))
* updated dependencies ([5f24742](https://github.com/AnthonyLzq/simba.js/commit/5f2474240a6959727ba0738118955c32885c57cc))
* updated docs ([f4214ec](https://github.com/AnthonyLzq/simba.js/commit/f4214ece47ea959208175a58a6f8190c68d6cc3c))

## [2.1.0](https://github.com/AnthonyLzq/simba.js/compare/v2.0.6...v2.1.0) (2022-01-27)


### Features

* added dotenv ([e29758f](https://github.com/AnthonyLzq/simba.js/commit/e29758f2b4604b0c20aa17a96248315225b95222))
* isolated express folders (preparing simba for fastify support) ([cf38383](https://github.com/AnthonyLzq/simba.js/commit/cf383830edcb3fe7469ef0c7e189f240bd85dfec))
* isolated express packages (preparing simba for fastify support) ([406535b](https://github.com/AnthonyLzq/simba.js/commit/406535b30b25da412873ac5924f486a9ff57ff46))
* replacing express by a generic file name, api (preparing simba for fastify support) ([51cc0d9](https://github.com/AnthonyLzq/simba.js/commit/51cc0d9b10047d23937e21f9d55aeabc38d1bf4f))
* simplifying files names ([782d07c](https://github.com/AnthonyLzq/simba.js/commit/782d07c7baec6ffa4790a2c99fda65fff70964d4))
* some code improvements: modified user model, user endpoints, user dto, user queries and user schemas. Also the example packages where updated ([5ddbd28](https://github.com/AnthonyLzq/simba.js/commit/5ddbd2818235dc479573a064320afa741b8a6c81))

### [2.0.6](https://github.com/AnthonyLzq/simba.js/compare/v2.0.5...v2.0.6) (2022-01-26)


### Features

* added eslint missing dependencies ([d04e86a](https://github.com/AnthonyLzq/simba.js/commit/d04e86a5a5134fc458a0b1e671bfa74dabce1cc2))
* attempt to prevent committing in the lint workflow ([71049d1](https://github.com/AnthonyLzq/simba.js/commit/71049d12efcd4c89726eb29280f691c0ce7417b0))
* implemented lint action ([d9633da](https://github.com/AnthonyLzq/simba.js/commit/d9633da91ba2ee9bcc44a89d9da42f8b944e07f0))
* updated lint workflow ([05798d7](https://github.com/AnthonyLzq/simba.js/commit/05798d7f7dfb8a0ceae7ffb21049e11f079f8d63))

### [2.0.5](https://github.com/AnthonyLzq/simba.js/compare/v2.0.4...v2.0.5) (2021-12-27)


### Features

* added npx for windows compatibility ([a9938a8](https://github.com/AnthonyLzq/simba.js/commit/a9938a8af32c0ae459870c1efcf3e42333ce5082))

### [2.0.4](https://github.com/AnthonyLzq/simba.js/compare/v2.0.3...v2.0.4) (2021-12-26)


### Features

* changed project structure ([9c84b06](https://github.com/AnthonyLzq/simba.js/commit/9c84b06fc748fa1471db4ed6094f92d322930891))
* updated docs ([6aeead7](https://github.com/AnthonyLzq/simba.js/commit/6aeead702b82bd4fc221298073b59f4992bf7867))


### Bug Fixes

* fixed eslint file content ([85d4eb0](https://github.com/AnthonyLzq/simba.js/commit/85d4eb0f98ea0ac5a77bc33b96fa83b3c7fc6cbe))

### [2.0.3](https://github.com/AnthonyLzq/simba.js/compare/v2.0.2...v2.0.3) (2021-12-24)


### Bug Fixes

* support for windows ([ff4b500](https://github.com/AnthonyLzq/simba.js/commit/ff4b500339b12bd5ac717a1be88876a95ed39d03))

### [2.0.2](https://github.com/AnthonyLzq/simba.js/compare/v2.0.1...v2.0.2) (2021-12-24)


### Bug Fixes

* fixed example output ([4a23513](https://github.com/AnthonyLzq/simba.js/commit/4a235134ca1a90077b47786d7958d0ad968dd126))

### [2.0.1](https://github.com/AnthonyLzq/simba.js/compare/v2.0.0...v2.0.1) (2021-12-24)


### Bug Fixes

* fixed docs ([7bd6f8f](https://github.com/AnthonyLzq/simba.js/commit/7bd6f8fb8ba784e614747f76ab7e03dc61736834))

## [2.0.0](https://github.com/AnthonyLzq/simba.js/compare/v1.10.0...v2.0.0) (2021-12-24)


### Features

* added a tsconfig.base.json file to allow users to have a "test", "tests" or "__test__" folder ([30569ab](https://github.com/AnthonyLzq/simba.js/commit/30569abd0b10079a438d03f712ecc094c8e0c7d0))
* configured layered architecture ([5cc9c6d](https://github.com/AnthonyLzq/simba.js/commit/5cc9c6dc9b1b93bd7d92b5881e193f5e8d2eb8da))
* removed custom request and response from global in favor of its own file ([d1ebdcf](https://github.com/AnthonyLzq/simba.js/commit/d1ebdcf04a44811c5433f3450f39ac51e5fd43cd))
* removed IUser interface from models folder in favor of a global interface IUser ([50cbe2e](https://github.com/AnthonyLzq/simba.js/commit/50cbe2e65b071c9bd5d0aad27916d98f68a1e650))
* replaced controllers folder in favor of services folder ([b7428d6](https://github.com/AnthonyLzq/simba.js/commit/b7428d69f22705d645f0b22f3747fca6047bd1ad))
* replaced dto-interfaces in favor of a global interface ([3ff6e47](https://github.com/AnthonyLzq/simba.js/commit/3ff6e47eae306cbc0a38030357f02d44f9379a89))
* replaced models folder in favor of a database folder which can contains multiple database connection ([a1a39ed](https://github.com/AnthonyLzq/simba.js/commit/a1a39ed327623474622da65ce9c06a632232f585))
* udpated exports of index files and changed error code when there is no user to be deleted ([28403d8](https://github.com/AnthonyLzq/simba.js/commit/28403d812eb3a15526e312a860e57a1d0611255f))
* updated docker file ([b795b85](https://github.com/AnthonyLzq/simba.js/commit/b795b85ca3ee1cd0dac8efb39c9778f7670471e8))


### Bug Fixes

* eslint extension ([b953034](https://github.com/AnthonyLzq/simba.js/commit/b953034ff6e77dde155a2adfb28cee78e4b3c2a1))

## [1.10.0](https://github.com/AnthonyLzq/simba.js/compare/v1.9.1...v1.10.0) (2021-12-19)


### Features

* fixed global response initialization and updated dependencies ([acaf8a1](https://github.com/AnthonyLzq/simba.js/commit/acaf8a19ee55649ad5351fdc69ed316363ca792c))
* updated files to include ([eea7609](https://github.com/AnthonyLzq/simba.js/commit/eea7609158b67bd47d96fa86ad36b87ff6f8ed9b))
* updated packages ([46bf266](https://github.com/AnthonyLzq/simba.js/commit/46bf266f8388146c71d8bb75480d4b16ce2f69ed))


### Bug Fixes

* fixed error in deleteAll method ([0e3455d](https://github.com/AnthonyLzq/simba.js/commit/0e3455d3bc027199187b1b5c9a0875843f440449))

### [1.9.1](https://github.com/AnthonyLzq/simba.js/compare/v1.9.0...v1.9.1) (2021-12-14)


### Features

* updated packages in example folder and .eslint rules ([b7bed74](https://github.com/AnthonyLzq/simba.js/commit/b7bed74fcd58f89abdffb7a06f87e4d808059af8))

## [1.9.0](https://github.com/AnthonyLzq/simba.js/compare/v1.8.0...v1.9.0) (2021-12-13)


### Features

* updated packages and example folder to include license and heroku config ([7267e7a](https://github.com/AnthonyLzq/simba.js/commit/7267e7ab40bf7333d566d7e90d85ad4f4357b731))


### Bug Fixes

* linted eslint.js file ([a47ea79](https://github.com/AnthonyLzq/simba.js/commit/a47ea795e2f6cf4363bd82ed05fc2c31b4fa8a26))

## [1.8.0](https://github.com/AnthonyLzq/simba.js/compare/v1.7.0...v1.8.0) (2021-12-13)


### Features

* implemented baseUrl config with ts and webpack to avoid "../../.. ..." ([9b9e9d2](https://github.com/AnthonyLzq/simba.js/commit/9b9e9d20cae8b4bbdaef58364220512514dac1a4))
* updated docker file and ignored git folder to be generated manually by docker ([33c1b0d](https://github.com/AnthonyLzq/simba.js/commit/33c1b0df9cfac4e686ece884aa3102e9ad49e6ab))
* updated docs ([ba72b64](https://github.com/AnthonyLzq/simba.js/commit/ba72b643ea45af7ce7dd7a9adaf8b4f27eacd266))


### Bug Fixes

* fixed eslint ignore ([1405884](https://github.com/AnthonyLzq/simba.js/commit/1405884ab10cf869d6811fbf588ba0b0efb04de2))
* fixed mongo connection ([57f8580](https://github.com/AnthonyLzq/simba.js/commit/57f85803701253be2308b1c45f537db5b59c92d4))

## [1.7.0](https://github.com/AnthonyLzq/simba.js/compare/v1.6.0...v1.7.0) (2021-12-12)


### Features

* updated docs and minor changes ([e6b32ca](https://github.com/AnthonyLzq/simba.js/commit/e6b32ca309603544e3506c9d18717f0e45ef0457))

## [1.6.0](https://github.com/AnthonyLzq/simba.js/compare/v1.5.0...v1.6.0) (2021-12-12)


### Features

* implemented default mongo connection to local database ([1e66e98](https://github.com/AnthonyLzq/simba.js/commit/1e66e982b03eca5c2c3846a10ad827150683da21))

## [1.5.0](https://github.com/AnthonyLzq/simba.js/compare/v1.3.1...v1.5.0) (2021-12-12)


### Features

* moving response function to the global variables and cleaning user route ([52f44aa](https://github.com/AnthonyLzq/simba.js/commit/52f44aadad180816d710b1e03dcc1c809b2be424))
* simplified the code ([dde8f2e](https://github.com/AnthonyLzq/simba.js/commit/dde8f2e27f86f60321af2f12b53546227d0ffe64))

## [1.4.0](https://github.com/AnthonyLzq/simba.js/compare/v1.3.1...v1.4.0) (2021-12-12)


### Features

* simplified the code ([dde8f2e](https://github.com/AnthonyLzq/simba.js/commit/dde8f2e27f86f60321af2f12b53546227d0ffe64))

### [1.3.1](https://github.com/AnthonyLzq/simba.js/compare/v1.3.0...v1.3.1) (2021-12-12)


### Features

* updated docs ([809afaa](https://github.com/AnthonyLzq/simba.js/commit/809afaad2c1c3046fab509842118064ec6a61d5f))

## [1.3.0](https://github.com/AnthonyLzq/simba.js/compare/v1.2.0...v1.3.0) (2021-12-12)


### Features

* implemented eslint rules ([748fb91](https://github.com/AnthonyLzq/simba.js/commit/748fb91a031102855dd7ba08344cc1ec3e181a4f))
* implemented support for global variables (Node.js v16), linted all the code, fixed unlicensed project bug and simplified project structure ([ae4876f](https://github.com/AnthonyLzq/simba.js/commit/ae4876f249ff7dfd16fd4af7e41b3388c7de0f6a))

## [1.2.0](https://github.com/AnthonyLzq/simba.js/compare/v1.1.3...v1.2.0) (2021-10-18)


### Features

* implemented support for project names with more than a word and updated dependencies ([2600413](https://github.com/AnthonyLzq/simba.js/commit/2600413bf7a5ef92e554738066e9bc4aea892f6f))

### [1.1.3](https://github.com/AnthonyLzq/simba.js/compare/v1.1.2...v1.1.3) (2021-10-17)


### Bug Fixes

* fixed bin path ([bf194ff](https://github.com/AnthonyLzq/simba.js/commit/bf194ff21e6aaf63dd1a80c104b8a3567f0887b1))

### [1.1.2](https://github.com/AnthonyLzq/simba.js/compare/v1.1.1...v1.1.2) (2021-10-17)


### Bug Fixes

* updated eslint package (eslint-config-airbnb -> eslint-config-airbnb-base) ([06547bc](https://github.com/AnthonyLzq/simba.js/commit/06547bc618e79f9f6e47e3b0fbd188358befe408))

### [1.1.1](https://github.com/AnthonyLzq/simba.js/compare/v1.0.1...v1.1.1) (2021-10-17)


### Features

* added new eslint package and some new rules ([d79426c](https://github.com/AnthonyLzq/simba.js/commit/d79426c23fc899128d68c8b2e79ed7c5c0e4b18b))

### [1.0.1](https://github.com/AnthonyLzq/simba.js/compare/v1.0.0...v1.0.1) (2021-10-01)


### Bug Fixes

* flag for unlicensed ([6b20a5b](https://github.com/AnthonyLzq/simba.js/commit/6b20a5b8a9ad60e5278b38252849fe5c3b2d54a4))

## 1.0.0 (2021-09-28)


### Features

* first simba.js release ([d10fa01](https://github.com/AnthonyLzq/simba.js/commit/d10fa0199a8bff941da186c33fc16b512295a037))
* updated package name and added standard-version command ([d0d0906](https://github.com/AnthonyLzq/simba.js/commit/d0d09064587a814f97d7a63b865b28a6f05030ad))
