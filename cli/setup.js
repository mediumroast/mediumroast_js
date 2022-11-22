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
import CLIOutput from '../src/output.js'
import WizardUtils from '../src/cli/commonWizard.js'
import ConfigParser from 'configparser'
import program from 'commander'
import chalk from 'chalk'

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
            // TODO Create choices for the rest_server so the user doesn't have to figure this out
            rest_servers: ["http://cherokee.from-ca.com:16767", "http://cherokee.from-ca.com:26767"],
            user: "rflores", // For now we're not going to prompt for this it is a placeholder
            secret: "password", // For now we're not going to prompt for this it is a placeholder
            api_key: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJmbG9yZXMiLCJjb21wYW55IjoieCIsImlhdCI6MTY1NTAwNDM2NH0.znocDyjS4VSS9tu_ND-pUKw76yNgseUUHYpJ1Tq87do",
            working_dir: "/tmp"
        },
        s3_settings: {
            user: "medium_roast_io",
            api_key: "b7d1ac5ec5c2193a7d6dd61e7a8a76451885da5bd754b2b776632afd413d53e7",
            server: "http://cherokee.from-ca.com:9000",
            region: "leo-dc",
            source: "Unknown"
        },
        document_settings: {
            font_type: "Avenir Next",
            font_size: 10,
            title_font_color: "#41a6ce",
            title_font_size: 14,
            company: "Mediumroast, Inc.",
            copyright: "Copyright 2022, Mediumroast. All rights reserved.",
            output_dir: "Documents"
        }
    }
}

async function _checkServer(server, env) {
    // Generate the credential & construct the API Controllers
    const myAuth = new Auth(
        server,
        env.apiKey,
        env.user,
        env.secret
    )
    const myCredential = myAuth.login()
    const interactionCtl = new Interactions(myCredential)
    const companyCtl = new Companies(myCredential)
    const studyCtl = new Studies(myCredential)
    
    // Check to see if the server is empty
    const myStudies = await studyCtl.getAll()
    const myCompanies = await companyCtl.getAll()
    const myInteractions = await interactionCtl.getAll()
    const [noStudies, noCompanies, noInteractions] = [myStudies.length, myCompanies.length, myInteractions.length]

    // See if the server is empty
    if (noStudies === 0 && noCompanies === 0 && noInteractions === 0) {
        return [true, {status_code: 200, status_msg: 'server is ready for use'}, {restServer: server, apiController: companyCtl}]
    } else {
        return [false, {status_code: 503, status_msg: 'server not ready for use'}, null]
    }

}

async function discoverServers (servers, env) {
    let candidateServers = {}
    const serverPrefix = 'Server-'
    let idx = 1
    
    // Check to see if the servers are available
    for (const myServer in servers) {
        const [success, msg, resource] = await _checkServer(myServer, env)
        if (success) {
            candidateServers[serverPrefix + String(idx)] = resource
            idx += 1
        } else {
            continue
        }
    }

    // Determine if we have any servers and if so return the candidates otherwise return false, etc.
    const availableServers = candidateServers.length
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
const wizard = new WizardUtils('all')
const utils = new Utilities("all")


// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    cliOutput.splashScreen(
        "mediumroast.io CLI Setup Wizard",
        "version 2.0.0",
        "Prompt based setup and registration for the mediumroast.io CLI."
    )
}

// Check for and create the directory process.env.HOME/.mediumroast
const configFile = checkConfigDir()

// Are we going to proceed or not?
const doSetup = await wizard.operationOrNot('You\'d like to setup the mediumroast.io CLI, right?')
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
console.log(chalk.blue.bold('Discovering available mediumroast.io servers.'))
let serverChoice = null
const [serverSuccess, msg, candidateServers] = await discoverServers(myEnv.DEFAULT.rest_servers, env)
const serverOptions = []
for (const candidate in Object.keys(candidateServers)) {
    serverOptions.push({name: candidate})
}
if (serverSuccess) {
    serverChoice = await wizard.doCheckbox (
        'Please pick from one of the following servers.',
        serverOptions
    )
} else {
    console.log(chalk.red.bold('ERROR: No servers are available at the present time, please try again later.'))
    process.exit(-1)
}
myEnv.DEFAULT['rest_server'] = candidateServers[serverChoice].restServer
const companyController = candidateServers[serverChoice].apiController
cliOutput.printLine()

// TODOs
// Create the first "owning company" which is associated to the user by calling the cli wizard for companies
// We should create a bucket in the object store based upon company
// Make user we add the owning_company property to the config file

// Persist and verify the config file
// Write the config file
console.log(chalk.blue.bold('Writing configuration file [' + configFile + '].'))
writeConfigFile(myConfig, configFile)

// Verify the config file
console.log(chalk.blue.bold('Verifying existence and contents of configuration file [' + configFile + '].'))
const success = verifyConfiguration(myConfig, configFile)
success ? 
    console.log(chalk.blue.bold('SUCCESS: Verified configuration file [' + configFile + '].')) :
    console.log(chalk.red.bold('ERROR: Unable to verify configuration file [' + configFile + '].'))
cliOutput.printLine()


