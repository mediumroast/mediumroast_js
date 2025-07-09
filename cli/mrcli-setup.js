#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to perform initial configuration and setup of Mediumroast for GitHub
 * @license Apache-2.0
 * @version 3.2.0
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
import { GitHubAuth, Companies, Users, GitHubFunctions } from 'mediumroast_api'
import ora from "ora"

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath, URL } from 'url'

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

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
    const output = new CLIOutput(env, 'Org')
    // Prompt and confirm user's the GitHub organization
    let gitHubOrgName = await simplePrompt('Please enter your GitHub organization.')
    // Clean up the organization name (don't URL encode it)
    gitHubOrgName = gitHubOrgName.trim()
    
    // Construct the GitHubFunctions object with correct parameter order
    let gitHubCtl = new GitHubFunctions(token, gitHubOrgName, 'mrcli-setup')

    // Set the tryAgain variable initially to false
    let tryAgain = false

    // Obtain the intel based upon the organization the user input
    console.log(`\nLooking up GitHub organization: ${gitHubOrgName}...`)
    const gitHubOrg = await gitHubCtl.getGitHubOrg()

    if(!gitHubOrg[0]){
        console.log(chalk.red(`Error: ${gitHubOrg[1]}`))
        tryAgain = await wizardUtils.operationOrNot(
            `Unfortunately, no organization matching [${gitHubOrgName}] was found. Maybe you mistyped it, try again?`
        )
        if(tryAgain) {
            gitHubCtl = await confirmGitHubOrg(token, env)
        } else {
            console.log(chalk.red.bold('\t> Ok, please find the right organization, until then exiting setup.'))
            process.exit()
        }
    }
    // Only print the table if we're not trying again and we found the org
    if (!tryAgain && gitHubOrg[0]) {
        const orgData = gitHubOrg[2]
        const orgName = orgData.name || orgData.login || 'Unknown'
        console.log(chalk.green(`\nFound organization: ${orgName}`))
        output.outputCLI([gitHubOrg[2]])
    }

    // Confirm that the organization is correct
    if (!tryAgain) {
        const confirmed = await wizardUtils.operationOrNot(
            `Based on your information this is the organization we found, does it look correct?`
        )
        if(!confirmed) {
            const tryAgain = await wizardUtils.operationOrNot(
                `Ok this was not the correct organization, try again?`
            )
            if(tryAgain) {
                gitHubCtl = await confirmGitHubOrg(token, env)
            } else {
                console.log(chalk.red.bold('\t> Ok, please find the right organization, until then exiting setup.'))
                process.exit()
            }
        }
    }
    return gitHubCtl
}

