## Interactions
After running `mrcli setup` you can start adding Interactions. An Interaction can be as simple as an email thread between an account team and a customer, a detailed customer interview or even documentation about a competitor. Additional Interactions can be added, updated, or removed; essentially, `interaction` is an `mrcli` sub-command that affords users Create, Read, Update and Delete capabilities. Each of the major functions for `mrcli interaction` are described in this document.

### Notice(s)
- Some command line options and switches may not yet be implemented; therefore, if a switch or option is not yet implemented the CLI will inform the user and then exit.
- Summarization of Interaction contents and generating proto-requirements plus competitive insights requires a run of the Mediumroast for GitHub Caffeine Machine Intelligence service.  If you're interested in running the Caffeine Machine Intelligence service please contact the Mediumroast for GitHub team via [Discord](https://discord.gg/ebM4Cf8meK) or email us at [hello@mediumroast.io], (mailto:hello@mediumroast.io).

## Help
Prints the usage for the `interaction` sub-command and exits.

### Command(s) run
- `mrcli interaction --help`

### Screenshot with output

<img width="1178" alt="interactions_help" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/d76b1e58-b421-48bd-8860-781444c372ee">

## List interaction objects
Print out one or more Interaction to the command line or an alternative output mechanism like a CSV file.  Filtering can be applied to find Interactions with specific attributes.

### List all interaction objects in a table format
This is the default output when running `mrcli i` or `mrcli interaction` which prints a text table to STDOUT.

#### Command(s) run
- `mrcli i`
- `mrcli interaction`

#### Screenshot with output
<img width="1178" alt="interactions_table" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/d0f19383-1b71-4e51-8199-16f857f89952">



### List all interaction objects in JSON format
Output a list of company objects in properly formatted JSON to STDOUT which can be viewed, redirected to a file, or piped to another command.

#### Command(s) run
- `mrcli i --output=json`
- `mrcli interaction --output=json`

#### Screenshot with output
<img width="1178" alt="interactions_json" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/060656ff-8272-4574-a546-d28b9a351dab">


### List all interaction objects and output to a CSV
Interaction data can be output in CSV files to enable consumption in common tools like Microsoft Excel or Apple Numbers. The resulting files will be stored in $HOME/Documents directory as `Mr_Interactions.csv`.

#### Command(s) run
- `mrcli i --output=csv`
- `mrcli interaction --output=csv`

#### Screenshot of commands being run
<img width="1178" alt="interactions_csv" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/621064e0-33a1-4136-988d-ec4f68c07330">


### Screenshot of CSV imported into MacOS numbers
<img width="1178" alt="interactions_numbers" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/1a484785-7733-4881-ab9e-57532ac686ab">


### Filter interaction outputs
The CLI offers the ability to filter outputs by almost any interaction attribute.  This is manifest by two switches on the interaction sub-command one specific to finding Interactions by name, `--find_by_name` and the other by an arbitrary attribute, `--find_by_x`. Note all output format options, like JSON, CSV, etc., are available when the outputs are filtered. Finally, only exact matches are supported, meaning if you want to search for a interaction using any attribute you have to fully provide the attribute's value (i.e., "The" would not match "The 7 Strategic Phases of the Product Planning Process" , but "The 7 Strategic Phases of the Product Planning Process" would).

#### Filter in a interaction by name
To zero in on a specific interaction using the find by name switch is provided.

#### Command(s) run
- `mrcli i --find_by_name="The 7 Strategic Phases of the Product Planning Process"`

#### Screenshot with output
<img width="1178" alt="interactions_filter_by_name" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/7a5ff39f-23f4-47b8-9432-5483ec874d5a">


#### Filter an interaction by attribute
Find a specific interaction by a particular attribute in the example below the switch filters on the attribute `city`.

#### Command(s) run
- `mrcli i --find_by_x='{"city": "Santa Barbara"}'`

#### Screenshot with output
<img width="1178" alt="interactions_filter_by_x" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/27fa0ac4-45ff-48f0-b600-1c4c2b000dbf">


# Update an interaction attribute
To update an interaction attribute the `--update` switch is provided.  A properly formatted JSON stanza is supplied to the `--update` switch that specifies the name of the interaction to update, the key to update, and finally the value of the key to update.

### Command(s) run
- `mrcli c --update='{"name": "Atlassian Corp", "key": "company_type", "value": "Public"}'`
  
### Screencast with output
**Notice**: Only the markdown version rendered through the GitHub web interface will display the screencast.  If you're viewing these files through the [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/tutorial-Interaction.html) the link below will just show up as text.

https://github.com/mediumroast/mediumroast_js/assets/10818650/e11256e7-28ca-47d5-b131-58a2036671a6

## Delete an interaction
Remove a company and associated interactions if in the repository. There is a confirmation prompt which defaults to yes. Note that the exact company name is needed to proceed with a deletion.

### Command(s) run
- `mrcli i --delete="Atlassian Corp"`

### Screenshot with output
<img width="1178" alt="interactions_delete" src="https://github.com/mediumroast/mediumroast_js/assets/10818650/56036574-0edd-4aaa-a482-a1c03b2d81d4">


## Add an interaction
A command line prompt based wizard steps the user through a semi-automated process process to define an interaction.  The user is asked to verify the steps taken before the interaction(s) is committed to the repository.

### Command(s) run
- `mrcli i --add_wizard`

### Screencast with output
**Notice**: Only the markdown version rendered through the GitHub web interface will display the screencast.  If you're viewing these files through the [GitHub Page Version](https://mediumroast.github.io/mediumroast_js/tutorial-Interaction.html) the link below will just show up as text.

https://github.com/mediumroast/mediumroast_js/assets/10818650/0b28db90-d6ba-4224-a9ae-4c301c2b9614

## Report on an interaction
Produce a MS Word document report on an interaction.  The report includes a dashboard with interaction metadata, interaction abstract, and proto-requirements.  The report is stored in the `$HOME/Documents` directory as `<interaction_name>.docx`.

Optionally, if the `--package` switch is used the report is zipped and stored in the $`HOME/Documents` directory as `<interaction_name>.zip` including the interaction content. 

### Command(s) run
- `mrcli i --report="Atlassian Corp"`
- `mrcli i --report="Atlassian Corp" --package`

### Screenshot of the report dashboard
![Screenshot 2024-09-04 at 8 30 25 PM](https://github.com/user-attachments/assets/19c614a5-ed58-4687-aff8-a619ea693398)







