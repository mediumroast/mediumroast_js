## Interactions
After running `mrcli setup` you can start adding Interactions. An Interaction can be as simple as an email thread between an account team and a customer, a detailed customer interview or even documentation about a competitor. Additional Interactions can be added, updated, or removed; essentially, interaction is an mrcli sub-command that affords users Create, Read, Update and Delete capabilities. Each of the major functions for mrcli interaction are described in this document.

### Notice
Some of the command line options and switches may not yet be implemented; therefore, if a switch or option is not yet implemented the CLI will inform the user and then exit.

## Help
Prints the usage for the `interaction` sub-command and exits.

### Command(s) run
- `mrcli interaction --help`

### Screenshot with output

<img width="1178" alt="interactions_help" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/20d50b3e-b87a-4996-a7e4-fcc2443e7a45">

## List interaction objects
Print out one or more Interaction to the command line or an alternative output mechanism like a CSV file.  Filtering can be applied to find Interactions with specific attributes.

### List all interaction objects in a table format
This is the default output when running `mrcli i` or `mrcli interaction` which prints a text table to STDOUT.

#### Command(s) run
- `mrcli i`
- `mrcli interaction`

#### Screenshot with output
<img width="1178" alt="companies_table" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/af9d22d8-4161-4ae9-9c57-06b65769a54e">

### List all interaction objects in JSON format
Output a list of company objects in properly formatted JSON to STDOUT which can be viewed, redirected to a file, or piped to another command.

#### Command(s) run
- `mrcli i --output=json`
- `mrcli interaction --output=json`

#### Screenshot with output
<img width="1178" alt="companies_json" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/22d46cd2-952f-4c3b-8e74-37bdceefee2a">

### List all interaction objects and output to a CSV or XLSX
Interaction data can be output in either a CSV or XLSX files to enable consumption in common tools like Microsoft Excel. The resulting files will be stored in $HOME/Documents directory as `Mr_Interactions.csv` or `Mr_Interactions.xlsx` depending on your intended output.

#### Command(s) run
- `mrcli i --output=csv`
- `mrcli i --output=xls`

#### Screenshot of commands being run
<img width="1178" alt="companies_csv" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/f135de7a-aba8-4ed0-9198-64ff50797d4c">

### Screenshot of CSV imported into MacOS numbers
<img width="1178" alt="companies_numbers" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/6ab2266b-bacc-4cb0-9608-db8025866ccb">

### Filter interaction outputs
The CLI offers the ability to filter outputs by almost any interaction attribute.  This is manifest by two switches on the interaction sub-command one specific to finding Interactions by name, `--find_by_name` and the other by an arbitrary attribute, `--find_by_x`. Note all output format options, like JSON, CSV, etc., are available when the outputs are filtered. Finally, only exact matches are supported, meaning if you want to search for a interaction using any attribute you have to fully provide the attribute's value (i.e., "Med" would not match Mediumroast, Inc., but "Mediumroast, Inc. would).

#### Filter in a interaction by name
To zero in on a specific interaction using the find by name switch is provided.

#### Command(s) run
- `mrcli i --find_by_name="Mediumroast, Inc."`

#### Screenshot with output
<img width="1178" alt="companies_filter_by_name" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/4d6d88eb-740f-4d4d-a16b-bea12be54330">

#### Filter an interaction by attribute
Find a specific interaction by a particular attribute in the example below the switch filters on the attribute `company_type`.

#### Command(s) run
- `mrcli i --find_by_x='{"company_type": "Public"}'`

#### Screenshot with output

# HERE