// Verify the configuration was written
function verifyConfiguration(myEnv, configFile) {
    const configurator = new ConfigParser()
    // Read in the config file and check to see if things are ok by confirming the rest_server value matches
    configurator.read(configFile)
    const clientId = configurator.get('GitHub', 'clientId')
    let success = false
    if(clientId === myEnv.GitHub.clientId) { success = true }
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

// New pre-flight check functions for GitHub App installation and resource detection

/**
 * Check if the Mediumroast for GitHub App is properly installed on the organization
 * @param {GitHubFunctions} github - The GitHub functions instance
 * @param {string} orgName - The organization name
 * @returns {Promise<boolean>} - True if app is installed, false otherwise
 */
async function checkGitHubAppInstallation(github, orgName) {
    console.log(`🔍 Checking Mediumroast for GitHub App installation for organization: ${orgName}`)
    
    try {
        const result = await github.checkGitHubAppInstallation()
        
        if (!result[0]) {
            console.error('❌ Failed to check GitHub App installations')
            console.error(`Error: ${result[1].status_msg || result[1]}`)
            
            if (result[2]?.error) {
                console.log('\n📋 To proceed, please:')
                console.log('1. Install the app from: https://github.com/apps/mediumroast-for-github')
                console.log('2. Grant it access to your organization')
                console.log('3. Ensure it has permissions for repository management')
            }
            return false
        }

        const installationData = result[2]
        if (installationData.installed) {
            console.log(`✅ Mediumroast for GitHub App is properly installed`)
            console.log(`📊 Repository access: ${installationData.repositoryAccess} repositories`)
            console.log(`🔧 Repository selection: ${installationData.repositorySelection}`)
            return true
        } else {
            console.error(`❌ Mediumroast for GitHub App is not properly installed`)
            console.log('\n📋 To proceed, please:')
            console.log('1. Install the app from: https://github.com/apps/mediumroast-for-github')
            console.log('2. Grant it access to your organization')
            console.log('3. Ensure it has permissions for repository management')
            return false
        }
    } catch (error) {
        console.error(`❌ Error checking GitHub App installation: ${error.message}`)
        return false
    }
}

/**
 * Check for existing installations of repository, containers, and actions
 * @param {GitHubFunctions} github - The GitHub functions instance
 * @param {Object} config - Configuration object with org and resource names
 * @returns {Promise<Object>} - Object containing existence status of resources
 */
async function checkExistingInstallations(github, config) {
    const results = {
        repository: null,
        containers: null,
        actions: null
    }

    try {
        // Check repository
        console.log('🔍 Checking for existing repository...')
        const repoResult = await github.repositoryManager.getByName(
            config.org, 
            'mr_backend'  // Default repository name used by mediumroast
        )
        
        if (repoResult[0] && repoResult[2]) {
            results.repository = repoResult[2]
            console.log(`✅ Repository "mr_backend" already exists`)
        } else {
            console.log(`📝 Repository "mr_backend" not found - will be created`)
        }

        // Check containers
        console.log('🔍 Checking for existing containers...')
        const containerResult = await github.containerManager.getAll()
        
        if (containerResult[0] && containerResult[2] && containerResult[2].length > 0) {
            results.containers = containerResult[2]
            console.log(`✅ Containers already exist (${containerResult[2].length} found)`)
        } else {
            console.log(`📦 No containers found - will be created`)
        }

        // Check actions installation
        if (results.repository) {
            console.log('🔍 Checking for existing GitHub Actions...')
            const actionsCheck = await github.actionsManager.getCurrentVersion()
            
            if (actionsCheck[0] && actionsCheck[2]?.installed) {
                results.actions = actionsCheck[2]
                console.log(`✅ GitHub Actions already installed (version: ${actionsCheck[2].version_file?.content?.version || 'Unknown'})`)
            } else {
                console.log('🚀 GitHub Actions not found - will be installed')
            }
        }
    } catch (error) {
        console.log(`⚠️  Error checking existing installations: ${error.message}`)
    }

    return results
}

/**
 * Prompt user for actions when existing installations are detected
 * @param {Object} existingInstallations - Object containing existing installation status
 * @returns {Promise<Object>} - Object containing user preferences for operations
 */
async function promptForExistingInstallations(existingInstallations) {
    const operations = {
        createRepository: true,
        setupContainers: true,
        installActions: true,
        actionsOperation: 'install'
    }

    if (existingInstallations.repository) {
        const answer = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: '⚠️  Repository already exists. Skip repository creation?',
            default: true
        }])
        operations.createRepository = !answer.proceed
    }

    if (existingInstallations.containers && existingInstallations.containers.length > 0) {
        const answer = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: '⚠️  Containers already exist. Skip container setup?',
            default: true
        }])
        operations.setupContainers = !answer.proceed
    }

    if (existingInstallations.actions) {
        const choices = [
            { name: 'Skip actions installation', value: 'skip' },
            { name: 'Update to latest version', value: 'update' },
            { name: 'Reinstall from scratch', value: 'reinstall' }
        ]

        const answer = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: '⚠️  GitHub Actions already installed. What would you like to do?',
            choices: choices,
            default: 'skip'
        }])

        operations.installActions = answer.action !== 'skip'
        operations.actionsOperation = answer.action
    }

    return operations
}

/**
 * Enhanced error handling wrapper for operations
 * @param {string} operationName - Name of the operation for logging
 * @param {Function} operation - The operation function to execute
 * @returns {Promise<any>} - Result of the operation
 */
async function safeOperation(operationName, operation) {
    try {
        console.log(`🔄 Starting: ${operationName}`)
        const result = await operation()
        console.log(`✅ Completed: ${operationName}`)
        return result
    } catch (error) {
        console.error(`❌ Failed: ${operationName}`)
        console.error(`   Error: ${error.message}`)
        
        // Provide specific guidance based on error type
        if (error.message.includes('App not installed')) {
            console.log('\n🔧 Solution: Install the Mediumroast for GitHub App')
            console.log('   https://github.com/apps/mediumroast-for-github')
        } else if (error.message.includes('permission')) {
            console.log('\n🔧 Solution: Check app permissions and organization access')
        } else if (error.message.includes('already exists')) {
            console.log('\n🔧 Solution: Use the existence check and prompt features')
        }
        
        throw error
    }
}

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/
// Global variables
const VERSION = '3.2.0'
const NAME = 'setup'
const DESC = 'A CLI utility to perform initial configuration and setup of Mediumroast for GitHub'
const defaultConfigFile = `${process.env.HOME}/.mediumroast/config.ini`

