## Companies
Company objects are central to Mediumroast for GitHub. Interactions and in the future Studies rely on Companies to function. After setup is run, via `mrcli setup`, two companies are present to work with.  Additional Companies can be added, updated, or removed; essentially, `company` is an `mrcli` sub-command that affords users Create, Read, Update and Delete capabilities.  Each of the major functions for `mrcli company` are described in this document.

### Notice(s)
- Some command line options and switches may not yet be implemented; therefore, if a switch or option is not yet implemented the CLI will inform the user and then exit.
- Similarity comparisons of Companies requires a run of the Mediumroast for GitHub Caffeine Machine Intelligence service.  If you're interested in running the Caffeine Machine Intelligence service please contact the Mediumroast for GitHub team via [Discord](https://discord.gg/ebM4Cf8meK) or email us at [hello@mediumroast.io], (mailto:hello@mediumroast.io).

## Help
Prints the usage for the `company` sub-command and exits.

### Command(s) run
- `mrcli company --help`

### Screenshot with output
<img width="1178" alt="companies_help" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/6cd07f6f-02ad-4cac-8221-cb7af3307e26">

## List company objects
Print out one or more Companies to the command line or an alternative output mechanism like a CSV file.  Filtering can be applied to find Companies with specific attributes.

### List all company objects in a table format
This is the default output when running `mrcli c` or `mrcli company` which prints a text table to STDOUT.

#### Command(s) run
- `mrcli c`
- `mrcli company`

#### Screenshot with output
<img width="1178" alt="companies_table" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/af9d22d8-4161-4ae9-9c57-06b65769a54e">

### List all company objects in JSON format
Output a list of company objects in properly formatted JSON to STDOUT which can be viewed, redirected to a file, or piped to another command.

#### Command(s) run
- `mrcli c --output=json`
- `mrcli company --output=json`

#### Screenshot with output
<img width="1178" alt="companies_json" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/22d46cd2-952f-4c3b-8e74-37bdceefee2a">

### List all company objects and output to a CSV
Company data can be output in CSV files to enable consumption in common tools like Microsoft Excel or Apple Numbers. The resulting files will be stored in $HOME/Documents directory as `Mr_Companies.csv`.

#### Command(s) run
- `mrcli c --output=csv`
- `mrcli company --output=csv`

#### Screenshot of commands being run
<img width="1178" alt="companies_csv" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/f135de7a-aba8-4ed0-9198-64ff50797d4c">

### Screenshot of CSV imported into MacOS numbers
<img width="1178" alt="companies_numbers" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/6ab2266b-bacc-4cb0-9608-db8025866ccb">

### Filter company outputs
The CLI offers the ability to filter outputs by almost any company attribute.  This is manifest by two switches on the company sub-command one specific to finding companies by name, `--find_by_name` and the other by an arbitrary attribute, `--find_by_x`. Note all output format options, like JSON, CSV, etc., are available when the outputs are filtered. Finally, only exact matches are supported, meaning if you want to search for a company using any attribute you have to fully provide the attribute's value (i.e., "Med" would not match "Mediumroast, Inc.", but "Mediumroast, Inc." would).

#### Filter in a company by name
To zero in on a specific company using the find by name switch is provided.

#### Command(s) run
- `mrcli c --find_by_name="Mediumroast, Inc."`

#### Screenshot with output
<img width="1178" alt="companies_filter_by_name" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/4d6d88eb-740f-4d4d-a16b-bea12be54330">

#### Filter a company by attribute
Find a specific company by a particular attribute in the example below the switch filters on the attribute `company_type`.

#### Command(s) run
- `mrcli c --find_by_x='{"company_type": "Public"}'`

#### Screenshot with output
<img width="1178" alt="companies_filter_by_x" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/5c3e00d2-5365-40e8-bd91-31025cb821ae">

# Update a company attribute
To update a company attribute the `--update` switch is provided.  A properly formatted JSON stanza is supplied to the `--update` switch that specifies the name of the company to update, the key to update, and finally the value of the key to update.

### Command(s) run
- `mrcli c --update='{"name": "Atlassian Corp", "key": "company_type", "value": "Public"}'`
  
### Screencast with output
**Notice**: Only the markdown version rendered through the GitHub web interface will display the screencast.  If you're viewing these files through the [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/tutorial-Company.html) the link below will just show up as text.

https://github.com/mediumroast/mediumroast_js/assets/10818650/a74cb8cd-f8cb-4a8d-8968-ccf9b875d86b

## Delete a company
Remove a company and associated interactions if in the repository. There is a confirmation prompt which defaults to yes. Note that the exact company name is needed to proceed with a deletion.

### Command(s) run
- `mrcli c --delete="Atlassian Corp"`

### Screenshot with output
<img width="1178" alt="companies_delete" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/85d98dee-ce3b-4d90-9567-9410e58872a3">

## Add a company
A command line prompt based wizard steps the user through either a semi-automated process or a fully-automated process to define a company.  The semi-automated process is typically used for companies that aren't public.  While the fully-automated process is typically used for companies that are public.  In either case the user is asked to verify the steps taken before the company is committed to the repository.

### Command(s) run
- `mrcli c --add_wizard`

### Screenshot with output

<img width="1178" alt="companies_add" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/d948fce2-6c31-4537-983d-9dad4c04c248">

## Report on a company
Produce a MS Word document report on a company.  The report includes a dashboard with a company similarity report, company firmographics, detail on similar companies, and summaries for all interactions associated to the company reported on.  The report is stored in the `$HOME/Documents` directory as `<company_name>.docx`.

Optionally, if the `--package` switch is used the report is zipped and stored in the $HOME/Documents directory as `<company_name>.zip` including all of the interactions associated to the company and the set of most and least similar companies. 

### Command(s) run
- `mrcli c --report="Atlassian Corp"`
- `mrcli c --report="Atlassian Corp" --package`

### Screenshot of the report dashboard

![Screenshot 2024-09-03 at 8 23 29 AM](https://github.com/user-attachments/assets/bd1141cc-53c6-4cac-8e56-ed50601dcbb6)


