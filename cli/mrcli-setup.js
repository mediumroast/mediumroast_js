#!/usr/bin/env node

/**
 * A CLI utility to setup the configuration file to talk to the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_setup.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.1.0
 */

// Import required modules
import { Utilities } from '../src/helpers.js'
import { Auth, Companies, Studies } from '../src/api/mrServer.js'
import CLIOutput from '../src/cli/output.js'
import WizardUtils from '../src/cli/commonWizard.js'
import AddCompany from '../src/cli/companyWizard.js'
import s3Utilities from '../src/cli/s3.js'
import demoEulaText from '../src/cli/demoEula.js'
import Authenticate from '../src/api/authorize.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import MinioUtilities from '../src/cli/minio.js'

import program from 'commander'
import chalk from 'chalk'
import ConfigParser from 'configparser'
import inquirer from "inquirer"
import { Users } from 'mediumroast_js'
import AddUser from '../src/cli/userWizard.js'

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

function parseCLIArgs() {
    // Define commandline options
    program
        .name("mr_setup")
        .version('2.1.0')
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
            mr_server: "https://app.mediumroast.io/api",
            company_dns: "https://www.mediumroast.io/company_dns",
            company_logos: "https://logo-server.mediumroast.io:7000/allicons.json?url=",
            echarts: "https://chart-server.mediumroast.io:11000",
            nominatim: 'https://nominatim.openstreetmap.org/search?addressdetails=1&q=',
            user_agent: 'mediumroast-cli',
            working_directory: "working",
            report_output_dir: "Documents",
            theme: "coffee",
            access_token: "",
            access_token_expiry: "",
            token_type: "",
            device_code: "",
            accepted_eula: false,
            user_first_name: "",
            user_email_address: "",
            live: false
        },
        s3_settings: {
            user: "medium_roast_io",
            // api_key: "b7d1ac5ec5c2193a7d6dd61e7a8a76451885da5bd754b2b776632afd413d53e7",
            api_key: "",
            server: "https://s3.mediumroast.io:9000",
            region: "scripps-dc",
            // source: "Unknown" // TODO this is deprecated remove after testing
        }
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

async function getS3APIKey(prompt) {
    let apiKey = await wizardUtils.doManual(
        prompt, // Object that we should send to doManual
        ['key'], // Set of attributes to prompt for
        true, // Should we prompt only for the whitelisted attributtes
        true // Use an alternative message than the default supplied
    )
    if(!apiKey.key) {
        apiKey = await getS3APIKey(prompt)
    }
    return apiKey
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

// Define the basic structure of the new object to store to the config file
let myConfig = {
    DEFAULT: null,
    s3_settings: null
}

// Assign the env data to the configuration
myConfig.DEFAULT = myEnv.DEFAULT
myConfig.s3_settings = myEnv.s3_settings

// Construct needed classes
const cliOutput = new CLIOutput(myEnv)
const wizardUtils = new WizardUtils('all')
const utils = new Utilities("all")

// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    cliOutput.splashScreen(
        "mediumroast.io  Setup Wizard",
        "version 2.1.0",
        "CLI prompt based setup and registration for the mediumroast.io service."
    )
}



// Are we going to proceed or not?
// const doSetup = await wizardUtils.operationOrNot('You\'d like to setup the mediumroast.io CLI, right?')
// if (!doSetup) {
//     console.log(chalk.red.bold('\t-> Ok exiting CLI setup.'))
//     process.exit()
// }


// // Ask the user to accept the EULA, if they do not the function will exit
// const acceptEula = await wizardUtils.doEula(demoEulaText)
// myConfig.DEFAULT.accepted_eula = acceptEula // Keep the acceptance visible 
// cliOutput.printLine()

// // Perform device flow authorization
const authenticator = new Authenticate()
// // ----------------------- DEVICE CODE ----------------------------
// const [result, data] = await authenticator.getDeviceCode()
// myConfig.DEFAULT.device_code = data.device_code
// const userCode = data.user_code
// const verificationUri = data.verification_uri
// // const verificationUriComplete = data.verification_uri_complete

