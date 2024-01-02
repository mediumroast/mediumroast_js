#!/usr/bin/env node

/**
 * A CLI utility to setup the configuration file to talk to the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_setup.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 3.0.0
 */

// Import required modules
import CLIOutput from '../src/cli/output.js'
import WizardUtils from '../src/cli/commonWizard.js'
import AddCompany from '../src/cli/companyWizard.js'

import demoEulaText from '../src/cli/demoEula.js'
import installText from '../src/cli/installInstructions.js'
import FilesystemOperators from '../src/cli/filesystem.js'

import program from 'commander'
import chalk from 'chalk'
import ConfigParser from 'configparser'
import inquirer from "inquirer"

import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import  { Companies } from '../src/api/gitHubServer.js'
import GitHubFunctions from "../src/api/github.js"
import Table from 'cli-table'
import ora from "ora"

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
            company_dns: "https://www.mediumroast.io/company_dns",
            company_logos: "https://logo-server.mediumroast.io:7000/allicons.json?url=",
            echarts: "https://chart-server.mediumroast.io:11000",
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
    console.log(chalk.blue.bold(`\t1. Create and register additional companies with mrcli company --add_wizard.`))
    console.log(chalk.blue.bold(`\t2. Register and add interactions with mrcli interaction --add_wizard.`))
    console.log('\nWith additional companies and new interactions registered the mediumroast.io caffeine\nservice will perform basic company comparisons.')
    cliOutput.printLine()
}

// NOTE: Commented out until we can confirm it is no longer needed
// function printOrgTable(gitHubOrg) {
//     const table = new Table({
//         head: ['Id', 'Name', 'GitHub Url', 'Description'],
//         // colWidths: [10, 20, 35, 90]
//     })
//     table.push([
//         gitHubOrg.id,
//         gitHubOrg.name,
//         gitHubOrg.html_url,
//         gitHubOrg.description,
//     ])  
//     console.log(table.toString())
// }

