## Studies
Study objects are central to Mediumroast for GitHub. Studies rely on Interactions and Companies to function.  At this time only the **Foundation study** is implemented; a future update will add support for user defined studies. To enable the Foundation study run `mrcli study --init_foundation`, which will create the basic structures of the study in the repository. Each of the major functions for `mrcli study` are described in this document.

### Notice(s)
- Some of the command line options and switches may not yet be implemented; therefore, if a switch or option is not yet implemented the CLI will inform the user and then exit.
- Study deletion is not yet implemented and not present.
- The only update possible to the Foundation study is to reset its status to cause Caffeine to reprocess the study.
- Populating the Foundation study requires a run of the Mediumroast for GitHub Caffeine Machine Intelligence service.  If you're interested in running the Caffeine Machine Intelligence service please contact the Mediumroast for GitHub team via [Discord](https://discord.gg/ebM4Cf8meK) or email us at [hello@mediumroast.io], (mailto:hello@mediumroast.io).


## Help
Prints the usage for the `study` sub-command and exits.

### Command(s) run
- `mrcli study --help`

### Screenshot with output
<!-- Add screenshot here -->

## List study objects
Print out one or more Studies to the command line or an alternative output mechanism like a CSV file. Filtering can be applied to find Studies with specific attributes.

### List all study objects in a table format
This is the default output when running `mrcli s` or `mrcli study` which prints a text table to STDOUT.

#### Command(s) run
- `mrcli s`
- `mrcli study`

#### Screenshot with output
<!-- Add screenshot here -->

### List all study objects in JSON format
Output a list of study objects in properly formatted JSON to STDOUT which can be viewed, redirected to a file, or piped to another command.

#### Command(s) run
- `mrcli s --output=json`
- `mrcli study --output=json`

#### Screenshot with output
<!-- Add screenshot here -->

### List all study objects and output to a CSV
Study data can be output in a CSV file to enable consumption in common tools like Microsoft Excel. The resulting file will be stored in $HOME/Documents directory as `Mr_Studies.csv`.

#### Command(s) run
- `mrcli s --output=csv`
- `mrcli study --output=csv`

#### Screenshot of commands being run
<!-- Add screenshot here -->

### Screenshot of CSV imported into MacOS numbers
<!-- Add screenshot here -->

### Filter study outputs
The CLI offers the ability to filter outputs by almost any study attribute. This is manifest by two switches on the study sub-command one specific to finding studies by name, `--find_by_name` and the other by an arbitrary attribute, `--find_by_x`. Note all output format options, like JSON, CSV, etc., are available when the outputs are filtered. Finally, only exact matches are supported, meaning if you want to search for a study using any attribute you have to fully provide the attribute's value (i.e., "Med" would not match "Mediumroast Study", but "Mediumroast Study" would).

#### Filter a study by name
To zero in on a specific study using the find by name switch is provided.

#### Command(s) run
- `mrcli s --find_by_name="Foundation"`

#### Screenshot with output
<!-- Add screenshot here -->

#### Filter a study by attribute
Find a specific study by a particular attribute in the example below the switch filters on the attribute `status`.

#### Command(s) run
- `mrcli s --find_by_x='{"status": "0"}'`

#### Screenshot with output
<!-- Add screenshot here -->

## Initialize the Foundation study
Initializes the Foundation study with core attributes and data.  This is the first step in setting up the Foundation study.

### Command(s) run
- `mrcli s --init_foundation`

### Screenshot with output
<!-- Add screenshot here -->

## Report on a study
Produce a report on a study. The report provides the most important insights per company in Microsoft Excel format as of the current release. The report is stored in the `$HOME/Documents` directory as `<study_name>.xlsx`.

### Command(s) run
- `mrcli s --report="Foundation"`

### Screenshot of the report
<!-- Add screenshot here -->

## Reset the status of a study
Reset the status of a study will cause Caffeine to reprocess the study on its next run. This is useful when the study has been updated and needs to be reprocessed.

### Command(s) run
- `mrcli s --reset_by_name="Foundation"`

### Screenshot with output
<!-- Add screenshot here -->
