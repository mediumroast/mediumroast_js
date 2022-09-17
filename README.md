# Node.js Javascript SDK for the mediumroast.io
This is the Node.js Javascript SDK, Software Development Kit, for the mediumroast.io. The SDK is comprised of several things:
1. A wrapper atop the backend's RESTful APIs for Interaction, Study, Company and User objects.
2. A high level written to make it easier to work with the node.js docx package and generated Microsoft Word reports.
3. Core Command Line Interface (CLI) utilities for mediumroast.io companies, studies, interactions and user objects.
4. Helper CLI utilities to setup your mediumroast.io environment and backup objects.
5. Example data to use with the CLIs to add objects to the mediumroast.io.

We actually use this SDK for our own developments, and we do this to ensure that our developers have a first class experience for the mediumroast.io with an always up to date version of the SDK.

# Installation and Configuration Steps via NPM
As soon as the SDK is published on the NPM repository we will update this section with installation steps.

# Installation and Configuration Steps for Developers
The following steps are important if you are developing or extending the Node.js Javascript SDK.  If you're not a developer then the current state of the package is not for you.  Please wait until we exit the alpha for the mediumroast.io. 

## Cloning the repository for Developers
Assuming `git` is installed and your credentials are set up to talk to the mediumroast.io set of repositories it should be possible to do the following as a user on the system:
1. `mkdir ~/dev;cd ~/dev`
2. `git clone git@github.com:mediumroast/mediumroast_js.git`
This will create an `mediumroast_js` directory in `~/dev/` and allow you to proceed to the following steps for installation.

## Installation for Developers, Early Adopters and Testers
For developers the following steps are suggested to perform a local installation.
1. Install [node.js](nodejs.org).
2. Once node.js has been successfully installed you'll need to install the dependencies for the SDK, see the next section on dependencies. 
3. Install the [Local Package Publisher](https://www.npmjs.com/package/local-package-publisher) as per the instructions on the package page.  We recommend that you install the package globally so that you don't have to worry about it being in the right place.  If you choose to install globally you should run `sudo npm install -g local-package-publisher`.
4. Assuming that you've clone the repo into `~/dev` enter the appropriate directory `cd ~/dev/mediumroast_js`.
5. Install the package globally with `sudo local-package-publisher -p`
6. Run `npm link mediumroast_js` in target project to consume the library.

## mediumroast_js SDK dependencies
The following packages need to be installed before the the SDK will operate correct in a development context.  With the npm installation of the mediumroast_js SDK these will automatically be resolved and installed.
- adm-zip
- aws-sdk
- axios
- box-plot
- cli-table
- commander
- configparser
- docx
- json2csv
- node-fetch
- xlsx
You can install all dependencies at once with: `npm i adm-zip, asw-sdk axios box-plot cli-table commander configparser docx json2csv node-fetch xlsx`.

# Command Line Interface (CLI) for the mediumroast.io
Inclued within this SDK is a CLI for users who are more inclined to use that tool for interacting with the system.  These tools will be added and updated to over time as the system evolves.  More information on the CLI is available in the [CLI User's Guide](./cli/CLI.md).

# Issues
If you detect a problem in the code please open an [issue](https://github.com/mediumroast/mediumroast_js/issues) and we will work with you to resolve.