// // Verify the client authorization
// console.log(chalk.blue.bold(`Opening your browser to authorize this client, copy or type this code in your browser [${userCode}].`))
// await authenticator.verifyClientAuth(verificationUri)
// let authorized = null
// // Prompt the user and await their login and approval
// while (!authorized) {
//     authorized = await wizardUtils.operationOrNot('Has the web authorization completed?')
// }

// // Obtain the token and save to the environmental object
// const theTokens = await authenticator.getTokensDeviceCode(myConfig.DEFAULT.device_code)
// myConfig.DEFAULT.access_token = theTokens[1].access_token
// myConfig.DEFAULT.token_type = theTokens[1].token_type
// myConfig.DEFAULT.access_token_expiry = theTokens[1].expires_in
// cliOutput.printLine()


// Create the first user
// TODO user email address and first_name should be added to config file
// Why add these, I don't remember?

// Generate the needed controllers to interact with the backend
const credential = authenticator.login(myEnv)
const companyCtl = new Companies(credential)
const studyCtl = new Studies(credential)
const userCtl = new Users(credential)

// Obtain user attributes
console.log(chalk.blue.bold('Learning a little more about you...'))
const uWizard = new AddUser(
    myConfig,
    userCtl // NOTE: User creation is commented out
)
// TODO: We do not yet know the name of the company so have to update the user later on.
let myUser = await uWizard.wizard(true, false)
myConfig.DEFAULT.company = myUser[2].company_name
cliOutput.printLine()


// Create the owning company for the initial user
console.log(chalk.blue.bold('Creating your owning company...'))
myEnv.splash = false
const cWizard = new AddCompany(
    myConfig,
    companyCtl, // NOTE: Company creation is commented out
    myConfig.DEFAULT.company_dns
)
let owningCompany = await cWizard.wizard(true, myConfig.DEFAULT.live)
// console.log(`Firmographics summary for ${owningCompany[2].name}`)
// console.log(`\tWebsite: ${owningCompany[2].url}`)
// console.log(`\tLogo URL: ${owningCompany[2].logo_url}`)
// console.log(`\tIndustry: ${owningCompany[2].industry}`)
// console.log(`\tIndustry code: ${owningCompany[2].industry_code}`)
// console.log(`\tCompany type: ${owningCompany[2].company_type}`)
// console.log(`\tRegion: ${owningCompany[2].region}`)
// console.log(`\tRole: ${owningCompany[2].role}`)
// console.log(`\tLongitude: ${owningCompany[2].longitude}`)
// console.log(`\tLatitude: ${owningCompany[2].latitude}`)
// console.log(`\tMaps URL: ${owningCompany[2].google_maps_url}`)


// Set company user name to user name set in the company wizard
myUser.company = owningCompany[2].name



// Create an S3 bucket to store interactions
console.log(chalk.blue.bold(`Establishing the storage container for [${myConfig.DEFAULT.company}] ...`))

// Get the key from the command line
const s3PromptObj = {
    key: {consoleString: "the provided API Key from mediumroast.io", value: null, altMessage: 'Please input'},
}
const apiKey = await getS3APIKey(s3PromptObj)
myConfig.s3_settings.api_key = apiKey.key
const myAdvisoryS3 = new s3Utilities(myConfig.s3_settings)

// Create the s3Name name
// NOTES:
// 1. containerName = userName = s3Name
// 2. userName can only access a container named userName
// 3. Permissions for the container are GET, PUT and LIST, others may be added over time
// 4. 
const s3Name = myAdvisoryS3.generateBucketName(myConfig.DEFAULT.company)

// Create the bucket
const s3Resp = await myAdvisoryS3.s3CreateBucket(s3Name)
if(s3Resp[0]) {
    console.log(chalk.blue.bold(`For ${owningCompany[2].name} added storage container [${s3Resp[2].Location}].`))
} else if (s3Resp[2].code === 'BucketAlreadyOwnedByYou') {
    console.log(chalk.blue.red(`Storage container for [${owningCompany[2].name}] already exists, nothing to do.`))
} else {
    console.log(chalk.blue.red(`Cannot add storage container for [${owningCompany[2].name}], exiting.`))
    // TODO: Need to be more graceful in the case where the bucket already exists
    process.exit(-1)
}

