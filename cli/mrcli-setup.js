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

import program from 'commander'
import chalk from 'chalk'
import ConfigParser from 'configparser'
import inquirer from "inquirer"

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
            company_logos: "http://cherokee.from-ca.com:3030/allicons.json?url=",
            echarts: "http://cherokee.from-ca.com:3000",
            access_token: "",
            refresh_token: "",
            pkce_device_code: "",
            device_code: "",
            challenge_code: "",
            client_id: "", 
            accepted_eula: false
        },
        s3_settings: {
            user: "medium_roast_io",
            api_key: "b7d1ac5ec5c2193a7d6dd61e7a8a76451885da5bd754b2b776632afd413d53e7",
            server: "http://cherokee.from-ca.com:9000",
            region: "leo-dc",
            source: "Unknown" // TODO this is deprecated remove after testing
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


async function getDeviceCode () {
    const myMessage = 'Please input the device code you copied from the browswer: '
    const myCode = await inquirer.prompt({name: 'theCode',message: myMessage})
    return myCode.theCode
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
const doSetup = await wizardUtils.operationOrNot('You\'d like to setup the mediumroast.io CLI, right?')
if (!doSetup) {
    console.log(chalk.red.bold('\t-> Ok exiting CLI setup.'))
    process.exit()
}

// Ask the user to accept the EULA, if they do not the function will exit
const acceptEula = await wizardUtils.doEula(demoEulaText)
myConfig.DEFAULT.accepted_eula = acceptEula // Keep the acceptance visible 
cliOutput.printLine()

// Perform device flow authorization
const authenticator = new Authenticate()
console.log(chalk.blue.bold('Opening your browser to register the identity of this client, you only need to do this once.'))

// Open the browser to obtain the client specific device code
const [challengeCode, clientId] = await authenticator.openPKCEUrl()
myConfig.DEFAULT.client_id = clientId
myConfig.DEFAULT.challenge_code = challengeCode

// Prompt the user to paste the device code into the setup utility
const pkceDeviceCode = await getDeviceCode()
myConfig.DEFAULT.pkce_device_code = pkceDeviceCode

// Authorize this client to obtain tokens
console.log(chalk.blue.bold('Requesting the authorization code from the identity service.'))
const authorizationCode = await authenticator.authorizeClient(pkceDeviceCode, challengeCode)
console.log(authorizationCode) // FAIL here
const deviceCode = authorizationCode[1].device_code
myConfig.DEFAULT.device_code = deviceCode
const userCode = authorizationCode[1].user_code

// Verify the client authorization
console.log(chalk.blue.bold(`Opening the browser to authorize the client with [${userCode}].`))
const verificationUriComplete = authorizationCode[1].verification_uri_complete
await authenticator.verifyClientAuth(verificationUriComplete)
let authorized = null
while (!authorized) {
    authorized = await wizardUtils.operationOrNot('Has the web authorization completed?')
}
process.exit()

// 
// Obtaining the tokens
console.log(chalk.blue.bold(`Requesting access and refresh tokens from the identity service with [${deviceCode}].`))
const theTokens = await authenticator.getTokens(deviceCode)
console.log(theTokens)
myConfig.DEFAULT.access_token = theTokens[1].access_token
myConfig.DEFAULT.token_type = theTokens[1].token_type
myConfig.DEFAULT.access_token_expiry = theTokens[1].expires_in
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

process.exit()

// Generate the needed controllers to interact with the backend
const credential = authenticator.login(myEnv)
const companyCtl = new Companies(credential)
const studyCtl = new Studies(credential)

// Create the first "owning company" for the initial user
console.log(chalk.blue.bold('Creating owning company...'))
myEnv.splash = false
const cWizard = new AddCompany(
    myEnv,
    companyCtl,
    myEnv.DEFAULT.company_dns
)
const companyResp = await cWizard.wizard(true)
const myCompany = companyResp[1].data
// Create an S3 bucket derived from the company name, and the steps for creating the
// bucket name are in _genereateBucketName().
const myS3 = new s3Utilities(myEnv.s3_settings)
const bucketName = myS3.generateBucketName(myCompany.name)
const s3Resp = await myS3.s3CreateBucket(bucketName)
if(s3Resp) {
    console.log(chalk.blue.bold(`Added interaction storage space for ${myCompany.name}.`))
} else {
    console.log(chalk.blue.red(`Unable to add interaction storage space for ${myCompany.name}.`))
}
cliOutput.printLine()

// Create a default study for interactions to use
console.log(chalk.blue.bold(`Adding default study to the backend...`))
const myStudy = {
    name: 'Default Study',
    description: 'A placeholder study to ensure that interactions are able to have something to link to',
    public: false,
    groups: 'default:default',
    document: {}
}
const studyResp = await studyCtl.createObj(myStudy)
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



