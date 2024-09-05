# Mediumroast for GitHub CLI (Command Line Interface)
The CLI is divided into two sets one for administrative interactions with the system and another for interacting with **Mediumroast for GitHub** objects like Companies and Interactions.  This document covers both the administrative CLI and makes reference to the CLI set for **Mediumroast for GitHub** objects.

# Authentication
**Mediumroast for GitHub** uses either Device Flow or a Personal Access Token for authentication.  The setup CLI will prompt you to choose the type of authentication and then store the necessary information in the `${HOME}/.mediumroast/config.ini` file.  If you need to change the authentication configuration you can run `mrcli setup` to reset the configuration file.

## Required permissions for the Personal Access Token (PAT)
If you create a PAT before the **Mediumroast for GitHub** repository exists the required scope is for **all repositories** in your organization. At PAT renewal or if you want to reduce the scope to only the **Mediumroast for GitHub** repository this can be done later. The Personal Access Token must have the following permissions on all repositories to perform the necessary actions including setup.

- `Actions`: read/write
- `Administration`: read/write
- `Contents`: read/write
- `Metadata`: read
- `Pull requests`: read/write
- `Workflows`: read/write

For background and directions on creating a PAT see the [GitHub documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).


# Administrative CLIs
To enable setup and operational reporting of **Mediumroast for GitHub** several CLIs are available, each is described below.

## Storage reporting
Reports storage consumed by **Mediumroast for GitHub**. A screenshot showing the usage information and outputs for major functions is included below.
### Command(s) run
- `mrcli t`
- `mrcli storage`

### Screenshot with ouput
![Screenshot 2024-09-04 at 8 23 17 PM](https://github.com/user-attachments/assets/dba9738f-e093-4415-9ec7-1031f66cf6d1)

## Actions
Reports actions minutes consumed by **Mediumroast for GitHub** and enables a user to update their repository as new versions of actions are released. A screenshot showing the usage information and outputs for major functions is included below.
### Command(s) run
- `mrcli actions`
- `mrcli a --update`

### Screenshot with ouput
![Screenshot 2024-09-04 at 8 23 55 PM](https://github.com/user-attachments/assets/d9ea51fc-7609-4abb-9cbe-6e010baacb50)


## User reporting
Reports on all users who can access the repository that contains the **Mediumroast for GitHub**. A screenshot showing the usage information and outputs for major functions is included below, and notice, user names and other personally identifiable information has been redacted from the screenshot below.
### Command(s) run
- `mrcli u`
- `mrcli u --my_user`
### Screenshot with ouput 
<img width="1178" alt="users_util" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/994787aa-ec26-4cb0-99a1-b670b9d929ff">

## Setup
To help users quickly get on board with **Mediumroast for GitHub** the setup CLI is used.  This CLI creates the `${HOME}/.mediumroast/config.ini` file, creates the repository including key directories, and creates two initial companies.  A screencast video showing the process for setting up the CLI environment and creating two companies is available below.

### Command(s) run
- `mrcli setup`
### Screencast showing setup process
**Notice**: Only the markdown version rendered through the GitHub web interface will display the screencast.  If you're viewing these files through the [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/tutorial-README.html) the link below will just show up as text.

https://github.com/mediumroast/mediumroast_js/assets/10818650/68c08502-4f59-4981-a001-0d9c9bd1d4d2

# Deprecated commands
The following commands are deprecated, are disabled and will be removed in a future release of the CLI.

## Billing reporting
Is replaced by `storage` and `actions` commands in **Mediumroast for GitHub**. If you run this command it will immediately exit stating it is no longer supported.

### Command(s) run
- `mrcli b`
- `mrcli billing`



---

[[Company Subcommand](https://github.com/mediumroast/mediumroast_js/blob/main/cli/Company.md)] | [[Interaction Subcommand](https://github.com/mediumroast/mediumroast_js/blob/main/cli/Interaction.md)]