// Create the user
// TODO: When we support generic S3 ww must ensure that there are switches that
//          shift between Minio and generic S3.  Note that this may become a support
//          nightmare since to support every cloud variation could be bespoke. 
console.log(chalk.blue.bold(`Establishing the storage container credential for [${myConfig.DEFAULT.company}] ...`))
const minioCtl = new MinioUtilities(myEnv)
const userS3Key = await minioCtl.addMinioUser(s3Name, myConfig.DEFAULT.company)

// Set the S3 credential information into the env
myConfig.s3_settings.api_key = userS3Key
myConfig.s3_settings.bucket = s3Name
myConfig.s3_settings.user = s3Name
cliOutput.printLine()

// Persist and verify the config file
// Check for and create the directory process.env.HOME/.mediumroast
const configFile = checkConfigDir()
console.log(chalk.blue.bold('Writing configuration file [' + configFile + '].'))
// Write the config file
writeConfigFile(myConfig, configFile)
// Verify the config file
console.log(chalk.blue.bold('Verifying existence and contents of configuration file [' + configFile + '].'))
const success = verifyConfiguration(myConfig, configFile)
success ? 
    console.log(chalk.blue.bold('SUCCESS: Verified configuration file [' + configFile + '].')) :
    console.log(chalk.red.bold('ERROR: Unable to verify configuration file [' + configFile + '].'))
cliOutput.printLine()

// Create the first company
// Reset company user name to user name set in the company wizard
myConfig.DEFAULT.company = 'Unknown'
const firstComp = new AddCompany(
    myConfig,
    companyCtl, // NOTE: Company creation is commented out
    myConfig.DEFAULT.company_dns
)
console.log(chalk.blue.bold('Creating the first company ...'))
let firstCompanyResp = await firstComp.wizard(false, myConfig.DEFAULT.live)
const firstCompany = firstCompanyResp[1].data
cliOutput.printLine()

// Create a default study for interactions and companies to use
console.log(chalk.blue.bold(`Adding default study ...`))
const myStudy = {
    name: 'Default Study',
    description: 'A placeholder study to ensure that interactions are able to have something to link to',
    public: false,
    groups: 'default:default',
    document: {}
}
// const studyResp = await studyCtl.createObj(myStudy)
cliOutput.printLine()

// TODO perform linkages between company and study objects
// cliOutput.printLine()


// List all created objects to the console
// console.log(chalk.blue.bold(`Fetching and listing all created objects...`))
// console.log(chalk.blue.bold(`Default study:`))
// const myStudies = await studyCtl.getAll()
// cliOutput.outputCLI(myStudies[2])
// cliOutput.printLine()
// console.log(chalk.blue.bold(`Owning and first companies:`))
// const myCompanies = await companyCtl.getAll()
// cliOutput.outputCLI(myCompanies[2])
// cliOutput.printLine()

// TEMP save objects to /tmp/<object_name>.json
const fsOps = new FilesystemOperators()
console.log(chalk.blue.bold(`Saving user and company information to /tmp...`))
fsOps.saveTextFile(`/tmp/user.json`, JSON.stringify(myUser))
fsOps.saveTextFile(`/tmp/owning_company.json`, JSON.stringify(owningCompany[2]))
fsOps.saveTextFile(`/tmp/first_company.json`, JSON.stringify(firstCompany))
cliOutput.printLine()

// Print out the next steps
console.log(`Now that you\'ve performed the initial registration here\'s what\'s next.`)
console.log(chalk.blue.bold(`\t1. Create and register additional companies with mrcli company --add_wizard.`))
console.log(chalk.blue.bold(`\t2. Register and add interactions with mrcli interaction --add_wizard.`))
console.log('\nWith additional companies and new interactions registered the mediumroast.io caffeine\nservice will perform basic company comparisons.')
cliOutput.printLine()