async function confirmGitHubOrg(token, env) {
    // 
    const output = new CLIOutput(env, 'Org')
    // Prompt and confirm user's the GitHub organization
    const gitHubOrgName = await simplePrompt('Please enter your GitHub organization.')
    
    // Construct the GitHubFunctions object
    let gitHubCtl = new GitHubFunctions(myConfig.token, gitHubOrgName)

    // Set the tryAgain variable initially to false
    let tryAgain = false

    // Obtain the intel based upon the organization the user input
    const gitHubOrg = await gitHubCtl.getGitHubOrg()
    if(!gitHubOrg[0]){
        const tryAgain = await wizardUtils.operationOrNot(
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
    if (!tryAgain) {cliOutput.outputCLI([gitHubOrg[1]])}

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

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/
// Global variables
const VERSION = '3.0.0'
const NAME = 'setup'
const DESC = 'Set up the Mediumroast application.'
const defaultConfigFile = `${process.env.HOME}/.mediumroast/config.ini`

// Construct the file system utility object
const fsUtils = new FilesystemOperators()

// Construct the authorization object
const githubAuth = new GitHubAuth()

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

// Ask the user to accept the EULA, if they do not the function will exit
const acceptEula = await wizardUtils.doEula(demoEulaText)
myConfig.DEFAULT.accepted_eula = acceptEula // Keep the acceptance visible 
cliOutput.printLine()

/* --------- End check start setup --------- */
/* ----------------------------------------- */



/* ----------------------------------------- */
/* ---- Begin device flow authorization ---- */

// If the GitHub section exists in the config file then we can skip the device flow authorization
let accessToken
if(configExists[0]) {
    accessToken = await environment.verifyAccessToken(true)
    myConfig.GitHub.token = accessToken.token
    myConfig.GitHub.expiresAt = accessToken.expiry
    myConfig.GitHub.deviceCode = accessToken.device
} else {
    // Obtain the access token
    accessToken = await githubAuth.getAccessToken(myConfig.GitHub)
    // Pull in only necessary settings from the access token
    myConfig.GitHub.token = accessToken.token
    myConfig.GitHub.expiresAt = accessToken.expiresAt
    myConfig.GitHub.deviceCode = accessToken.deviceCode
    cliOutput.printLine()
}

/* ----- End device flow authorization ----- */
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
// Set the flag to false initially to indicate that we have not installed
let prevInstall = false
// Construct the controller objects
const companyCtl = new Companies(myConfig.GitHub.token, myConfig.GitHub.org, `mrcli-setup`)
// const studyCtl = new Studies(myConfig.GitHub.token, myConfig.GitHub.org, `mrcli-setup`)

// Check to see if the company and study objects exist
const prevInstallComp = await companyCtl.getAll()
if(prevInstallComp[0]) {
    prevInstall = prevInstallComp[2].mrJson.length > 0 ? true : false
}
/* ------- End check for prev install ------ */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* ----------- Save config file ------------ */
// Confirm that the configuration directory exists only if we don't already have one
if(!configExists[0]) { 
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
}
// Confirm that Document directory exists and if not create it
const docDir = myConfig.DEFAULT.report_output_dir
const reportDirExists = fsUtils.safeMakedir(docDir)
if(reportDirExists[0]) {
    console.log(chalk.bold.yellow(`WARNING: Report output directory [${docDir}] not detected, created.`))
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

cliOutput.printLine()
/* --------- End create containers --------- */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* ---- Begin initial objects creation ----- */

// Create needed objects
let companies = []
// let studies = []

// Create the owning company
console.log(chalk.blue.bold('Creating your owning company'))
myConfig.DEFAULT.company = myConfig.GitHub.org
myEnv.splash = false
const cWizard = new AddCompany(
    myConfig,
    companyCtl,
    myConfig.DEFAULT.company_dns
)
const owningCompanyResp = await cWizard.wizard(true, false)
let owningCompany = owningCompanyResp[2]

// Create the first company
// Reset company user name to user name set in the company wizard
myConfig.DEFAULT.company = 'Unknown'
const firstComp = new AddCompany(
    myConfig,
    companyCtl, // NOTE: Company creation is commented out
    myConfig.DEFAULT.company_dns
)
console.log(chalk.blue.bold('Creating the first company ...'))
let firstCompanyResp = await firstComp.wizard(false, false)
const firstCompany = firstCompanyResp[2]

// NOTE: For the first release studies aren't needed, therefore we're commenting out anything related to them
// const linkedCompanies = companyCtl.linkObj([owningCompany, firstCompany])

// Create a default study for good housekeeping
process.stdout.write(chalk.blue.bold(`Creating default study ... `))
let myStudy = {
    name: 'Default Study',
    description: 'A placeholder study to ensure that interactions are able to have something to link to',
    public: false,
    groups: 'default:default',
    document: {},
    linked_companies: linkedCompanies,
    linked_interactions: {}
}
console.log(chalk.bold.green('Ok'))

// NOTE: Since studies aren't needed in the alpha_2 series of releases we will comment things out related to them.
//       Additionally, in alpha_3 we'll determine if we need to create a default study or not.  So leaving this
//       code in place for now.
// Obtain the link object for studies
// const linkedStudies = studyCtl.linkObj([myStudy])
// const linkedStudies = {}

// Link the study to the companies
// owningCompany.linked_studies = linkedStudies
// firstCompany.linked_studies = linkedStudies
// companies = [owningCompany, firstCompany]

// Set up the spinner
let spinner

// Save the companies to GitHub
spinner = ora(chalk.bold.blue('Saving companies to GitHub ... '))
spinner.start() // Start the spinner
    const companyResp = await companyCtl.createObj(companies)
spinner.stop() // Stop the spinner
// If the company creation failed then exit
if(!companyResp[0]) {
    console.log(chalk.red.bold(`Failed to create companies, exiting with: [${companyResp[1]}], you may need to clean up the repo.`))
    process.exit(-1)
} else {
    console.log(chalk.bold.green('\tCompanies saved to GitHub.'))
}

// Save the default study to GitHub
// spinner = ora(chalk.bold.blue('Saving study to GitHub ... '))
// spinner.start() // Start the spinner
//     const studyResp = await studyCtl.createObj([myStudy])
// spinner.stop() // Stop the spinner
// // If the study creation failed then exit
// if(!studyResp[0]) {
//     console.log(chalk.red.bold(`Failed to create study, exiting with: [${studyResp[1]}], you may need to clean up the repo.`))
//     process.exit(-1)
// } else {
//     console.log(chalk.bold.green('\tDefault study saved to GitHub.'))
// }

cliOutput.printLine()
/* ------ End initial objects creation ----- */
/* ----------------------------------------- */

// List all created objects to the console
let results

// Studies output
console.log(chalk.blue.bold(`Fetching and listing all created objects`))
cliOutput.printLine()
// console.log(chalk.blue.bold(`Default study:`))
// results = await studyCtl.getAll()
// cliOutput.outputCLI(results[2].mrJson)
// cliOutput.printLine()

// Companies output
console.log(chalk.blue.bold(`Owning and first companies:`))
results = await companyCtl.getAll()
cliOutput.outputCLI(results[2].mrJson)
cliOutput.printLine()
cliOutput.printLine()

// Print out the next steps
printNextSteps()



