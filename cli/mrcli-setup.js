#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to perform initial configuration and setup of Mediumroast for GitHub
 * @license Apache-2.0
 * @version 3.1.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-setup.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import CLIOutput from '../src/cli/output.js'
import WizardUtils from '../src/cli/commonWizard.js'
import AddCompany from '../src/cli/companyWizard.js'

import installText from '../src/cli/installInstructions.js'
import FilesystemOperators from '../src/cli/filesystem.js'

import program from 'commander'
import chalk from 'chalk'
import ConfigParser from 'configparser'
import inquirer from "inquirer"

import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import  { Companies, Users } from '../src/api/gitHubServer.js'
import GitHubFunctions from "../src/api/github.js"
import ora from "ora"

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath, URL } from 'url'

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

function parseCLIArgs(name, version, description) {
    // Define commandline options
    program
        .name(name)
        .version(version)
        .description(description)

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
            company_dns: "https://company-dns.mediumroast.io",
            company_logos: "https://icon-server.mediumroast.io/allicons.json?url=",
            echarts: "https://echart-server.mediumroast.io:11000",
            nominatim: 'https://nominatim.openstreetmap.org/search?addressdetails=1&q=',
            working_directory: "working",
            report_output_dir: "Documents",
            theme: "coffee",
        },
        GitHub: {
            clientId:'Iv1.f5c0a4eb1f0606f8',
            appId: '650476',
        }
    }
}

async function simplePrompt(message) {
    let myObj
    await inquirer
        .prompt([
            {
                name: 'data',
                type: 'input',
                message: message
            }
        ])
        .then(async (answer) => {
            myObj = await answer
        })
    return myObj.data
}

function printNextSteps() {
    // Print out the next steps
    console.log(`Now that you\'ve performed the initial registration here\'s what\'s next.`)
    console.log(chalk.blue.bold(`\t1. Create and register additional companies with \'mrcli company --add_wizard\'.`))
    console.log(chalk.blue.bold(`\t2. Register and add interactions with \'mrcli interaction --add_wizard\'.`))
    cliOutput.printLine()
}

// Create a function that reads all contents from the actions directory and copies them to the GitHub repository
function installActionsToGitHub(fsUtils, gitHubCtl, myConfig, myEnv, actionsDir) {
    // Use the fsUtils to read the contents of the actions directory recursively
    const actionFiles = fsUtils.readDirRecursive(actionsDir)

    // Use readBlobFile to read the contents of each file into an object that mirrors the actions directory
    const actionObjects = []
    actionFiles.forEach((file) => {
        const action = fsUtils.readBlobFile(file)
        if(action[0]) {
            actionObjects.push({
                name: file,
                data: action[2]
            })
        }
    })

    // Copy the contents into the GitHub repository into the .guthub directory which should include both actions and workflows subdirectories
    const actionsPath = '.github/actions'
    const workflowsPath = '.github/workflows'

}

async function confirmGitHubOrg(token, env) {
    // 
    const output = new CLIOutput(env, 'Org')
    // Prompt and confirm user's the GitHub organization
    let gitHubOrgName = await simplePrompt('Please enter your GitHub organization.')
    // URL encode the organization name
    gitHubOrgName = encodeURI(gitHubOrgName)
    
    // Construct the GitHubFunctions object
    let gitHubCtl = new GitHubFunctions(myConfig.token, gitHubOrgName)

    // Set the tryAgain variable initially to false
    let tryAgain = false

    // Obtain the intel based upon the organization the user input
    const gitHubOrg = await gitHubCtl.getGitHubOrg()

    if(!gitHubOrg[0]){
        tryAgain = await wizardUtils.operationOrNot(
            `Unfortunately, no organization matching [${gitHubOrgName}] was found. Maybe you mistyped it, try again?`
        )
        if(tryAgain) {
            gitHubCtl = await confirmGitHubOrg(token)
        } else {
            console.log(chalk.red.bold('\t> Ok, please find the right organization, until then exiting setup.'))
            process.exit()
        }
    }
    // Only print the table if we're not trying again
    if (!tryAgain) {output.outputCLI([gitHubOrg[1]])}

    // Confirm that the organization is correct
    tryAgain = await wizardUtils.operationOrNot(
        `Based on your information this is the organization we found, does it look correct?`
    )
    if(!tryAgain) {
        const tryAgain = await wizardUtils.operationOrNot(
            `Ok this was not the correct organization, try again?`
        )
        if(tryAgain) {
            gitHubCtl = await confirmGitHubOrg(token)
        } else {
            console.log(chalk.red.bold('\t> Ok, please find the right organization, until then exiting setup.'))
            process.exit()
        }
    }
    return new GitHubFunctions(myConfig.token, gitHubOrgName)
}

