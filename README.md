# Node.js Javascript SDK for the mediumroast.io
This is the Node.js Javascript SDK, Software Development Kit, for the mediumroast.io.  We actually use this SDK for our own developments of `web_ui`, `cli` and `text_ui` directly.  We do this to ensure that our developers have a first class experience with the mediumroast.io with an always up to date version of the SDK.

# Installation and Configuration Steps for Developers
The following steps are important if you are developing or extending the Node.js Javascript SDK.  If you're not a developer then the current state of the package is not for you.  Please wait until we exit the alpha for the mediumroast.io. 

## Cloning the repository for Developers
Assuming `git` is installed and your credentials are set up to talk to the mediumroast.io set of repositories it should be possible to do the following as a user on the system:
1. `mkdir ~/dev;cd ~/dev`
2. `git clone git@github.com:mediumroast/mr_sdk.git`
This will create an `mr_sdk` directory in `~/dev/` and allow you to proceed to the following steps for installation.

## Installation for Developers, Early Adopters and Testers
For developers the following steps are suggested to perform a local installation.
1. Install the [Local Package Publisher](https://www.npmjs.com/package/local-package-publisher) as per the instructions on the package page.  We recommend that you install the package globally so that you don't have to worry about it being in the right place.  If you choose to install globally you should run `sudo npm install -g local-package-publisher`.
2. Assuming that you've clone the repo into `~/dev` enter the appropriate directory `cd ~/dev/mr_sdk/javascript`.
3. Install the package globally with `sudo local-package-publisher -p`
4. Run `npm link mediumroast` in target project to consume the library.

## Structure of the repository
The following structure is available for the Node.js Javascript SDK.
```
mr_sdk/
        javascript/
            cli/
                  list_companies.js
                  list_studies.js
                  list_interactions.js
                  list_users.js
            src/
                  helpers.js
                  api/
                        highLevel.js
                        jsonServer.js
            spec/
            README.md
            LICENSE
            package.json
            rollup.config.js
```
# Future Work
As mentioned earlier in the documentation the current state of this package is alpha.  As such we're in pretty heavy development with the high potential for things being broken.  After we graduate from alpha we anticipate the following things to likely occur or be completed.
- Separation of the package out of the `mr_sdk` and into separate `python`, `javascript` and `cli` packages.
- For this Node.js Javascript package it will be published on the `npm` repository.
- For the Python package it will be published on `PyPi` or similar.
- Implementation of a test suite to perform object adds, updates, reads, and deletes to confirm basic operation.
- Implementation of `put`, `patch`, and `delete` operations to perform full object functions.
- Creation of correlating `cli` commands or a `tui` for updates, deletes and adds.
- Swap out the temporary backend for the final `mr_server` backend.

# The CLI, Command Line Interface
The following example CLI wrappers have been built that wrap the sample API implementation and other elements in the SDK.  As appropriate example outputs are also included in the documentation.
## list_companies
```
Usage: list_companies [options]

A CLI for mediumroast.io Company objects, without options: list all Companies.

Options:
  -V, --version            output the version number
  -g --get_guids           List all Companies by Name
  -n --get_names           List all Companies by GUID
  -m --get_map             List all Companies by {Name:GUID}
  --get_by_name <name>     Get an individual Company by name
  --get_by_guid <GUID>     Get an individual Company by GUID
  -s --server <server>     Specify the server URL (default: "http://mr-01:3000")
  -t --server_type <type>  Specify the server type as [json || mr_server] (default: "json")
  -c --config_file <file>  Path to the configuration file (default: "~/.mr_config")
  -h, --help               display help for command
```
### Example output
```
list_companies --get_by_guid=70340e90b851a6f1e4dd725cfa22b533d0e3eecd457a1e23fe51be56d9a75d76
[
  {
    companyName: 'JP Morgan Chase',
    industry: 'Finance, Insurance, And Real Estate | Major Group 60: Depository Institutions | National Commercial Banks',
    role: 'User',
    url: 'Unknown',
    streetAddress: 'Unknown',
    city: 'San Francisco',
    stateProvince: 'California',
    country: 'US',
    region: 'AMER',
    phone: 'Unknown',
    simpleDesc: 'JPMorgan Chase & Co. is an American multinational investment bank and financial services holding company headquartered in New York City.',
    cik: 'Unknown',
    stockSymbol: 'Unknown',
    Recent10kURL: 'Unknown',
    Recent10qURL: 'Unknown',
    zipPostal: 'Unknown',
    linkedStudies: {
      'Caffeine Customer Insights': 'dccd4e2568bfd5733d3ef9f3f8dad09ea0da0e87325ccafeac1abfd0c52c23ff',
      'Customer Insights': 'f3eae874b1fba924e81d5963a2bc7752ab8d2acd906bb2944f6243f163a6bf23'
    },
    linkedInteractions: {
      '202108091407-Caffeine Customer Insights-JP Morgan Chase': '3206b19fa72cde9970ceb3792b1f2ea54afa69c7d80adc74d07fb9f699db860e',
      '202108091407-Customer Insights-JP Morgan Chase': 'd579da261a38581f3e3b5c800d7e956f3f22570cf8a71dfd5e4e45f45a7ea3dd'
    },
    longitude: -122.41963999999996,
    latitude: 37.777120000000025,
    notes: { '1': [Object] },
    GUID: '70340e90b851a6f1e4dd725cfa22b533d0e3eecd457a1e23fe51be56d9a75d76',
    id: '70340e90b851a6f1e4dd725cfa22b533d0e3eecd457a1e23fe51be56d9a75d76',
    totalInteractions: 2,
    totalStudies: 2
  }
]
```
## list_interactions
```
Usage: list_interactions [options]

A CLI for mediumroast.io Interaction objects, without options: list all Interactions.

Options:
  -V, --version            output the version number
  -g --get_guids           List all Interactions by Name
  -n --get_names           List all Interactions by GUID
  -m --get_map             List all Interactions by {Name:GUID}
  --get_by_name <name>     Get an individual Interaction by name
  --get_by_guid <GUID>     Get an individual Interaction by GUID
  -s --server <server>     Specify the server URL (default: "http://mr-01:3000")
  -t --server_type <type>  Specify the server type as [json || mr_server] (default: "json")
  -c --config_file <file>  Path to the configuration file (default: "~/.mr_config")
  -h, --help               display help for command
```
### Example output
```
list_interactions --get_by_guid=729fbd901aaa7114ea46df0b8736fc599d8d7b94f5f9c74375ebd684c4d349cf
[
  {
    interactionName: '202108111451-Customer Insights-Self Employed',
    time: '1451',
    date: '20210811',
    state: 'summarized',
    simpleDesc: 'Learn from Self Employed, either in person or digitally, key points and inputs related to the study Customer Insights',
    contactAddress: 'Unknown',
    contactZipPostal: 'Unknown',
    contactPhone: 'Unknown',
    contactLinkedIn: 'Unknown',
    contactEmail: 'Unknown',
    contactTwitter: 'Unknown',
    contactName: 'Unknown',
    public: false,
    abstract: "Audio le Wow there's some new boys that says. Nice so it is a. It's a one man shop one man. 00:058 Speaker 2 In that era and then following people on Twi er that are interested in this type of game to see what excites them. You're trying to get insights on on you know Twi er or talking to people that may already have the consoles or they may have them haven't used them and maybe they would like to go back to that por on right? Alright so of course I cannot ask you what well this is a good ques on so over me do you feel that your company Is losing or maintaining its as the essence of your product? And I'm being serious about this kind of thing. Uhm a ec vely what I've what I did was decided I wanted to go a er. So I had to build you know I'm doing a pla orm or Mario Castlevania type game so I had to build you know physics and collision detec on and you know all that kind of stu from the ground up. My rst objec ve was to make a. List of all. And and by the me you're done you go back and look at your original your original goal and you're like how did we even get here? Do you ever felt that product management or PM UM were asked to put together a road map without having customer insight? So it's kind of a hard ques on to answer 'cause. No you know you know the three right right? I think for some context I feel like the problem got worse over me. So you you have a plan for when you're going to deliver stu but you probably didn't do. Do we do a great job of saying yeah we know we're going to need to allocate such so much percent of our of our me to. Alright cool this is pre y good evidence.",
    interactionType: 'Interview',
    status: 'Canceled',
    linkedStudies: {
      'Customer Insights': 'f3eae874b1fba924e81d5963a2bc7752ab8d2acd906bb2944f6243f163a6bf23'
    },
    linkedCompanies: {
      'Self Employed': '7c916f300b766bab9c9652f1e83617d0e3488a810b3a9388573905c52f924f84'
    },
    longitude: -80.83795999999995,
    latitude: 35.222860000000026,
    url: 's3://mr-02:9000/mediumroastinc/202108111451-AMER-US-North Carolina-Charlotte-Entertainment-Customer Insights-Self Employed-Interview.pdf',
    thumbnail: 's3://mr-02:9000/mediumroastinc/thumb_202108111451-AMER-US-North Carolina-Charlotte-Entertainment-Customer Insights-Self Employed-Interview.pdf.png',
    notes: { '1': [Object] },
    GUID: '729fbd901aaa7114ea46df0b8736fc599d8d7b94f5f9c74375ebd684c4d349cf',
    id: '729fbd901aaa7114ea46df0b8736fc599d8d7b94f5f9c74375ebd684c4d349cf',
    totalStudies: 1,
    totalCompanies: 1
  }
]
```
## list_studies
```
Usage: list_studies [options]

A CLI for mediumroast.io Study objects, without options: list all Studies.

Options:
  -V, --version            output the version number
  -g --get_guids           List all Studies by Name
  -n --get_names           List all Studies by GUID
  -m --get_map             List all Studies by {Name:GUID}
  --get_substudies         List all Studies and their substudies
  --get_by_name <name>     Get an individual Study by name
  --get_by_guid <GUID>     Get an individual Study by GUID
  -s --server <server>     Specify the server URL (default: "http://mr-01:3000")
  -t --server_type <type>  Specify the server type as [json || mr_server] (default: "json")
  -c --config_file <file>  Path to the configuration file (default: "~/.mr_config")
  -h, --help               display help for command
```
### Example output
```
list_studies --get_by_guid=f3eae874b1fba924e81d5963a2bc7752ab8d2acd906bb2944f6243f163a6bf23
[
  {
    studyName: 'Customer Insights',
    description: 'Work to realize a SaaS intently focused on revealing and solving problems for Customer and\n' +
      'Competitive interactions which can make Customer Success and Product Management disciplines stronger.',
    linkedCompanies: {
      HDS: 'b61e57adaaa834f2a560be1b8d1b62c0ebbfd68cb3d33917185bc1792063a677',
      Aha: '6dbfa33b06706033931b0154210fbcb5fafb995315eccfbd8bc5b12d5e5569f7',
      VMware: 'd9069370a7dc4fff8ef20bf01915df2568bb26dee54c54f209664c089843f0e3',
      Hitachi: '567922c545773872eaab4b5e3466e0a60756d98148849662be330ff336b56659',
      Google: '392dfcd311a276b9aca48dfa52b5985aa5546c3157c3288452bbc00f2af8048a',
      Microsoft: '6ffc56686598cbac08864b9218f43e203b22f258d00ab7dc3e4a1aa29819f982',
      Amazon: 'df6cb4f48281f2612c6ca5e9d89f85a684c39e3aa25ab648ba91db60368dfe8d',
      'Providence Health and Services': 'ca78cf0b874c9139b0316c1803408553202069186297a8bec7bfea862168032b',
      eBay: 'ed128e1b2763deba9a49583d91a1dafd979f2453fed920339fe98e7d30e66aa7',
      'JP Morgan Chase': '70340e90b851a6f1e4dd725cfa22b533d0e3eecd457a1e23fe51be56d9a75d76',
      'Self Employed': '7c916f300b766bab9c9652f1e83617d0e3488a810b3a9388573905c52f924f84'
    },
    totalCompanies: 11,
    linkedInteractions: {
      '201402240930-Customer Insights-HDS': '37c5b453fdc2a4074958c3c41f02c2491f9961eafbcdc30a354b586e379a94f4',
      '201402241004-Customer Insights-HDS': 'e216d44c6b934beebf1cf58a27030233c3e5e9ea8e5fc457c3003f99dc54efe7',
      '201402250831-Customer Insights-HDS': 'bd5b40cb911347abb82bc95c59105e7ea1d3ac48248f0644aa348ab5399bd4d3',
      '201402250915-Customer Insights-HDS': '57bf64ca80c491324e917cbeda55d6fe7494c9c8c9e09033a9648e6d4e1cd640',
      '201402270900-Customer Insights-HDS': 'af98040145afe692ae78b806323289ad5fddb99c5f45d453d8fc5dde2292a8a9',
      '201402271515-Customer Insights-HDS': '0928f03c7b34f90333eacd162fe8ba1dc748639d1cd361613e70de6253222322',
      '201402281310-Customer Insights-HDS': '76d41347eba7ddf45aaa7ccf9e40d204e3b0f643ede6d3fc4d212af8c0ffa7de',
      '201403101041-Customer Insights-HDS': 'c1eaca9b8de83997b81c2143479b78b5b705c878ef3f1610257278691fdf95d4',
      '201403110945-Customer Insights-HDS': '1c992ed623c0ce6ec01470a3438720c39198c0153dcc38be24429a42137dd3be',
      '201403111306-Customer Insights-HDS': '1f15ec408b0857662152566408118b580734684f1e7dca5a6d7a77f84cffb041',
      '201403121034-Customer Insights-HDS': '60d72cc0a3f0837a81edeec80b8673895ab076d52753d4707115d6f81a239883',
      '201403130801-Customer Insights-HDS': '43ac78317d2c402abe0b9afd942e1e742e4029ea3a85679bde2cb740f3c697db',
      '201403140702-Customer Insights-HDS': '1fe08d24f23e303d70f73b438b33556df190ee7c2edb076879f9a15f676ee558',
      '201912151800-Customer Insights-Aha': 'd42ba72ab7317dea495dbef9fd7a4b18e220316689059d5ce87134a68033ed6a',
      '201912151900-Customer Insights-Aha': '2975c26e6ac058eaa6617949e4be59c14ed8da69d49168f2b7e11eedc7ff689c',
      '201912152000-Customer Insights-Aha': '03d225af95bc8d9ae1af795cae25b1f98afd886d3772e7b56b1899642fdbf8fc',
      '201912161800-Customer Insights-Aha': '203719812f4d2b7d986f134c81c7e01ff0b7ec0a454351ac020b3fc23ee7209f',
      '201912161900-Customer Insights-Aha': '9c9703bd9ea5aa58fbec75da5b7a67848a2c69efb34d6b82bdd43f4dca700c1a',
      '201912162000-Customer Insights-Aha': '440a968c8ec519d046a2064e4c1704307499f013eca6fae639cebdc6a1d31080',
      '201912171800-Customer Insights-Aha': 'cf22d4ac4c07fa502fdf507237396cc919b99ca6d5e20ede53fc0c65c3657886',
      '201912171900-Customer Insights-Aha': 'adcdc8c0c4e27ef6617cf61927253473986103662e9b1a0c7e3d0b4c93de41f2',
      '201912172000-Customer Insights-Aha': '02e5fbd561ae1ab679b793644c5bcf50fb26163623e35c2ff1a76f44f1022a46',
      '201912181800-Customer Insights-Aha': '29581d790d073ab20b1d7814f6c777944b601d038a59a5a9553f47eb29aa20c7',
      '201912181900-Customer Insights-Aha': '2599cac8d57cc536b8f46b55f4b90a265af000faf09785aebf37303179dbc61b',
      '201912182000-Customer Insights-Aha': '70cd002264a60361fcea43bfeb5bca9b6cfc05364b377530581a7317cbad69e4',
      '201912191800-Customer Insights-Aha': 'a0ec3c225c1b5a6df8444955c56d458b6920a91df7417a4a8b19babfd223401d',
      '201912191900-Customer Insights-Aha': '167c7dc72ed236c70c165e510de251d635d20116922068e8dc4579d6277e2725',
      '201912192000-Customer Insights-Aha': 'c812a6f111acfb353ba944f3c536334a1c15fb2663c3dd62ca6e0f78208eaf7f',
      '201912201800-Customer Insights-Aha': '02e4f0587d9426d4d9aa26d88eff656b35058c250ee58703ecb88e187bc6ca31',
      '201912201900-Customer Insights-Aha': '7f0b7da04a4919c7bc4a2e676fb916e0cc1465deaeadc9d74008baf28268c74c',
      '201912202000-Customer Insights-Aha': 'fe57ff2b168359e14950b6f46c45a891494b90651adf784096ecd7d4fdd0f003',
      '201912211800-Customer Insights-Aha': 'cdb15ae893120080c7cef65f23c0a7f0ed16942077a6b3af7be1f2c6fc8fe63a',
      '201912211900-Customer Insights-Aha': '60438bac13b7fab03a9d48062b1764ffb627acec94403c0eec79185d6771b448',
      '201912212000-Customer Insights-Aha': '1255026e832da09862cf55623ea0a78d795aa10a12522860e7720c6e3664de16',
      '201912212100-Customer Insights-Aha': 'a1049f53de0929252fd6b655be1da37ae9ed27fe44f2814b5f0f9e102b7cabd3',
      '202107091400-Customer Insights-VMware': 'f99a403173fed358fc7d6937ba3d646412e248fabd6b20280a9099121e0ca121',
      '202107231300-Customer Insights-Hitachi': 'd63337f0967ef5c84953b9ca0b2023cf90da3dcc401baf91fc43687826bd6c99',
      '202107281900-Customer Insights-Google': 'c9a9094844a42394ee61b5e35572701a128815fc01047282e53d315134ce9eac',
      '202107301345-Customer Insights-Microsoft': '13c0455ce917a0ced3047ac93b52b649c0d17ae124eb8a6067142579b178cd2f',
      '202108031722-Customer Insights-Amazon': '1f5252dbab6cdebc669d3c6e306f73c4f0562dbadda7299e795f78d9334ee6a1',
      '202108041019-Customer Insights-Providence Health and Services': '7490db9c62b688cffa865569d6bc5504bbc2dc8ac5ddb5919b21e0a5f65eb15c',
      '202108051509-Customer Insights-eBay': '0aa63c14ca41f7f422f569f5dab55c2674d83d9c43a18013fcbb641130ef1e1b',
      '202108091407-Customer Insights-JP Morgan Chase': 'd579da261a38581f3e3b5c800d7e956f3f22570cf8a71dfd5e4e45f45a7ea3dd',
      '202108111451-Customer Insights-Self Employed': '729fbd901aaa7114ea46df0b8736fc599d8d7b94f5f9c74375ebd684c4d349cf'
    },
    totalInteractions: 44,
    substudies: { '1': [Object], '2': [Object], default: [Object] },
    document: {
      Introduction: 'This Customer Insights study includes two phases separated by 5 years.  The first phase was performed as as a part of a 2014 research project that emphasized A/B testing for a customer study indexing application.\n' +
        'While the second phase, conducted in late 2019, both uncovered new themes and validated key ideas surfaced in the first phase.  In the second phase the emphasis was to investigate a single competitor/partner candidate, Aha!, to\n' +
        'to determine if the key themes, detected within the first phase, had or had not been already addressed.  While details are accounted for in the Opportunities section, the conclusion is that the themes still largely remain unsolved\n' +
        'by companies who build tools for product management, project management, and program management disciplines.  Further, research continues to test both the user experience and refine elements of these\n' +
        'key themes with product managers at companies like Ring Central, Google, Chaos Search, and so on.',
      Opportunity: [Object],
      Action: [Object]
    },
    public: false,
    groups: 'users:studyadmin',
    GUID: 'f3eae874b1fba924e81d5963a2bc7752ab8d2acd906bb2944f6243f163a6bf23',
    id: 'f3eae874b1fba924e81d5963a2bc7752ab8d2acd906bb2944f6243f163a6bf23'
  }
]
```

