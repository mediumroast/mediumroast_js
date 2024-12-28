## Introduction
To help users get started with Mediumroast for GitHub, a demo repository has been created in the organization `MegaRoast`. The demo repository is a clone of our repository, but without actions that automatically generate reports and clean up branches. Further, the demo repository is regularly cloned to reflect the latest changes from our main repository on a weekly basis.  So while you can make changes to the demo repository, they will be overwritten on the next clone.  This is to ensure that the demo repository is always in sync with the main repository.

To gain access to the demo repository, please follow the steps in the [main README](https://github.com/mediumroast/mediumroast_js#step-42---setup-the-cli-after-initial-setup) to install the CLI. From there run  `mrcli setup` and when prompted enter the GitHub organization `MegaRoast`.  Because the demo repository is a clone of our repository the setup will not create a new repository, but instead prompt you for your authentication method and report theme.  Once you've completed the setup process you will have access to the demo repository and can begin to explore the capabilities of Mediumroast for GitHub.

However, if you've installed the CLI and run `mrcli setup` you can merely modify your `$HOME/.mediumroast/config.ini` file to point to the `MegaRoast` organization.  This will enable you to access the demo repository without running `mrcli setup` again.

### Example config.ini file
With this configuration file by updating the `org` value to `MegaRoast` you can access the demo repository without running `mrcli setup` again.
```ini
[DEFAULT]
company_dns=https://company-dns.mediumroast.io
company_logos=https://icon-server.mediumroast.io/allicons.json?url=
echarts=https://echart-server.mediumroast.io:11000
nominatim=https://nominatim.openstreetmap.org/search?addressdetails=1&q=
working_directory=working
report_output_dir=Documents
theme=coffee

[GitHub]
clientId=Iv1.f5c0a4eb1f0606f8
appId=650476
authType=deviceFlow
org=<ORGANIZATION>
token=<TOKEN>
```

### Limitations
The following limitations are in place for the demo repository:

1. The demo repository is a clone of the main repository and is updated weekly.
2. The demo repository does not have the actions that automatically generate reports and clean up branches, which means that `mrcli actions` will not work as expected.
3. The demo repository is a shared read-only repository, meaning you can't push changes to it. If you need to test changes, please use your own repository.