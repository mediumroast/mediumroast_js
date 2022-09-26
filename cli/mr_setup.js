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

// Define the key environmental variables to create the appropriate settings
function getEnv () {
    return {
        DEFAULT: {
            rest_server: "http://cherokee.from-ca.com:46767",
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

// If not suppressed print the splash screen to the console
function splashScreen () {
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

// Check to see if we are going to need to perform a setup operation or not.
async function checkSetup() {
    await inquirer
        .prompt([
            {
                name: "run_setup",
                type: "confirm",
                message: "Hi, would you like setup your CLI environment for the mediumroast.io."
            }
        ])
        // If we don't want to perform the setup then exit
        .then((answer) => {
                if (!answer.run_setup) {
                    console.log('\t-> Ok you don\'t want to setup the CLI, exiting.')
                    process.exit(0)
                }
            }
        )
        // At this point we've decided to proceed
        return true
}

// Prompt user to change any settings or keep the default
async function doSettings(env) {
    let myAnswers = {}
    for (const setting in env) {
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
        // If we don't want to perform the setup then exit
        .then(async (answer) => {
                if (!answer.run) {
                    console.log('\t-> Ok you don\'t want to change the ' +  sectionType + ' settings, exiting.')
                    process.exit(0)
                } else {
                    myAnswers = await doSettings(env[sectionType])
                }
            }
        )
        // At this point we've decided to proceed
        return myAnswers
}


// Define the basic structure of the new object to store to the config file
let myConfig = {
    DEFAULT: null,
    s3_settings: null,
    document_settings: null
}

// Unless we suppress this print out the splash screen.
// TODO add command line switch to suppress
if (true) {
    splashScreen()
}

// Get the key settings to create the configuration file
let myEnv = getEnv()

// Are we going to proceed or not?
const doSetup = await checkSetup()

// Determine if we should setup the defaults, and if so process them
myConfig.DEFAULT = await checkSection(myEnv, 'DEFAULT')

// Determine if we should setup the s3_settings, and if so process them
myConfig.s3_settings = await checkSection(myEnv, 's3_settings')

// Determine if we should setup the s3_settings, and if so process them
myConfig.document_settings = await checkSection(myEnv, 'document_settings')

// Check for and create the directory HOME/.mediumroast
const utils = new Utilities(null)
utils.safeMakedir(process.HOME + '/.mediumroast')
const fileName = 'config.ini'

// TODO establish the config file parser
// TODO write the config file
// TODO if successful print the output to the screen that the file was saved


console.log(myConfig)