// Verify the configuration was written
function verifyConfiguration(myConfig, configFile) {
    const configurator = new ConfigParser()
    // Read in the config file and check to see if things are ok by confirming the rest_server value matches
    configurator.read(configFile)
    const clientId = configurator.get('GitHub', 'clientId')
    let success = false
    if(clientId === myConfig.GitHub.clientId) { success = true }
    return success
}

// Use fs to read all the files in the actions directory recursively
function generateActionsManifest(dir, filelist) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)
    dir = dir || path.resolve(path.join(__dirname, './actions') )
    const files = fs.readdirSync(dir)
    filelist = filelist || []
    files.forEach((file) => {
        // Skip .DS_Store files and node_modules directories
        if (file === '.DS_Store' || file === 'node_modules') {
            return
        }
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = generateActionsManifest(path.join(dir, file), filelist) 
        }
        else {
            // Substitute .github for the first part of the path, in the variable dir
            // Log dir to the console including if there are any special characters
            if (dir.includes('./')) {
                dir = dir.replace('./', '')
            }
            // This will be the repository name
            let dotGitHub = dir.replace(/.*(workflows|actions)/, '.github/$1')

            filelist.push({
                fileName: file,
                containerName: dotGitHub,
                srcURL: new URL(path.join(dir, file), import.meta.url)
            })
        }
    })
    return filelist
} 

async function installActions(actionsManifest) {
    // Loop through the actionsManifest and install each action
    await actionsManifest.forEach(async (action) => {
        let status = false
        let blobData
        try {
            // Read in the blob file
            blobData = fs.readFileSync(action.srcURL, 'base64')
            status = true
        } catch (err) {
            return [false, 'Unable to read file [' + action.fileName + '] because: ' + err, null]
        }
        if(status) {
            // Install the action
            const installResp = await gitHubCtl.writeBlob(
                action.containerName, 
                action.fileName, 
                blobData, 
                'main'
            )
        } else {
            return [false, 'Failed to read item [' + action.fileName + ']', null]
        }
    })
    return [true, 'All actions installed', null]
}

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/
// Global variables
const VERSION = '3.1.0'
const NAME = 'setup'
const DESC = 'A CLI utility to perform initial configuration and setup of Mediumroast for GitHub'
const defaultConfigFile = `${process.env.HOME}/.mediumroast/config.ini`

// Construct the file system utility object
const fsUtils = new FilesystemOperators()

// Parse the commandline arguements
const myArgs = parseCLIArgs(NAME, VERSION, DESC)

// Get the key settings to create the configuration file
let myEnv = getEnv()

// Get configuration information from the config file
const environment = new Environmentals(VERSION, NAME, DESC, 'all')

// Define the basic structure of the new object to store to the config file
let myConfig = {
    DEFAULT: null,
    GitHub: null
}

// Assign the env data to the configuration
myConfig.DEFAULT = myEnv.DEFAULT
myConfig.GitHub = myEnv.GitHub

// Construct needed classes
const cliOutput = new CLIOutput(myEnv)
const wizardUtils = new WizardUtils('all')

// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    cliOutput.splashScreen(
        'Mediumroast Setup Wizard',
        `version ${VERSION}`,
        DESC
    )
}

/* ----------------------------------------- */
/* ---- Check if we should start setup ----- */

// Check to see if the config file exists and if it does prompt the user if they want to proceed
const configExists = fsUtils.checkFilesystemObject(defaultConfigFile)
if(configExists[0]) {
    const doSetup = await wizardUtils.operationOrNot(
        `A previous configuration file was detected at [${defaultConfigFile}], are you should you want to continue`
    )
    if (!doSetup) {
        console.log(chalk.red.bold('\t> Exiting CLI setup.'))
        process.exit()
    }
}

// Ask the user ensure that the installation has been performed, if not performed then exit
const installed = await wizardUtils.doInstallInstructions(installText)
cliOutput.printLine()

/* --------- End check start setup --------- */
/* ----------------------------------------- */



/* ----------------------------------------- */
/* ----       Begin authorization       ---- */
// Construct the authorization object
const githubAuth = new GitHubAuth(myConfig, environment, defaultConfigFile, configExists[0])

