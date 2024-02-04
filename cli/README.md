# The mediumroast.io CLI (Command Line Interface)
In general we believe that there should be many ways to access your data in the mediumroast.io application, and we know there are many types of users.  Some will want to use a web based graphical user interface (GUI), others may want to use the our RESTful API either directly or through one of our SDKs, and still others may want a CLI.  It is this last one that is included in mediumroast_js to enable users and developers alike to interact with the mediumroast.io application.  This documentation provides a basic explanation, help and several how-tos for our CLI tools.  To start there are two types of CLI tools:
1. Core CLI set for the major mediumroast.io objects which are Interactions, Studies and Companies
2. Administrative CLIs for users, setup, and object backup/restore
Each type is explained in the sections below including the basics and how-tos.
## Administrative CLIs
To enable system management, setup of the environment for the CLIs, and backup/restore of key objects within the mediumroast.io several CLI tools have been created.
### CLI and initial system setup
To help users quickly get on board there is a setup utility that generates a configuration in *HOME/.mediumroast/config.ini*. Users are free to modify or create the file by hand. 
#### Configure the CLI and setup initial users and companies
Command: `mrcli setup`

Example output:

<img width="1216" alt="cli_sept_2023" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/ab5037ad-ce28-4697-89ed-6ae266f33270">


## CLI for mediumroast.io objects
This CLI set to create, read, update, report on and delete mediumroast.io core objects.  The names for each of the CLI tools are listed below.
- [Companies](./Company.md)
- [Interaction](./Interaction.md)
Since all of the CLIs operate similarly, only one tool is documented to guide users in the usage of these tools.


