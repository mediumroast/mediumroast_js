[Back](./README.md)
---
# Interactions
After adding your first [Company](./Company.md), you can start adding [Interactions](./Interaction.md). An interaction can be as simple as an email thread between an account team and a customer, a detailed customer interview or even competitive documentation about a competitor. 


To add an interaction, you can use `mrcli` with the `interaction` and `--add_wizard` subcommands. Alternatively, you can use the shorthand `mrcli i --add_wizard`. The `mrcli interaction --add_wizard` subcommand will walk you through the process of adding a new customer interaction.

<img width="743" alt="Screenshot 2024-02-21 at 8 19 13 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/f09e4171-bd26-4a98-a012-9164273e3d5a">

During the add wizard, you'll be asked to select which company the interaction belongs to. It's important, that the company is defined before adding the interation.

<img width="690" alt="Screenshot 2024-02-21 at 8 30 46 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/f7762961-8f89-4b46-87ff-443f47d83fa5">

Next, the add wizard will ask you what kind of interation type you are uploading.

<img width="671" alt="Screenshot 2024-02-21 at 8 31 48 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/1019bf84-7898-48a2-aec3-252d5dcb21ee">


<img width="1037" alt="Screenshot 2024-02-21 at 8 33 22 PM" src="https://github.com/mediumroast/mediumroast_js/assets/14003500/5458eac9-59b1-4d6c-8ab1-9cfcfde8ef77">


---
---


 Additional companies can be added, updated, or removed; essentially, `company` is an `mrcli` sub-command that affords users Create, Read, Update and Delete capabilities.  Each of the major functions for `mrcli company` are described in this document.


### Company Command Line Interface (CLI)
Key capabilities of this tool:
- Report on either all company objects or by specific properties like *id*, *name*, *region*, *country*, and so on.
- Pick from one of four report output formats for company objects: *table* default, *json*, *csv*, or *xlsx*.
- Create one or more company objects from a specified json file.
- Delete a company object by specifying the company's id (Note: this is not yet implemented).
- Create a Microsoft DOCX formatted report for a specific company object as specified by the company's *id*.

#### Print usage information to the console
Command: `mr_cli company --help`
##### Example output:
```
Usage: mr_cli company [options]

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
Command: `mr_cli company --output=csv`

Notice: This command saves the file to your environment's *HOME/Documents* directory called *Mr_Companies.csv*.

##### Screenshot of the resulting CSV file in Apple Numbers
*UPDATE ME*