// If the GitHub section exists in the config file then we can skip the device flow authorization
let accessToken
let authType
if(configExists[0]) {
    const credential = await githubAuth.verifyAccessToken(false)
    if(!credential[0]) {
        console.log(chalk.red.bold(`ERROR: ${credential[1].status_msg}`))
        process.exit(-1)
    }
    accessToken = credential[2].token
    authType = credential[2].authType
    myConfig.GitHub.token = accessToken
    myConfig.GitHub.authType = authType
} else {
    const authTypes = {
        'Personal Access Token': 'pat',
        'Device Flow': 'deviceFlow',
    }
    
    // Using map iterate through the keys of types and create an array of objects where each object looks like {name: key}
    const authArray = Object.keys(authTypes).map((authType) => {
        return { name: authType }
    })
    
    // Use doList in wizardUtils to prompt the user to select a theme
    let authChoice = await wizardUtils.doList(
        'Please select the authorization type used to access GitHub',
        authArray
    )

    // Decode the theme value from the themes object
    myConfig.GitHub.authType = authTypes[authChoice]
    authType = myConfig.GitHub.authType

    // If the user selects pat we will need to prompt for the token
    if(myConfig.GitHub.authType === 'pat') {
        // Prompt the user for the PAT
        myConfig.GitHub.token = await simplePrompt('Please enter your GitHub Personal Access Token.')
        // Set access token to myConfig.GitHub.token
        accessToken = myConfig.GitHub.token
        const isTokenValid = await githubAuth.checkTokenExpiration(accessToken)
        if(!isTokenValid[0]) {
            console.log(chalk.red.bold(`ERROR: Unable to verify the GitHub Personal Access Token with error [${isTokenValid[1].status_msg}].`))
            process.exit(-1)
        }
    } else {
        const credential = await githubAuth.verifyAccessToken(false)
        if(!credential[0]) {
            console.log(chalk.red.bold(`ERROR: ${credential[1].status_msg}`))
            process.exit(-1)
        }
        accessToken = credential[2].token
        myConfig.GitHub.token = accessToken
    }
}
cliOutput.printLine()

/* -----       End authorization       ----- */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* ----- Begin GitHub org confirmation ----- */
// Gather and confirm the GitHub organization
let gitHubCtl = await confirmGitHubOrg(myConfig.GitHub.token, myEnv)

// Capture the GitHub organization name should we need it later
myConfig.GitHub.org = gitHubCtl.orgName
// TODO: Add the GitHub organization Identifier to the config file

cliOutput.printLine()
/* ------ End GitHub org confirmation ------ */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* -------- Check for prev install --------- */
// Set the flags to false to indicate that we have not installed fully or partially
let prevInstall = false
let partialInstall = false
// Construct the controller objects
const companyCtl = new Companies(myConfig.GitHub.token, myConfig.GitHub.org, `mrcli-setup`)
const userCtl = new Users(myConfig.GitHub.token, myConfig.GitHub.org, `mrcli-setup`)
// const studyCtl = new Studies(myConfig.GitHub.token, myConfig.GitHub.org, `mrcli-setup`)

// Check to see if the company and study objects exist
const prevInstallComp = await companyCtl.getAll()
if(prevInstallComp[0]) {
    prevInstall = prevInstallComp[2].mrJson.length > 0 ? true : false
    partialInstall = prevInstallComp[2].mrJson.length === 0 ? true : false
}
/* ------- End check for prev install ------ */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* --------- Begin prompt for theme -------- */
const themes = {
    'Electric coffee': 'coffee',
    'Bright espresso': 'espresso',
    'Double shot latte': 'latte',
}

// Using map iterate through the keys of themes and create an array of objects where each object looks like {name: key}
const themeArray = Object.keys(themes).map((theme) => {
    return { name: theme }
})

// Use doList in wizardUtils to prompt the user to select a theme
const theme = await wizardUtils.doList(
    'Please select a theme for your Mediumroast reports',
    themeArray
)

// Decode the theme value from the themes object
myConfig.DEFAULT.theme = themes[theme]

/* ----------------------------------------- */
/* ----------- Save config file ------------ */
// Confirm that the configuration directory exists only if we don't already have one
// if(!configExists[0]) { 
    const configFile = environment.checkConfigDir()
    process.stdout.write(chalk.bold.blue(`Saving configuration to file [${configFile}] ... `))

    // Write the config file
    const configurator = new ConfigParser()
    environment.writeConfig(configurator, myConfig, configFile)

    // Verify configuration
    const verifyConfig = verifyConfiguration(myConfig, configFile)
    if(verifyConfig) {
        console.log(chalk.bold.green('Ok'))
    } else {
        console.log(chalk.bold.red(`Failed, configuration file written incorrectly.`))
        process.exit(-1)
    }

    cliOutput.printLine()
