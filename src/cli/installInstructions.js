const installText = `
For this setup to work correctly the Mediumroast GitHub application must be installed at
into your GitHub organization.  Without the installation completed this setup utility won't
work at all.  Please exit this tool until you can confirm the application is installed by
pressing \'Control-C\'.  If you attempt to continue without the application installed this
tool will fail.

You can learn more about and install the GitHub Application by visiting the following URL: https://github.com/apps/mediumroast-for-github

A more detailed product description, help and other related documentation ca be found here: https://www.mediumroast.io/

WARNING: This setup installs two GitHub Actions, and their associated workflows, into the repository that it creates.  These Actions consume GitHub Actions minutes and may incur charges to your GitHub account if you are over the allowed actions for your plan.  Please consider reviewing the GitHub Actions pricing and usage documentation before continuing.
`

export default installText
