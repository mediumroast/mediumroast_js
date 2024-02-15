# Companies
Company objects are central to Mediumroast for GitHub. [Interactions](./Interaction.md) and in the future Studies rely on Companies to function. After setup is run, via `mrcli setup`, two companies are present to work with.  Additional companies can be added, updated, or removed; essentially, `company` is an `mrcli` sub-command that affords users Create, Read, Update and Delete capabilities.  Each of the major functions for `mrcli company` are described in this document.

## Notice
Some of the command line options and switches may not yet be implemented; therefore, if a switch or option is not yet implemented the CLI will inform the user and then exit.

# Help
Prints the usage for the `company` sub-command and exits.
## Command(s) run
- `mrcli company --help`
## Screenshot with output
<img width="1266" alt="companies_help" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/6cd07f6f-02ad-4cac-8221-cb7af3307e26">

# List company objects
Print out one or more Companies to the command line or an alternative output mechanism like a CSV file.  Filtering can be applied to find Companies with specific attributes.

## List all company objects in a table format
This is the default output when running `mrcli c` or `mrcli company` which prints a text table to STDOUT.
### Command(s) run
- `mrcli c`
- `mrcli company`
### Screenshot with output
<img width="1266" alt="companies_table" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/af9d22d8-4161-4ae9-9c57-06b65769a54e">

## List all company objects in JSON format
Output list of company objects in properly formatted JSON to STDOUT which can be viewed, redirected to a file, or piped to another command.
### Command(s) run
- `mrcli c --output=json`
- `mrcli company --output=json`
### Screenshot with output
<img width="1178" alt="companies_json" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/22d46cd2-952f-4c3b-8e74-37bdceefee2a">

## List all company objects and output to a CSV


