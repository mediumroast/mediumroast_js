#!/usr/bin/env node

/**
 * A CLI utility to setup the configuration file to talk to the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_setup.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import { Utilities } from '../src/helpers.js'
import { Auth, Companies, Interactions, Studies } from '../src/api/mrServer.js'
import CLIOutput from '../src/cli/output.js'
import WizardUtils from '../src/cli/commonWizard.js'
import AddCompany from '../src/cli/companyWizard.js'
import s3Utilities from '../src/cli/s3.js'

import program from 'commander'
import chalk from 'chalk'
import ConfigParser from 'configparser'

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

function parseCLIArgs() {
    // Define commandline options
    program
        .name("mr_setup")
        .version('2.0.0')
        .description('A utility for setting up the mediumroast.io CLI.')

    program
        // System command line switches
        .requiredOption(
            '-s --splash <yes | no>',
            'Whether or not to include the splash screen at startup.',
            'yes',
            'no'
        )   

    program.parse(process.argv)
    return program.opts()
}

// Define the key environmental variables to create the appropriate settings
function getEnv () {
    return {
        DEFAULT: {
            // Define the new URLs for the various services
            // mr_server: "https://app.mediumroast.io/api",
            // company_dns: "https://www.mediumroast.io/company_dns",
            // company_logos: "http://cherokee.from-ca.com:3030/allicons.json?url=",
            // echarts: "http://cherokee.from-ca.com:3000",

            rest_servers: ["http://cherokee.from-ca.com:16767", "http://cherokee.from-ca.com:46767"],

            api_key: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJmbG9yZXMiLCJjb21wYW55IjoieCIsImlhdCI6MTY1NTAwNDM2NH0.znocDyjS4VSS9tu_ND-pUKw76yNgseUUHYpJ1Tq87do",
            working_dir: "/tmp",
            company_dns_servers: {
                "http://cherokee.from-ca.com:16767": "http://cherokee.from-ca.com:16868",
                //"http://cherokee.from-ca.com:26767": "http://cherokee.from-ca.com:26868",
                "http://cherokee.from-ca.com:46767": "http://cherokee.from-ca.com:46868"
            },
            theme: "coffee",
            echarts_server: "http://cherokee.from-ca.com:3000"
        },
        s3_settings: {
            user: "medium_roast_io",
            api_key: "b7d1ac5ec5c2193a7d6dd61e7a8a76451885da5bd754b2b776632afd413d53e7",
            server: "http://cherokee.from-ca.com:9000",
            region: "leo-dc",
            source: "Unknown" // TODO this is deprecated remove after testing
        },
        // document_settings: {
        //     font_type: "Avenir Next",
        //     font_size: 10,
        //     title_font_color: "#41a6ce",
        //     title_font_size: 14,
        //     company: "Mediumroast, Inc.",
        //     copyright: "Copyright 2022, Mediumroast. All rights reserved.",
        //     output_dir: "Documents"
        // }
    }
}

// TODO checkServer is now a shared function and can be removed from here
// TODO talk to Raul about what kinds of prechecks should or should not be run. It is possible
//      that _checkServer could be deprecated as is.

async function _checkServer(server, env) {
    // Generate the credential & construct the API Controllers
    const myAuth = new Auth(
        server,
        env.DEFAULT.api_key,
        env.DEFAULT.user,
        env.DEFAULT.secret,
    )
    const myCredential = myAuth.login()
    const interactionCtl = new Interactions(myCredential)
    const companyCtl = new Companies(myCredential)
    const studyCtl = new Studies(myCredential)
    
    // Check to see if the server is empty
    const myStudies = await studyCtl.getAll()
    const myCompanies = await companyCtl.getAll()
    const myInteractions = await interactionCtl.getAll()
    const [noStudies, noCompanies, noInteractions] = [myStudies[2], myCompanies[2], myInteractions[2]]

    // See if the server is empty
    if (noStudies.length === 0 && noCompanies.length === 0 && noInteractions.length === 0) {
        return [true, {status_code: 200, status_msg: 'server is ready for use'}, {restServer: server, apiController: companyCtl, credential: myCredential}]
    } else {
        return [false, {status_code: 503, status_msg: 'server not ready for use'}, null]
    }

}

async function discoverServers (servers, env) {
    let candidateServers = {}
    const serverPrefix = 'mediumroast.io server - '
    let idx = 1
    
    // Check to see if the servers are available
    for (const myServer in servers) {
        const serverResponse = await _checkServer(servers[myServer], env)
        if (serverResponse[0]) {
            candidateServers[serverPrefix + String(idx)] = serverResponse[2]
            idx += 1
        } else {
            continue
        }
    }

    // Determine if we have any servers and if so return the candidates otherwise return false, etc.
    const availableServers = Object.keys(candidateServers).length
    if (availableServers > 0) {
        return [true, {status_code: 200, status_msg: 'one or more servers is available'}, candidateServers]
    } else {
        return [false, {status_code: 503, status_msg: 'no servers are ready please try again'}, null]
    }
}

// Check to see if the directory for the configuration exists, and
// if not create it.  Also return the full path to the configuration
// file.
function checkConfigDir(configDir='/.mediumroast', configFile='config.ini') {
    utils.safeMakedir(process.env.HOME + configDir)
    return process.env.HOME + configDir + '/' + configFile
}

// Save the configuration file
function writeConfigFile(myConfig, configFile) {
    // Write the config file
    const configurator = new ConfigParser()
    for(const section in myConfig){
        configurator.addSection(section)
        for(const setting in myConfig[section]){
            configurator.set(section, setting, myConfig[section][setting])
        }
    }
    // This won't return anything so we'll need to see if we can find another way to determine success/failure
    configurator.write(configFile)
}

// Verify the configuration was written
function verifyConfiguration(myConfig, configFile) {
    const configurator = new ConfigParser()
    // Read in the config file and check to see if things are ok by confirming the rest_server value matches
    configurator.read(configFile)
    const newRestServer = configurator.get('DEFAULT', 'rest_server')
    let success = false
    if(newRestServer === myConfig.DEFAULT.rest_server) { success = true }
    return success
}

// Generate a consistent bucket name with only alphanumeric characters,
// no spaces, and only lowercase text.
function _generateBucketName(companyName) {
    let tmpName = companyName.replace(/[^a-z0-9]/gi,'')
    return tmpName.toLowerCase()
}

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Parse the commandline arguements
const myArgs = parseCLIArgs()

// Get the key settings to create the configuration file
let myEnv = getEnv()

// Construct needed classes
const cliOutput = new CLIOutput(myEnv)
const wizardUtils = new WizardUtils('all')
const utils = new Utilities("all")

// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    cliOutput.splashScreen(
        "mediumroast.io  Setup Wizard",
        "version 2.0.0",
        "CLI prompt based setup and registration for the mediumroast.io application."
    )
}

// Check for and create the directory process.env.HOME/.mediumroast
const configFile = checkConfigDir()

// Are we going to proceed or not?
const doSetup = await wizardUtils.operationOrNot('You\'d like to setup the mediumroast.io CLI, right?')
if (!doSetup) {
    console.log(chalk.red.bold('\t-> Ok exiting CLI setup.'))
    process.exit()
}

// Define the basic structure of the new object to store to the config file
let myConfig = {
    DEFAULT: null,
    s3_settings: null,
    document_settings: null
}

// Check to see which servers are available for use
console.log(chalk.blue.bold('Discovering available mediumroast.io servers...'))
let serverChoice = null
const serverSuccess = await discoverServers(myEnv.DEFAULT.rest_servers, myEnv)
const serverOptions = []

if (serverSuccess[0]) {
    for (const candidate in serverSuccess[2]) {
        serverOptions.push({name: candidate})
    }
    serverChoice = await wizardUtils.doCheckbox (
        'Please pick from one of the following servers.',
        serverOptions
    )
} else {
    console.log(chalk.red.bold('ERROR: No servers are available at the present time, please try again later.'))
    process.exit(-1)
}
myEnv.DEFAULT['rest_server'] = serverSuccess[2][serverChoice].restServer
myEnv.DEFAULT['company_dns_server'] = myEnv.DEFAULT['company_dns_servers'][myEnv.DEFAULT['rest_server']] 
const companyCtl = serverSuccess[2][serverChoice].apiController
const credential = serverSuccess[2][serverChoice].credential
delete myEnv.DEFAULT.rest_servers
delete myEnv.DEFAULT.company_dns_servers
cliOutput.printLine()


// Create the first "owning company" for the initial user
console.log(chalk.blue.bold('Creating owning company...'))
myEnv.splash = false
const cWizard = new AddCompany(
    myEnv,
    companyCtl,
    myEnv.DEFAULT['company_dns_server']
)
const companyResp = await cWizard.wizard(true)
const myCompany = companyResp[1].data
// Create an S3 bucket derived from the company name, and the steps for creating the
// bucket name are in _genereateBucketName().
const bucketName = _generateBucketName(myCompany.name)
const myS3 = new s3Utilities(myEnv.s3_settings)
const s3Resp = await myS3.s3CreateBucket(bucketName)
if(s3Resp) {
    console.log(chalk.blue.bold(`Added interaction storage space for ${myCompany.name}.`))
} else {
    console.log(chalk.blue.red(`Unable to add interaction storage space for ${myCompany.name}.`))
}
cliOutput.printLine()

// Create a default study for interactions to use
console.log(chalk.blue.bold(`Adding default study to the backend...`))
const studyCtl = new Studies(credential)
const myStudy = {
    name: 'Default Study',
    description: 'A placeholder study to ensure that interactions are able to have something to link to',
    public: false,
    groups: 'default:default',
    document: {}
}
const studyResp = await studyCtl.createObj(myStudy)
cliOutput.printLine()


// Persist and verify the config file
// Write the config file
myConfig.DEFAULT = myEnv.DEFAULT
myConfig.s3_settings = myEnv.s3_settings
myConfig.document_settings = myEnv.document_settings
console.log(chalk.blue.bold('Writing configuration file [' + configFile + '].'))
writeConfigFile(myConfig, configFile)

// Verify the config file
console.log(chalk.blue.bold('Verifying existence and contents of configuration file [' + configFile + '].'))
const success = verifyConfiguration(myConfig, configFile)
success ? 
    console.log(chalk.blue.bold('SUCCESS: Verified configuration file [' + configFile + '].')) :
    console.log(chalk.red.bold('ERROR: Unable to verify configuration file [' + configFile + '].'))
cliOutput.printLine()

// List all create objects to the console
console.log(chalk.blue.bold(`Fetching and listing all created objects...`))
console.log(chalk.blue.bold(`Default Study:`))
const myStudies = await studyCtl.getAll()
cliOutput.outputCLI(myStudies[2])
cliOutput.printLine()
console.log(chalk.blue.bold(`Registered Company:`))
const myCompanies = await companyCtl.getAll()
cliOutput.outputCLI(myCompanies[2])
cliOutput.printLine()

// Print out the next steps
console.log(`Now that you\'ve performed the initial registration here\'s what\'s next.`)
console.log(chalk.blue.bold(`\t1. Create and register additional companies with mr_company --add_wizard.`))
console.log(chalk.blue.bold(`\t2. Register and add interactions with mr_interaction --add_wizard.`))
console.log('\nWith additional companies and new interactions registered the mediumroast.io caffeine\nservice will perform basic competitive analysis.')
cliOutput.printLine()



