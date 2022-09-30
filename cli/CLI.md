# The mediumroast.io CLI (Command Line Interface)
In general we believe that there should be many ways to access your data in the mediumroast.io application, and we know there are many types of users.  Some will want to use a web based graphical user interface (GUI), others may want to use the our RESTful API either directly or through one of our SDKs, and still others may want a CLI.  It is this last one that is included in mediumroast_js to enable users and developers alike to interact with the mediumroast.io application.  This documentation provides a basic explanation, help and several how-tos for our CLI tools.  To start there are two types of CLI tools:
1. Core CLI set for the major mediumroast.io objects which are Interactions, Studies and Companies
2. Administrative CLIs for users, CLI setup and object backup/restore
Each type is explained in the sections below including the basics and how-tos.
## Administrative CLIs
To enable system management, setup of the environment for the CLIs, and backup/restore of key objects within the mediumroast.io several CLI tools have been created.
### CLI environment setup
To help users quickly get on board there is a setup utility that generates a configuration in *HOME/.mediumroast/config.ini*. Users are free to modify or create the file by hand. 
#### Configure your environment to run the CLI
Command: `mr_setup --no_splash`

### Backup and restore
This utility enables a user with permissions to create full backup and perform a full restore of all core mediumroast.io objects. 

#### Usage information
Command: `mr_backup --help`
```
Usage: mr_backup [options]

A mediumroast.io CLI utility to backup and restore objects.

Options:
  -V, --version                               output the version number
  -c --conf_file <file>                       Path to the configuration file (default: "/Users/mihay42/.mediumroast/config.ini")
  --rest_server <server>                      The URL of the target mediumroast.io server (default: "http://cherokee.from-ca.com:46767")
  --api_key <key>                             The API key needed to talk to the mediumroast.io server
  --user <user name>                          Your user name for the mediumroast.io server
  --secret <user secret or password>          Your user secret or password for the mediumroast.io server
  --output_dir <output location>              Select output location to to store the backup (default: "/Users/mihay42/.mediumroast/backups")
  -w --work_dir <working directory location>  Select output location to to store the backup (default: "/Users/mihay42/.mediumroast/tmp")
  --verbose                                   Specify whether or not to print out details of the backup process
  --operation <operation to perform>          Specify which process to perform from: backup or restore (default: "backup")
  --object_type <object type to restore>      Specify which type of object(s) to backup/restore (default: "all")
  --backup_file <backup file name>            Define the backup file to create or restore from, blank means the system will define
  -h, --help                                  display help for command
```