// Construct the file system utility object
const fsUtils = new FilesystemOperators()

// Get configuration information from the config file - create environment first
const environment = new Environmentals(VERSION, NAME, DESC, 'all')

// Parse the commandline arguments using the standardized environment method
let myProgram = environment.parseCLIArgs(true)
myProgram
    .requiredOption(
        '-s --splash <yes | no>',
        'Whether or not to include the splash screen at startup.',
        'yes',
        'no'
    )

myProgram.parse(process.argv)
const myArgs = myProgram.opts()

// Read the environmental settings
const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
myEnv.company = 'Unknown'
const myAuth = new GitHubAuth(myEnv, environment, myArgs.conf_file, true)
const verifiedToken = await myAuth.verifyAccessToken()
let accessToken = null
if (!verifiedToken[0]) {
    console.error(`ERROR: ${verifiedToken[1].status_msg}`)
    process.exit(-1)
} else {
    accessToken = verifiedToken[2].token
}
const processName = 'mrcli-setup'

// Get the key settings to create the configuration file
const configEnv = getEnv()

// Update myEnv with configuration defaults
myEnv.DEFAULT = configEnv.DEFAULT
myEnv.GitHub = configEnv.GitHub

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
// Authorization is already handled above with the modern pattern
// Store authentication information in configuration
myEnv.GitHub.token = accessToken
myEnv.GitHub.authType = verifiedToken[2].authType

cliOutput.printLine()

/* -----       End authorization       ----- */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* ----- Begin GitHub org confirmation ----- */
// Gather and confirm the GitHub organization
let gitHubCtl = await confirmGitHubOrg(accessToken, myEnv)

// Capture the GitHub organization name should we need it later
myEnv.GitHub.org = gitHubCtl.orgName

// Step 1: Pre-flight check for GitHub App installation
console.log('\n🚀 Performing pre-flight checks...')
const appInstalled = await safeOperation('GitHub App Installation Check', async () => {
    return await checkGitHubAppInstallation(gitHubCtl, myEnv.GitHub.org)
})

if (!appInstalled) {
    console.log('\n❌ Cannot proceed without proper GitHub App installation')
    console.log('Please install the Mediumroast for GitHub App and try again.')
    process.exit(-1)
}

// Step 2: Check for existing installations
console.log('\n📋 Checking existing installations...')
const existingInstallations = await safeOperation('Existing Installation Check', async () => {
    return await checkExistingInstallations(gitHubCtl, {
        org: myEnv.GitHub.org,
        repoName: 'mr_backend'
    })
})

// Step 3: Get user preferences for existing resources
let operations = { 
    createRepository: true, 
    setupContainers: true, 
    installActions: true,
    actionsOperation: 'install'
}
if (existingInstallations.repository || existingInstallations.containers || existingInstallations.actions) {
    console.log('\n⚠️  Existing installations detected')
    operations = await promptForExistingInstallations(existingInstallations)
}

// Ensure all operation flags have defaults
operations.createRepository = operations.createRepository !== undefined ? operations.createRepository : true
operations.setupContainers = operations.setupContainers !== undefined ? operations.setupContainers : true
operations.installActions = operations.installActions !== undefined ? operations.installActions : true
operations.actionsOperation = operations.actionsOperation || 'install'

// Store operations in environment for later use
myEnv.operations = operations

// TODO: Add the GitHub organization Identifier to the config file

cliOutput.printLine()
/* ------ End GitHub org confirmation ------ */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* -------- Check for prev install --------- */
// Set the flags to false to indicate that we have not installed fully or partially
let prevInstall = false
let partialInstall = false
// Construct the controller objects using modern pattern
const companyCtl = new Companies(accessToken, myEnv.GitHub.org, processName)
const userCtl = new Users(accessToken, myEnv.GitHub.org, processName)
// const studyCtl = new Studies(accessToken, myEnv.GitHub.org, processName)

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
myEnv.DEFAULT.theme = themes[theme]

