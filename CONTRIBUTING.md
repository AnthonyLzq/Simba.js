# Contributing to Simba.js

Want to contribute to Simba.s? There are a few thing you need to know.

### Code of Conduct

Simba.js has adopted [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct, and we expect project participants to adhere to it.

### Open Development

All work on Simba.js happens on [GitHub](https://github.com/AnthonyLzq/simba.js). Both core team members and external contributors send pull request which go through the same review process.

### Semantic Versioning

Simba.js follows [semantic versioning](https://semver.org/). We patch versions for bugfixes, minor versions for new features or non-essential changes, and major versions for any breaking changes.

Every significant change is documented in the [changelog file](https://github.com/AnthonyLzq/simba.js/blob/master/CHANGELOG.md).

### Branch organization

Submit all changes to the [develop branch](https://github.com/AnthonyLzq/simba.js/tree/develop). We use separated branch for development and follow [git flow](https://danielkummer.github.io/git-flow-cheatsheet/) to improve as much as possible the code quality.

### Commits Standard

We follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines for every commit we do. With this we can create our CHANGELOG automatically. So every commit **MUST FOLLOW** this standard.

### Bugs

We are using [GitHub issues](https://github.com/AnthonyLzq/simba.js/issues) for our bugs. We keep a close eye on this and try to make sure your problem doesn't already exists.

### Proposing a Change

If you intend to change the public API, or make any non-trivial changes to the implementation we recommend to first check the [road map](https://simbajs.notion.site/simbajs/783092dc7d444067b4c56a25d671f658?v=31060f3d17524ca58870e86c2960a6df), if your proposal is not ready there, then we recommend [filling an issue](https://github.com/AnthonyLzq/simba.js/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away, but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

### Your First Pull Request

Working on your first pull request? You can learn how from this free video series:

[How to contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github)

### Sending a Pull Request

The core team is monitoring for pull request. We will review your pull request and either merge it, request changes to it, or close it with an explanation.

**Before submitting a pull request**, please make sure the following is done:

1. Fork the repository and create your branch from master.

2. Your branch must be called:
   1. In case of a feature: *feature/nameOfYourFeature*
   2. In case of a bug: *hotfix/nameOfTheBug*

3. Run `npm i` in the repository root.

4. If you've fixed a bug or added code that should be tested, add tests!

5. Format your code with [eslint](https://eslint.org/) (`yarn lint`).

6. Finally, your pull request **MUST HAVE** the same name of your branch.
