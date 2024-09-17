## Contributing to the Mediumroast for GitHub SDK and CLI 
`mediumroast_js` is a Node.js Javascript SDK and CLI for Mediumroast for GitHub.  In roughly includes the following high level features.

1. A wrapper build atop the GitHub API to make it easier to work with the specifics for Mediumroast for GitHub this is included in `src/api` as `authorize.js`, `github.js`, and `gitHubServer.js`.
2. CLI scaffolding for companies, interactions, users, actions, and storage consumption found in `src/cli`.
3. Report scaffolding for companies and interactions found in `src/report`.
4. Implementations of CLIs for companies, interactions, users, actions, and storage consumption found in `cli/`.
5. GitHub Actions and Workflows to provide core reporting and repository cleanliness found in `cli/actions`.

Since we're using this SDK, and the Python version [mediumroast_py](https://github.com/mediumroast/mediumroast_py), to build out the Mediumroast for GitHub project we keep it up to date with the latest features and bug fixes.  If you're interested in contributing to the project please review the following steps to get started.

## Developing for Mediumroast for GitHub
If you're interested in developing for the SDK or please follow the steps below to get started.

### Job jar
We will be adding a job jar for contributors to the project in the near future.  The job jar will contain a list of tasks that need to be completed to move the project forward.  If you're interested in contributing to the project please check back soon for the job jar.

### Cloning the repository
Assuming `git` is installed and your credentials are set up to talk to the mediumroast.io set of repositories it should be possible to do the following as a user on the system:
1. `mkdir ~/dev;cd ~/dev`
2. `git clone git@github.com:mediumroast/mediumroast_js.git`
This will create an `mediumroast_js` directory in `~/dev/` and allow you to proceed to the following steps for installation.

### Setting up a repository for development
To setup a repository for development you should either use the demo repository or create your own repository for your GitHub organization. To create your own repository follow the steps in the [main README](https://github.com/mediumroast/mediumroast_js/README.md) for setting up the GitHub App and the CLI.  Once you have the repository created it will include some basic actions and companies, but no interactions.  Therefore, it is recommended that you create some interactions to test your changes.  If you want to use outputs from the Mediumroast for GitHub caffeine intelligence engine the easiest way at this stage is to use the demo repository.

### Verifying your improvements or changes work
For developers the following steps are suggested to verify the local changes are operable.  It is driven off of the CLIs that are available in the repository in the `cli/`. The steps are as follows:

1. Assuming you've cloned the repository and are in the `mediumroast_js` directory.
2. Run `npm install` to install the necessary dependencies.
3. Enter the `cli/` directory and run the CLI you've made changes to, for example let's assume there are changes made to `cli/mrcli-company.js` you'd run `./mrcli.js company` to test your changes.
4. If you're creating a new CLI please take a look at one of the existing CLIs in the `cli/` directory to see how they are structured and how they interact with the SDK.  A good example is `cli/mrcli-company.js` which manages companies. Since the `.gitignore` file is set to ignore file names like `test.js`, `test.json`, `foo.txt`, etc. you can create these files to test your changes in the `cli/` directory. 

## Developing with Mediumroast for GitHub
Follow the steps needed to install the SDK/CLI which is documented in the [main README](https://github.com/mediumroast/mediumroast_js/README.md).  Once installed the SDK/CLI is available for use, and the documentation for developers is available [here](https://mediumroast.github.io/mediumroast_js/).  Additionally, the CLIs in `cli/` are available as examples of constructing an application with the SDK.

## Issues
If you find a problem in the code, want to suggest an improvement, find errata in the documentation, etc. please open an [issue](https://github.com/mediumroast/mediumroast_js/issues) and we will work with you to resolve.

---

[[Repository README](https://github.com/mediumroast/mediumroast_js/README.md)] | [[Demo site instructions](https://github.com/mediumroast/mediumroast_js/blob/main/cli/Demo.md)]