/* ----------------------------------------- */
/* ----------- Save config file ------------ */
// Confirm that the configuration directory exists only if we don't already have one
// if(!configExists[0]) { 
    const configFile = environment.checkConfigDir()
    process.stdout.write(chalk.blue(`Saving configuration to file [${configFile}] ... `))

    // Write the config file
    const configurator = new ConfigParser()
    environment.writeConfig(configurator, myEnv, configFile)

    // Verify configuration
    const verifyConfig = verifyConfiguration(myEnv, configFile)
    if(verifyConfig) {
        console.log(chalk.green('SUCCESS: Configuration saved successfully'))
    } else {
        console.log(chalk.red(`ERROR: Configuration file written incorrectly.`))
        process.exit(-1)
    }

    cliOutput.printLine()
// }
// Confirm that Document directory exists and if not create it
const docDir = myEnv.DEFAULT.report_output_dir
const reportDirExists = fsUtils.safeMakedir(docDir)
if(!reportDirExists[0]) {
    console.log(chalk.red(`ERROR: Unable to create report directory [${docDir}].`))
}

/* --------- End save config file ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* --------- Inform prev install ----------- */
// If we have a previous installation then we need to exit and let the user know
if(prevInstall) {
    console.log(chalk.yellow(`WARNING: Previous installation detected, skipping initial object creation.`))
    printNextSteps()
    process.exit()
}
/* ------- End inform prev install --------- */
/* ----------------------------------------- */



/* ----------------------------------------- */
/* --------- Create the repository --------- */
if (!partialInstall && myEnv.operations.createRepository) {
    await safeOperation('Repository Creation', async () => {
        process.stdout.write(chalk.blue(`Creating mediumroast app repository for all objects and artifacts ... `))
        gitHubCtl = new GitHubFunctions(accessToken, myEnv.GitHub.org, processName)
        const repoResp = await gitHubCtl.createRepository(accessToken)
        if(repoResp[0]) {
            console.log(chalk.green('SUCCESS: Repository created successfully'))
            return repoResp
        } else {
            console.log(chalk.red(`ERROR: Failed to create repository: [${repoResp[1]}]`))
            throw new Error(`Repository creation failed: ${repoResp[1]}`)
        }
    })
} else if (!myEnv.operations.createRepository) {
    console.log(chalk.yellow('⏭️  Skipping repository creation (user choice)'))
} else if (partialInstall) {
    console.log(chalk.yellow(`NOTICE: Partial installation detected, repository may already exist.`))
}

cliOutput.printLine()
/* --------- End create repository --------- */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* --------- Create the containers --------- */
if (!partialInstall && myEnv.operations.setupContainers) {
    await safeOperation('Container Creation', async () => {
        process.stdout.write(chalk.blue(`Creating app containers for Study, Company and Interaction artifacts ... `))
        const containerResp = await gitHubCtl.createContainers()
        if(containerResp[0]) {
            console.log(chalk.green('SUCCESS: Containers created successfully'))
            return containerResp
        } else {
            console.log(chalk.red(`ERROR: Failed to create containers: [${containerResp[1]}]`))
            throw new Error(`Container creation failed: ${containerResp[1]}`)
        }
    })
} else if (!myEnv.operations.setupContainers) {
    console.log(chalk.yellow('⏭️  Skipping container setup (user choice)'))
} else if (partialInstall) {
    console.log(chalk.yellow(`NOTICE: Partial installation detected, skipping container creation and picking up where we left off.`))
}

