# Mediumroast for GitHub CLI (Command Line Interface)
The CLI is divided into two sets one for administrative interactions with the system and another for interacting with **Mediumroast for GitHub** objects like Companies and Interactions.  This document covers both the administrative CLI and makes reference to the CLI set for **Mediumroast for GitHub** objects.

# Administrative CLIs
To enable setup and operational reporting of **Mediumroast for GitHub** several CLIs are available, each is described below.

## User reporting
Reports on all users who can access the repository that contains the **Mediumroast for GitHub**. A screenshot showing the usage information and outputs for major functions is included below, and notice, user names and other personally identifiable information has been redacted from the screenshot below.
### Commands run
- `mrcli u`
- `mrcli u --my_user`
### Screenshot with ouput 
<img width="1266" alt="users_util" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/994787aa-ec26-4cb0-99a1-b670b9d929ff">

## Billing reporting
Provides reports for consumed actions and repository storage consumed by the organization that has installed and is using **Mediumroast for GitHub**. A screenshot showing the usage information and outputs for major functions is included below.
### Commands run
- `mrcli b`
- `mrcli b --storage`
- `mrcli b --actions`
### Screenshot with ouput    
<img width="1266" alt="billings_util" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/4a715d07-b168-41ce-9054-33bf70af8086">

### Setup
To help users quickly get on board there a setup utility that generates a configuration in *HOME/.mediumroast/config.ini*. Users are free to modify or create the file by hand. 
#### Configure the CLI and setup initial users and companies
Command: `mrcli setup`

Example output:

## CLI for mediumroast.io objects
This CLI set to create, read, update, report on and delete mediumroast.io core objects.  The names for each of the CLI tools are listed below.
- [Companies](./Company.md)
- [Interaction](./Interaction.md)
Since all of the CLIs operate similarly, only one tool is documented to guide users in the usage of these tools.