#### Backups
By default the backup files are stored in *HOME/.mediumroast/backups/* in a ZIP format, with a file name automatically generated.

##### Backup with the verbse switch on
Backup command: `mr_backup --operation=backup --verbose`
```
SUCCESS: created file [/Users/mediumroast/.mediumroast/tmp/mr_backup/companies.json] for all companies.
SUCCESS: created file [/Users/mediumroast/.mediumroast/tmp/mr_backup/interactions.json] for all interactions.
SUCCESS: created file [/Users/mediumroast/.mediumroast/tmp/mr_backup/studies.json] for all studies.
SUCCESS: created backup package [/Users/mediumroast/.mediumroast/backups/mr_backup_full_1663471426.zip].
SUCCESS: cleaned up the temporary backup directory [/Users/mediumroast/.mediumroast/tmp/mr_backup/].
```
Resulting backup package with a fully qualified path: `/Users/mediumroast/.mediumroast/backups/mr_backup_full_1663471426.zip`.

#### Restores
The restore operation will prompt you to pick from the set of available backup packages to restore from. The current implementation assumes an empty mediumroast.io backend application without objects. If you attempt to restore to a backend with existing objects the system will exit and not start a restore.

#### Future updates under consideration:
- Enable fine grained restores of objects meaning you can pick from one of the three object types (companies, studies and/or interactions) to restore.
- When the backend implements deletes consider a replacement operation whereby all objects are deleted prior to restore.
- Enable fine grained backups whereby the user can select which object type to backup.

## CLI for mediumroast.io objects
This CLI set to create, read, update, report on and delete mediumroast.io core objects.  The names for each of the CLI tools are listed below.
- Companies: company.js
- Interactions: interaction.js
- Studies: study.js
Since all of the CLIs operate similarly, only one tool is documented to guide users in the usage of these tools.

### Company Command Line Interface (CLI)
Key capabilities of this tool:
- Report on either all company objects or by specific properties like *id*, *name*, *region*, *country*, and so on.
- Pick from one of four report output formats for company objects: *table* default, *json*, *csv*, or *xlsx*.
- Create one or more company objects from a specified json file.
- Delete a company object by specifying the company's id (Note: this is not yet implemented).
- Create a Microsoft DOCX formatted report for a specific company object as specified by the company's *id*.

#### Print usage information to the console
Command: `company --help`
##### Example output:
```
Usage: company [options]

Command line interface for mediumroast.io Company objects.

Options:
  -V, --version                                 output the version number
  -c --conf_file <file>                         Path to the configuration file (default: "/Users/mihay42/.mediumroast/config.ini")
  -r --rest_server <server>                     The URL of the target mediumroast.io server (default: "http://cherokee.from-ca.com:16767")
  -a --api_key <key>                            The API key needed to talk to the mediumroast.io server
  -u --user <user name>                         Your user name for the mediumroast.io server
  -s --secret <user secret or password>         Your user secret or password for the mediumroast.io server
  -o --output <choose the output type to emit>  Select output type: table, json, xls or csv. xls & csv will save to a file. (default: "table")
  --find_by_name <name>                         Find an individual Interaction by name
  --find_by_id <ID>                             Find an individual Interaction by ID
  --find_by_x <JSON>                            Find object by an arbitrary attribute as specified by JSON (ex '{"zip_postal":"92131"}')
  --create <file.json>                          Add objects to the backend by specifying a JSON file
  --update <JSON>                               Update an object from the backend by specifying the object's id and value to update in JSON
  --delete <ID>                                 Delete an object from the backend by specifying the object's id
  --report <ID>                                 Create an MS word document for an object by specifying the object's id
  --package                                     An additional switch used with --report to generate a ZIP package that includes the interaction
  -h, --help                                    display help for command
```

#### List all companies and output in table output
Command: `company`
##### Example output:
```
┌─────┬────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
│ Id  │ Name                                   │ Description                                                                 │
├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 2   │ Federos                                │ Federos is a provider of AI-optimized assurance, analytics, and automation… │
├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 3   │ Intraway                               │ With over 40 million subscribers successfully served in more than 20 count… │
├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 4   │ Incognito                              │ Our productized service orchestration platforms allow cable, fiber, and fi… │
├─────┼────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ 1   │ OpenVault                              │ OpenVault and OpenVault Europe GmbH are market-leading sources of broadban… │
└─────┴────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

#### List a single company by the object id and output in JSON
Command: `company --find_by_id=1 --output=json`
##### Example output:
```
[
  {
    id: 1,
    name: 'OpenVault',
    industry: 'Services | Business Services | Computer Programming, Data Processing, And Other Computer Related Services',
    role: 'Owner',
    url: 'https://openvault.com',
    logo_url: 'http://openvault.com/NEW-SITE-OV3/wp-content/uploads/2021/01/different-blue@3x.png',
    street_address: '111 Town Square Place Suite 1180',
    city: 'Jersey City',
    state_province: 'New Jersey',
    country: 'USA',
    region: 'AMER',
    phone: '+1-201-677-8480',
    icon: 'http://openvault.com/NEW-SITE-OV3/wp-content/uploads/2021/01/different-blue@3x.png',
    description: 'OpenVault and OpenVault Europe GmbH are market-leading sources of broadband technology solutions and data-driven insights into worldwide broadband consumption patterns. The companies’ cloud- based, SaaS solutions and tools help service providers optimize network performance, increase revenue and improve subscriber satisfaction. OpenVault and OpenVault Europe aggregate and analyze the resulting market data to provide unparalleled granular views of consumer usage that can be used to anticipate residential and business broadband trends.',
    cik: 'Unknown',
    linked_interactions: {
      '201004290000-OpenVault Competitive Study-OpenVault': '1',
      '201512030000-OpenVault Competitive Study-OpenVault': '2',
      '201606060000-OpenVault Competitive Study-OpenVault': '3',
      '201607060000-OpenVault Competitive Study-OpenVault': '7',
      '201702030000-OpenVault Competitive Study-OpenVault': '8',
      ...
      '202106240000-OpenVault Competitive Study-OpenVault': '20',
      '202106300000-OpenVault Competitive Study-OpenVault': '35'
    },
    linked_studies: {
      'OpenVault Competitive Study': '03d20485a74f3a5371b379597eee194d57e635ff56d1c1b5a79b85bc87ae2b54'
    },
    stock_symbol: 'Unknown',
    recent10k_url: 'Unknown',
    recent10q_url: 'Unknown',
    zip_postal: '07310',
    latitude: 40.71748000000008,
    longitude: -74.04384999999996,
    topics: {
      'care |': 8.941359041754604,
      'consumption levels': 10.441359041754604,
      'customer care': 20.202859052173412,
      'customer support': 10.253453034755818,
      'data growth': 9.972406038255212,
      'data usage': 11.753453034755818,
      'live streaming': 9.096030365208183,
      'streaming market': 8.941359041754604,
      'traditional pay- tv': 9.479648278867261,
      'video streaming': 11.472406038255212,
      '| open vault': 30.269000062512852
    },
    comparison: { '2': [Object], '3': [Object], '4': [Object] },
    summary: 'Unknown',
    abstract: 'Unknown'
  }
]
```
#### List all companies and output in CSV format
Command: `company --output=csv`

Notice: This command saves the file to your environment's *HOME/Documents* directory called *Mr_Companies.csv*.

##### Screenshot of the resulting CSV file in Apple Numbers
*UPDATE ME*

#### Create a Microsoft Document report for a company
Command: `company --report=1`

Notice: This command saves the file to your environment's *HOME/Documents* directory called *<company_name>.docx*.

##### Screenshot of the resulting docx file in Microsoft Word
*UPDATE ME*

#### Create a report for a company including a Microsoft document and source interactions in a ZIP package
Command: `company --report=1 --package`

Notice: This command saves the file to your environment's *HOME/Documents* directory called *<company_name>.zip*.

##### Screenshot of the resulting zip file in MacOS finder
*UPDATE ME*

