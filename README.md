## Welcome to Open Source Mediumroast for GitHub.
Products organizations must build robust product plans from competitive and customer interactions everyone can see, use, and reference. Therefore, Mediumroast for GitHub intends to help Products oranizations construct an active interactions repository close to the action of development and issue management in GitHub.

### Notices 
- A new version of the CLI is available and documentation is in progress.  The major focus of this version is to add in Competitive Similarity Analysis, Interaction summarization and Interaction Proto-requirements discovery. 
- You can review the [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/) rather than the repository version of this documentation, but the screencasts of several of the CLI tutorials will not display. 

## Installation and configuration
Mediumroast for GitHub includes a [GitHub Application](https://github.com/apps/mediumroast-for-github), a Command Line Interface, and a Software Development Kit.  The following steps show you how to install the App and the CLI with SDK.

### Preinstallation requirements
1. A GitHub organization
2. Permissions in your GitHub organization to install a GitHub application.
3. Access to a command line terminal on Linux or MacOS.
4. [Node.js installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), ideally globally for all users.
5. [NPM installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-installer-to-install-nodejs-and-npm), ideally globally for all users.

### Step 1 - Install the GitHub App
Browse to the Mediumroast for GitHub [GitHub Application](https://github.com/apps/mediumroast-for-github) and: 

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

### Step 3 - Setup the CLI
Before you can use the Mediumroast for GitHub [CLI](https://github.com/mediumroast/mediumroast_js/blob/main/cli/README.md) the environment must be setup.  With the CLI installed please run `mrcli setup` to start the setup process, note there's a video of the setup process in CLI README.

## What's provided
Running `mrcli setup` creates a repository in your oganization called `<organization_name>_discovery` to contain all interactions and companies, creates two intitial companies, and installs two GitHub Actions to control the number of branches and provide some basic out of the box reporting -- see example screenshot below.

### Warning
Since Mediumroast for GitHub creates a regular repository you can interact with it as normal, but **doing so is not recommended**. If you interact with the repository, in regular ways, this could result in Mediumroast for GitHub becoming inoperable.  There are cases where it may become necessary to directly work with the repository, but that should be rare.

### Example screenshot of in repository companies report
<img width="1001" alt="companies" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/23fbd53f-dbfe-4106-a18d-5d13e0b5ce2b">

## Issues
If you detect a problem or want to suggest an improvement open an [issue](https://github.com/mediumroast/mediumroast_js/issues) and we will work with you to resolve or respond.





