[Back](./README.md)
---
# Interactions
After adding your first [Company](./Company.md), you can start adding [Interactions](./Interaction.md). An interaction can be as simple as an email thread between an account team and a customer, a detailed customer interview or even competitive documentation about a competitor. 


To add an interaction, you can use `mrcli` with the `interaction` and `--add_wizard` subcommands. Alternatively, you can use the shorthand `mrcli i --add_wizard`. The `mrcli interaction --add_wizard` subcommand will walk you through the process of adding a new customer interaction.

<img width="743" alt="Screenshot 2024-02-21 at 8 19 13 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/f09e4171-bd26-4a98-a012-9164273e3d5a">

During the add wizard, you'll be asked to select which company the interaction belongs to. It's important, that the company is defined before adding the interation.

<img width="690" alt="Screenshot 2024-02-21 at 8 30 46 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/f7762961-8f89-4b46-87ff-443f47d83fa5">

Next, the add wizard will ask you what kind of interation type you are uploading. Keep in mind, that the add wizard will look in the `./productplan` directory for any interations. If there are multiple interations, the add wizard will iterate through all the interations in the folder. NOTE: Even though we will specify a URL for the web page in the next step, the mrcli add wizard function will look for a local directory with interation files (text, PDF, etc.)

<img width="671" alt="Screenshot 2024-02-21 at 8 31 48 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/1019bf84-7898-48a2-aec3-252d5dcb21ee">

Finally, because this example was a web page, the add wizard with ask for the publish date and URL.

<img width="1037" alt="Screenshot 2024-02-21 at 8 33 22 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/5458eac9-59b1-4d6c-8ab1-9cfcfde8ef77">


---
---


Additional interactions can be added, updated, or removed; essentially, `interaction` is an `mrcli` sub-command that affords users Create, Read, Update and Delete capabilities.  Each of the major functions for `mrcli interaction` are described in this document.


### Interactions Command Line Interface (CLI)
Key capabilities of this tool:
- Report on either all interaction objects or by specific properties like *id*, *name*, *region*, *country*, and so on.
- Pick from one of four report output formats for interaction objects: *table* default, *json*, *csv*, or *xlsx*.
- Create one or more interaction objects from a specified json file.
- Create a Microsoft DOCX formatted report for a specific interaction object as specified by the interaction's *id*.

#### Print usage information to the console
Command: `mr_cli interaction --help`
##### Example output:
```
Usage: Interactions [options]

Command line interface for mediumroast.io Interactions objects.

Options:
  -V, --version                                 output the version number
  -c --conf_file <file>                         Path to the configuration file (default: "/home/john/.mediumroast/config.ini")
  -o --output <choose the output type to emit>  Select output type: table, json, xls or csv. xls & csv will save to a file. (default: "table")
  -s --splash <yes | no>                        Whether or not to include the splash screen at startup. (default: "yes")
  --find_by_name <name>                         Find an individual a Interactions by name
  --find_by_id <ID>                             Find an individual a Interactions by ID
  --find_by_x <JSON>                            Find a Interactions by an arbitrary attribute as specified by JSON (ex '{"zip_postal":"92131"}')
  --update <JSON>                               Update a Interactions from the backend by specifying the object's name plus attribute and value to update in JSON
  --delete <NAME>                               Delete a Interactions from the backend by specifying the object's id
  --report <NAME>                               Create an MS word document for a Interactions by specifying the object's id
  --package                                     An additional switch used with --report to generate a ZIP package that includes the interaction
  --add_wizard                                  Run the CLI wizard to add a Interactions to the mediumroast.io backend.
  --reset_by_type <OBJECT_TYPE>                 Reset the status of objects to reprocesses them in the caffeine service.
  -h, --help                                    display help for command
```

#### List all interactions and output in table output
Command: `interaction`
##### Example output:
```
┌────────────────────────────────────────────────────────────────────────────────┬───────────────┬──────────┬─────────────────────────┐
│ Name                                                                           │ Creator Name  │ Region   │ Linked Company          │
├────────────────────────────────────────────────────────────────────────────────┼───────────────┼──────────┼─────────────────────────┤
│ The Phases of Product Planning                                                 │ Bob Goldmann  │ AMER     │ Compnay XYZ             │
└────────────────────────────────────────────────────────────────────────────────┴───────────────┴──────────┴─────────────────────────┘
```

#### List a single company by the object id and output in JSON
Command: `interaction --find_by_name='The Phases of Product Planning' --output=json`
##### Example output:
```
[
  {
    "tags": {},
    "topics": {},
    "status": 0,
    "organization": "Mediumroast",
    "content_type": "Unknown",
    "file_size": "Unknown",
    "reading_time": "Unknown",
    "word_count": "Unknown",
    "page_count": "Unknown",
    "description": "Unknown",
    "abstract": "Unknown",
    "creator": "bgoldie",
    "creator_id": 14003500,
    "creator_name": "Bob Goldmann",
    "linked_companies": {
      "ProductPlan": "42aa8e3cf94546f1fa5505b042a8bae69e4ede263c4ce9d76ab1de3bbc4e1e72"
    },
    "linked_studies": {},
    "street_address": "10 E 1st St",
    "zip_postal": "93101",
    "city": "Santa Barbara",
    "state_province": "CA",
    "country": "USA",
    "latitude": 34.414227,
    "longitude": -119.69102,
    "region": "AMER",
    "public": true,
    "groups": "Mediumroast:bgoldie",
    "creation_date": "2024-02-22T04:30:49.737Z",
    "modification_date": "2024-02-22T04:30:49.737Z",
    "file_hash": "494226eb2a631f9549558874544f17e5131c437ed6c99e83bf9339cd15bd8001",
    "name": "The Phases of Product Planning",
    "interaction_type": "Webpage",
    "interaction_type_detail": {
      "author": "Compnay XYZ",
      "year": "2024",
      "month": "02",
      "day": "21",
      "title": "The Phases of Product Planning",
      "url": "read://https_www.companyxyz.com/?url=https%3A%2F%2Fwww.companyxyz.com%2Flearn%2Fstrategic-phases-product-planning-process%2F"
    },
    "url": "Interactions/The Phases of Product Planning.pdf"
  }
]
```
#### List all interactions and output in CSV format
Command: `mrcli interaction --output=csv`

Notice: This command saves the file to your environment's *HOME/Documents* directory called *Mr_Companies.csv*.

<img width="1569" alt="Screenshot 2024-03-03 at 7 02 55 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/979f445e-5bd5-477c-85c1-e48589720cf9">