// }
// Confirm that Document directory exists and if not create it
const docDir = myConfig.DEFAULT.report_output_dir
const reportDirExists = fsUtils.safeMakedir(docDir)
if(!reportDirExists[0]) {
    console.log(chalk.bold.red(`ERROR: Unable to create report directory [${docDir}].`))
}

/* --------- End save config file ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* --------- Inform prev install ----------- */
// If we have a previous installation then we need to exit and let the user know
if(prevInstall) {
    console.log(chalk.bold.yellow(`WARNING: Previous installation detected, skipping initial object creation.`))
    printNextSteps()
    process.exit()
}
/* ------- End inform prev install --------- */
/* ----------------------------------------- */



/* ----------------------------------------- */
/* --------- Create the repository --------- */
if (!partialInstall) {
    process.stdout.write(chalk.bold.blue(`Creating mediumroast app repository for all objects and artifacts ... `))
    gitHubCtl = new GitHubFunctions(myConfig.GitHub.token, myConfig.GitHub.org, NAME)
    const repoResp = await gitHubCtl.createRepository(myConfig.GitHub.token)
    if(repoResp[0]) {
        console.log(chalk.bold.green('Ok'))
    } else {
        console.log(chalk.bold.red(`Failed, exiting with error: [${repoResp[1]}]`))
        process.exit(-1)
    }

    cliOutput.printLine()
    /* --------- End create repository --------- */
    /* ----------------------------------------- */


    /* ----------------------------------------- */
    /* --------- Create the containers --------- */
    process.stdout.write(chalk.bold.blue(`Creating app containers for Study, Company and Interaction artifacts ... `))
    const containerResp = await gitHubCtl.createContainers()
    if(containerResp[0]) {
        console.log(chalk.bold.green('Ok'))
    } else {
        console.log(chalk.bold.red(`Failed, exiting with error: [${containerResp[1]}]`))
        process.exit(-1)
    }
} else {
    console.log(chalk.bold.yellow(`NOTICE: Partial installation detected, skipping container creation and picking up where we left off.`))
}

cliOutput.printLine()
/* --------- End create containers --------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ------------ Install actions ------------ */
process.stdout.write(chalk.bold.blue(`Installing actions and workflows ... `))
const actionsManifest = generateActionsManifest()
const installResp = await installActions(actionsManifest)
if(installResp[0]) {
    console.log(chalk.bold.green('Ok'))
} else {
    console.log(chalk.bold.red(`Failed, exiting with error: [${installResp[1]}]`))
    process.exit(-1)
}
cliOutput.printLine()
/* ---------- End Install actions ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ---- Begin initial objects creation ----- */

// Create the owning company
console.log(chalk.blue.bold('Creating your owning company'))
myConfig.DEFAULT.companyDNS = myConfig.DEFAULT.company_dns
myConfig.DEFAULT.companyLogos = myConfig.DEFAULT.company_logos
myConfig.DEFAULT.echartServer = myConfig.DEFAULT.echarts
myConfig.company = myConfig.GitHub.org
myEnv.splash = false
const cWizard = new AddCompany(
    myConfig,
    {github: gitHubCtl, interaction: null, company: companyCtl, user: userCtl},
    myConfig.DEFAULT.company_dns
)
const owningCompanyResp = await cWizard.wizard(true, false)
let owningCompany = owningCompanyResp[2]

// Create the first company
// Reset company user name to user name set in the company wizard
myConfig.company = 'Unknown'
const firstComp = new AddCompany(
    myConfig,
    {github: gitHubCtl, interaction: null, company: companyCtl, user: userCtl}, 
    myConfig.DEFAULT.company_dns
)
console.log(chalk.blue.bold('Creating the first company ...'))
let firstCompanyResp = await firstComp.wizard(false, false)
const firstCompany = firstCompanyResp[2]

// Save the companies to GitHub
let spinner = ora(chalk.bold.blue('Saving companies to GitHub ... '))
spinner.start() // Start the spinner
    const companyResp = await companyCtl.createObj([owningCompany, firstCompany])
spinner.stop() // Stop the spinner
// If the company creation failed then exit
if(!companyResp[0]) {
    console.log(chalk.red.bold(`FAILED: ${companyResp[1].status_msg}, you may need to clean up the repository.`))
    process.exit(-1)
} 
cliOutput.printLine()

/* ------ End initial objects creation ----- */
/* ----------------------------------------- */

// Companies output
console.log(chalk.blue.bold(`Fetching and listing Owning and first companies:`))
const results = await companyCtl.getAll()
cliOutput.outputCLI(results[2].mrJson)
cliOutput.printLine()
cliOutput.printLine()

// Print out the next steps
printNextSteps()



