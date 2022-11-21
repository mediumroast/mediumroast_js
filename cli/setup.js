#!/usr/bin/env node

/**
 * A CLI utility to setup the configuration file to talk to the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_setup.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import { Utilities } from '../src/helpers.js'
import ConfigParser from 'configparser'
import program from 'commander'
import inquirer from 'inquirer'
import logo from 'asciiart-logo'
import chalk from 'chalk'

function parseCLIArgs() {
    // Define commandline options
    program
        .name("mr_setup")
        .version('1.0.0')
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
            rest_server: ["http://cherokee.from-ca.com:16767", "http://cherokee.from-ca.com:26767"],
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
            source: "openvault"
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

// TODO replace this with the splash screen in the output module
// If not suppressed print the splash screen to the console
function splashScreen (simple=false) {
    const logoConfig = {
        name: "mediumroast.io CLI Setup",
        // font: 'Speed',
        lineChars: 10,
        padding: 3,
        margin: 3,
        borderColor: 'bold-gray',
        logoColor: 'bold-orange',
        textColor: 'orange',
    }
    // Print out the splash screen
    console.log(
        logo(logoConfig)
        .emptyLine()
        .right('version 1.0.0')
        .emptyLine()
        .center(
            "Prompt based setup for mediumroast.io command line interface."
        )
        .render()
    )
}

// TODO Replace with commonWizard functions
// Check to see if we are going to need to perform a setup operation or not.
async function checkSetup(fileName) {
    const utils = new Utilities('setup')
    const [exists, message, result] = utils.checkFilesystemObject(fileName)
    if(exists) {
        await inquirer
            .prompt([
                {
                    name: "run_setup",
                    type: "confirm",
                    message: "Hi, I've detected an existing configuration for mediumroast.io. Should I proceed?"
                }
            ])
            // If we don't want to perform the setup then exit
            .then((answer) => {
                    if (!answer.run_setup) {
                        console.log(chalk.red.bold('\t-> Ok exiting the CLI setup.'))
                        process.exit(0)
                    }
                }
            )
    } else {
        console.log(chalk.blueBright.bold('Starting the configuration process for the mediumroast.io CLI.'))
    }

    // We will always return true, because if the user decides to not proceed checkSetup exits
    return true
}

// TODO replace with commonWizard functions
// Prompt user to change any settings or keep the default
async function doSettings(env, isDefault=false) {
    // TODO if either password or user for now we can suppress and immediately set it
    let myAnswers = {}
    for (const setting in env) {
        // Skip user and secret if this is the DEFAULT section
        // TODO eventually replace this with a proper user and password setting
        if(isDefault && (setting === 'user' || setting === 'secret')) {
            myAnswers[setting] = env[setting]
            continue
        }
        await inquirer
            .prompt([
                {
                    name: setting,
                    type: 'input',
                    message: 'Set ' + setting + '?',
                    default() {
                        return env[setting]
                    }
                }
            ])
            .then(async (answer) => {
                myAnswers[setting] = await answer[setting]
            })
    }
    return myAnswers
}

// Perform environmental variable settings for all sections
async function checkSection(env, sectionType) {
    const line = '-'.repeat(process.stdout.columns)
    console.log(line)
    let myAnswers = {}
    await inquirer
        .prompt([
            {
                name: "run",
                type: "confirm",
                message: "Setup section " +  sectionType + " for the CLI?"
            }
        ])
        // If we don't want to perform the setup then move along and return the defaults
        .then(async (answer) => {
                if (!answer.run) {
                    console.log(
                        chalk.blue.bold(
                            '\t-> Ok you don\'t want to change the ' +  
                            sectionType + ' settings. Populating defaults.'
                        )
                    )
                    myAnswers = env[sectionType]
                } else {
                    sectionType === 'DEFAULT' ? 
                        myAnswers = await doSettings(env[sectionType], true):
                        myAnswers = await doSettings(env[sectionType], false)
                    
                }
            }
        )
        // At this point we've decided to proceed
        return myAnswers
        
}

// Parse the commandline arguements
const myArgs = parseCLIArgs()

// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    splashScreen()
}

// Define the basic structure of the new object to store to the config file
let myConfig = {
    DEFAULT: null,
    s3_settings: null,
    document_settings: null
}

// Get the key settings to create the configuration file
let myEnv = getEnv()

// Check for and create the directory process.env.HOME/.mediumroast
const utils = new Utilities(null)
utils.safeMakedir(process.env.HOME + '/.mediumroast')
const fileName = process.env.HOME + '/.mediumroast/config.ini'

// Are we going to proceed or not?
const doSetup = await checkSetup(fileName)

// Determine if we should setup the defaults, and if so process them
myConfig.DEFAULT = await checkSection(myEnv, 'DEFAULT')

// Determine if we should setup the s3_settings, and if so process them
myConfig.s3_settings = await checkSection(myEnv, 's3_settings')

// Determine if we should setup the s3_settings, and if so process them
myConfig.document_settings = await checkSection(myEnv, 'document_settings')

// TODOs
// Create the first "owning company" which is associated to the user by calling the cli wizard for companies
// We should create a bucket in the object store based upon company
// Make user we add the owning_company property to the config file

// Write the config file
const configurator = new ConfigParser()
for(const section in myConfig){
    configurator.addSection(section)
    for(const setting in myConfig[section]){
        configurator.set(section, setting, myConfig[section][setting])
    }
}
// This won't return anything so we'll need to see if we can find another way to determine success/failure
configurator.write(fileName)

// Read in the config file and check to see if things are ok by confirming the rest_server value matches
configurator.read(fileName)
const newRestServer = configurator.get('DEFAULT', 'rest_server')
let success = false
if(newRestServer === myConfig.DEFAULT.rest_server) { success = true }


const line = '-'.repeat(process.stdout.columns)
    console.log(line)

success ? 
    console.log(chalk.blue.bold('SUCCESS: Verified configuration file [' + fileName + '] was written.')) :
    console.log(chalk.red.bold('ERROR: Unable to verify configuration file [' + fileName + '] was written.'))