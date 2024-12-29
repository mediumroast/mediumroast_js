## Welcome Mediumroast for GitHub
Products organizations must build evidence based product plans from competitive and customer interactions.  Using Artificial Intelligence and Machine Learning, Mediumroast for GitHub realizes an active product planning repository for Product Managers and Developers everyone can see, use, and reference. The repository is built on GitHub and is accessible via Command Line Interface (CLI) and a Software Development Kit (SDK).  This CLI and SDK are built on Node.js and is available for Linux and MacOS operating systems.

A [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/) of this content is also available, but the screencasts and videos won't display.

## Installation and configuration
Mediumroast for GitHub includes a [GitHub Application](https://github.com/marketplace/mediumroast-for-github), a Command Line Interface, and a Software Development Kit.  The following steps show you how to install the App and the CLI with SDK.

### Preinstallation requirements
1. A GitHub organization
2. Permissions in your GitHub organization to install a GitHub application.
3. Access to a command line terminal on Linux or MacOS.
4. [Node.js installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), ideally globally for all users.
5. [NPM installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), ideally globally for all users.

### Step 1 - Install the GitHub App
Browse to the Mediumroast for GitHub [GitHub Application](https://github.com/marketplace/mediumroast-for-github) and: 

1. Click install,
2. Choose the location for the installation, usually your organization,
3. Confirm the requested permissions, and
4. Browse to your organization's `Settings > Third-Party Access > GitHub Apps` and confirm that Mediumroast for GitHub is installed.

### Step 2 - Install mediumroast_js
This package [mediumroast_js](https://www.npmjs.com/package/mediumroast_js) can be installed and removed via `npm`, several ways to install follow.

#### For Linux and MacOS
Assuming the preinstallation requirements, installation of *node.js* and *npm*, are met please one one of the following.
1. Global installation for all users: `sudo npm i -g mediumroast_js`
2. Local installation for a developer or single user: `npm i mediumroast_js`

#### For WinOS
Coming soon.

### Step 3.1 - Upgrade the CLI
After installation there are times when you may want to upgrade the CLI to the latest version, run the following.

1. Global upgrade for all users: `sudo npm i -g mediumroast_js`
2. Local upgrade for a developer or single user: `npm i mediumroast_js`

### Step 3.2 - Upgrade Actions
After upgrading the CLI it may be necessary to upgrade the actions in the repository.  To do this run `mrcli actions --update` and the actions will be updated to the latest version.

### Step 4.1 - Setup the CLI
Before you can use the Mediumroast for GitHub [CLI](https://github.com/mediumroast/mediumroast_js/blob/main/cli/README.md) the environment must be setup.  With the CLI installed please run `mrcli setup` to start the setup process, note there's a video of the setup process in CLI README.

Running `mrcli setup` creates a repository in your oganization called `<organization_name>_discovery` to contain all interactions and companies, creates two intitial companies, and installs two GitHub Actions to control the number of branches and provide some basic out of the box reporting -- see example screenshot below.

### Step 4.2 - Setup the CLI after initial setup
Running `mrcli setup` a second time on an existing repository will not create a new one, instead it will detect the existing repository and prompt to update your authentication method and report theme. This is used typically when another user in your organization needs to access the repository. 

### Step 5.1 - Verify your installation via the CLI
After the setup process is complete you can verify the installation by running `mrcli company` to see the companies in the repository.

#### Example screenshot of companies table
<img width="1178" alt="companies_table" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/af9d22d8-4161-4ae9-9c57-06b65769a54e">

### Step 5.2 - Verify your installation via GitHub actions
Additionally, two GitHub Actions are installed in the repository, one to clean up branches and the other to generate reports.  To verify the actions are installed browse to the repository and click on the `Actions` tab to see the actions running. These actions are set to run on a schedule, but can be run manually.  When a run you'll find an automatically generated `README.md` file in the repository and links to company reports in the `README.md`, an example screenshot of the repository companies report is below.

#### Example screenshot of in repository companies report
<img width="1001" alt="companies" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/23fbd53f-dbfe-4106-a18d-5d13e0b5ce2b">

## Warning
Since Mediumroast for GitHub creates a regular repository you can interact with it as normal, but **doing so is not recommended**. If you interact with the repository, in regular ways, this could result in Mediumroast for GitHub becoming inoperable.  There are cases where it may become necessary to directly work with the repository, but that should be rare.

## Contributing
If you're interested in contributing to the Mediumroast for GitHub project, please review the [CONTRIBUTING.md](https://github.com/mediumroast/mediumroast_js/blob/.github/CONTRIBUTING.md) file in the `.github` directory of the repository.  The file contains information on how to get started, how to clone the repository, and how to install the SDK for development.

## Issues
If you detect a problem or want to suggest an improvement open an [issue](https://github.com/mediumroast/mediumroast_js/issues) and we will work with you to resolve or respond.

## Support
If you need support or would like to have Mediumroast run the Caffeine Machine Intelligence service on your repository please contact the Mediumroast team via [Discord](https://discord.gg/ebM4Cf8meK) or email us at [hello@mediumroast.io], (mailto:hello@mediumroast.io).

### Release notes
#### Version 0.8.06.02
- Resolved documentation errata for Demo.md
- Updated text for basic reporting workflow and action to show both companies and study reports are running.
- Removed debugging logging statements from basic reporting action.

#### Version 0.8.06.01
- The latest version of the SDK and CLI package now includes an initial implementation of Studies with the Foundation study. 
- The SDK and CLI may run on for Windows OS, but it has not been tested. If you choose to install and run into problems please open an issue and we will work with you to resolve the matter.
- `cli-table` has been replaced by `cli-table3` to ensure that CLI tabular outputs are on a stable and maintained package.
- The `xlsx` package has been removed and replaced with `exceljs` for improved output to Excel files, and due to the security vulnerability in the `xlsx` package.