cliOutput.printLine()
/* --------- End create containers --------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ------------ Install actions ------------ */
if (myEnv.operations.installActions) {
    await safeOperation('GitHub Actions Management', async () => {
        if (myEnv.operations.actionsOperation === 'update') {
            process.stdout.write(chalk.blue(`Updating GitHub Actions to latest version ... `))
            const updateResult = await gitHubCtl.actionsManager.updateActions(true)
            if (updateResult[0]) {
                console.log(chalk.green('SUCCESS: GitHub Actions updated successfully'))
                if (updateResult[2]?.version) {
                    console.log(`   📋 Version: ${updateResult[2].version}`)
                }
                return updateResult
            } else {
                throw new Error(`Actions update failed: ${updateResult[1]}`)
            }
        } else if (myEnv.operations.actionsOperation === 'reinstall') {
            process.stdout.write(chalk.blue(`Reinstalling GitHub Actions from scratch ... `))
            // Delete existing actions first
            await gitHubCtl.actionsManager.deleteActions()
            const installResult = await gitHubCtl.actionsManager.installActions(true)
            if (installResult[0]) {
                console.log(chalk.green('SUCCESS: GitHub Actions reinstalled successfully'))
                if (installResult[2]?.version) {
                    console.log(`   📋 Version: ${installResult[2].version}`)
                }
                if (installResult[2]?.workflows) {
                    console.log(`   📄 Workflows: ${installResult[2].workflows.length} installed`)
                }
                return installResult
            } else {
                throw new Error(`Actions installation failed: ${installResult[1]}`)
            }
        } else {
            // Default installation - try new API first, fallback to legacy
            process.stdout.write(chalk.blue(`Installing actions and workflows ... `))
            
            // Try using the new actions manager API
            try {
                const installResult = await gitHubCtl.actionsManager.installActions(true)
                if (installResult[0]) {
                    console.log(chalk.green('SUCCESS: GitHub Actions installed successfully'))
                    if (installResult[2]?.version) {
                        console.log(`   📋 Version: ${installResult[2].version}`)
                    }
                    if (installResult[2]?.workflows) {
                        console.log(`   📄 Workflows: ${installResult[2].workflows.length} installed`)
                    }
                    return installResult
                } else {
                    throw new Error(`Actions installation failed: ${installResult[1]}`)
                }
            } catch (error) {
                console.log(chalk.yellow(`\n⚠️  New actions API failed, falling back to legacy installation...`))
                console.log(`   Error: ${error.message}`)
                
                // Fallback to legacy installation method
                const actionsManifest = generateActionsManifest()
                const installResp = await installActions(actionsManifest)
                if(installResp[0]) {
                    console.log(chalk.green('SUCCESS: Actions and workflows installed successfully (legacy method)'))
                    return installResp
                } else {
                    throw new Error(`Legacy actions installation failed: ${installResp[1]}`)
                }
            }
        }
    })
} else {
    console.log(chalk.yellow('⏭️  Skipping GitHub Actions installation (user choice)'))
}
cliOutput.printLine()
/* ---------- End Install actions ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ---- Begin initial objects creation ----- */

// Create the owning company
console.log(chalk.blue.bold('Creating your owning company'))
myEnv.DEFAULT.companyDNS = myEnv.DEFAULT.company_dns
myEnv.DEFAULT.companyLogos = myEnv.DEFAULT.company_logos
myEnv.DEFAULT.echartServer = myEnv.DEFAULT.echarts
myEnv.company = myEnv.GitHub.org
myEnv.splash = false
const cWizard = new AddCompany(
    myEnv,
    {github: gitHubCtl, interaction: null, company: companyCtl, user: userCtl},
    myEnv.DEFAULT.company_dns
)
const owningCompanyResp = await cWizard.wizard(true, false)
let owningCompany = owningCompanyResp[2]

// Create the first company
// Reset company user name to user name set in the company wizard
myEnv.company = 'Unknown'
const firstComp = new AddCompany(
    myEnv,
    {github: gitHubCtl, interaction: null, company: companyCtl, user: userCtl}, 
    myEnv.DEFAULT.company_dns
)
console.log(chalk.blue.bold('Creating the first company ...'))
let firstCompanyResp = await firstComp.wizard(false, false)
const firstCompany = firstCompanyResp[2]

// Save the companies to GitHub
let spinner = ora(chalk.blue('Saving companies to GitHub ... '))
spinner.start() // Start the spinner
    const companyResp = await companyCtl.createObj([owningCompany, firstCompany])
spinner.stop() // Stop the spinner
// If the company creation failed then exit
if(!companyResp[0]) {
    console.log(chalk.red(`ERROR: ${companyResp[1].status_msg}, you may need to clean up the repository.`))
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

// Print comprehensive setup summary
console.log(chalk.green.bold('🎉 Mediumroast Setup Completed Successfully!'))
cliOutput.printLine()

console.log(chalk.blue.bold('📋 Setup Summary:'))
console.log(`   Organization: ${myEnv.GitHub.org}`)
console.log(`   Repository: ${myEnv.operations.createRepository ? '✅ Created' : '⏭️  Skipped'}`)
console.log(`   Containers: ${myEnv.operations.setupContainers ? '✅ Created' : '⏭️  Skipped'}`)
console.log(`   GitHub Actions: ${myEnv.operations.installActions ? `✅ ${myEnv.operations.actionsOperation || 'Installed'}` : '⏭️  Skipped'}`)
console.log(`   Companies Created: ${results[2].mrJson.length}`)
console.log(`   Configuration File: ${defaultConfigFile}`)
console.log(`   Theme: ${myEnv.DEFAULT.theme}`)

cliOutput.printLine()

// Print out the next steps
printNextSteps()