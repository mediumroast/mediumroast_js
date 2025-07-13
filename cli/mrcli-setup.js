#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to perform initial configuration and setup of Mediumroast for GitHub
 * @license Apache-2.0
 * @version 3.2.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-setup.js
 * @copyright 2025 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import CLIOutput from '../src/cli/output.js'
import CLIUtilities from '../src/cli/common.js'
import WizardUtils from '../src/cli/commonWizard.js'
import SetupWizard from '../src/cli/setupWizard.js'
import AddCompany from '../src/cli/companyWizard.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import SignalHandler from '../src/cli/signalHandler.js'
import Table from 'cli-table3'
import chalk from 'chalk'
import ConfigParser from 'configparser'
import Environmentals from '../src/cli/env.js'
import { GitHubAuth, Companies, Users, GitHubFunctions, Actions } from 'mediumroast_api'
import { logger } from 'mediumroast_api/src/api/gitHubServer/logger.js'

// Configure logger to default to warning level for production use via environment variable
// This ensures the logger respects the LOG_LEVEL environment variable pattern used by mediumroast_api
if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'warn'
}

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
        },
        Logging: {
            level: "warn",
            console_output: "true"
        }
    }
}



function printNextSteps() {
    // Print out the next steps
    console.log(`Now that you\'ve performed the initial registration here\'s what\'s next.`)
    console.log(cliUtils.formatBlue(`\t1. Create and register additional companies with \'mrcli company --add_wizard\'.`))
    console.log(cliUtils.formatBlue(`\t2. Register and add interactions with \'mrcli interaction --add_wizard\'.`))
    cliOutput.printLine()
}



async function confirmGitHubOrg(token, env) {
    const tracker = logger.trackOperation('confirmGitHubOrg', 'mrcli-setup')
    const output = new CLIOutput(env, 'Org')
    
    try {
        // Prompt and confirm user's the GitHub organization
        let gitHubOrgName = await setupWizard.getTextInput(
            'Please enter your GitHub organization.',
            '',
            (input) => {
                if (!input.trim()) {
                    return 'Organization name cannot be empty'
                }
                return true
            }
        )
        
        // Construct the GitHubFunctions object with correct parameter order
        let gitHubCtl = new GitHubFunctions(token, gitHubOrgName, 'mrcli-setup')

        // Set the tryAgain variable initially to false
        let tryAgain = false

        // Obtain the intel based upon the organization the user input
        console.log(`\nLooking up GitHub organization: ${gitHubOrgName}...`)
        const gitHubOrg = await gitHubCtl.getGitHubOrg()

        if(!gitHubOrg[0]){
            logger.debug('GitHub organization lookup failed', {
                organization: gitHubOrgName,
                error: gitHubOrg[1]
            })
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
    } finally {
        tracker.end()
    }
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



// New pre-flight check functions for GitHub App installation and resource detection

/**
 * Enhanced pre-flight check for GitHub App installation confirmation
 * @param {GitHubFunctions} github - The GitHub functions instance
 * @param {string} orgName - The organization name
 * @returns {Promise<boolean>} - True if app is installed, false otherwise
 */
async function checkGitHubAppInstallation(github, orgName) {
    const tracker = logger.trackOperation('checkGitHubAppInstallation', 'mrcli-setup')
    
    try {
        process.stdout.write(`\tChecking GitHub App installation ... `)
        
        const result = await github.checkGitHubAppInstallation()
        
        if (!result[0]) {
            logger.error('GitHub App installation check failed', {
                organization: orgName,
                error: result[1].status_msg || result[1]
            })
            console.error(cliUtils.formatError('Failed to find GitHub App installations'))
            
            if (result[2]?.error) {
                console.log('\nTo proceed, you need to install the Mediumroast for GitHub App:')
                console.log('\t1. Install the app from: https://github.com/marketplace/mediumroast-for-github')
                console.log('\t2. Grant it access to your organization')
                console.log('\t3. Ensure it has permissions for repository management')
                
                // Offer to open the installation URL
                const shouldOpen = await wizardUtils.operationOrNot(
                    'Would you like me to open the GitHub App installation page for you?'
                )
                if (shouldOpen) {
                    await openGitHubAppInstallation(orgName)
                }
            }
            return false
        }

        const installationData = result[2]
        if (installationData.installed) {
            console.log(cliUtils.formatGreen('Mediumroast for GitHub App is properly installed'))
            
            // Log detailed permissions for debugging
            if (installationData.permissions) {
                logger.debug('GitHub App permissions details', {
                    organization: orgName,
                    permissions: installationData.permissions
                })
            }
            
            return true
        } else {
            logger.debug('GitHub App not properly installed', {
                organization: orgName,
                installationData
            })
            console.log('Mediumroast for GitHub App is not properly installed')
            console.log('\nTo proceed, you need to install the Mediumroast for GitHub App:')
            console.log('\t1. Install the app from: https://github.com/marketplace/mediumroast-for-github')
            console.log('\t2. Grant it access to your organization')
            console.log('\t3. Ensure it has permissions for repository management')
            
            // Offer to open the installation URL
            const shouldOpen = await wizardUtils.operationOrNot(
                'Would you like me to open the GitHub App installation page for you?'
            )
            if (shouldOpen) {
                await openGitHubAppInstallation(orgName)
            }
            
            return false
        }
    } catch (error) {
        logger.debug('GitHub App installation check error', {
            organization: orgName,
            error: error.message,
            stack: error.stack
        })
        console.error(cliUtils.formatError(`Error checking GitHub App installation: ${error.message}`))
        return false
    } finally {
        tracker.end()
    }
}

/**
 * Enhanced check for existing installations of repository, containers, and actions
 * @param {GitHubFunctions} github - The GitHub functions instance
 * @param {Object} config - Configuration object with org and resource names
 * @returns {Promise<Object>} - Object containing existence status of resources
 */
async function checkExistingInstallations(github, config) {
    const tracker = logger.trackOperation('checkExistingInstallations', 'mrcli-setup')
    
    const results = {
        repository: null,
        containers: null,
        actions: null
    }

    try {
        // Check repository using the same method as checkRepositoryAndActions
        const expectedRepoName = config.repoName || `${config.org}_discovery`
        process.stdout.write(`\tChecking for existing repository [${expectedRepoName}] ... `)
        try {
            const repoResult = await github.getRepoSize()
            
            if (repoResult[0]) {
                results.repository = repoResult[2]
                console.log(cliUtils.formatGreen(`Repository exists`))
            } else {
                console.log(cliUtils.formatRed(`Not found - will be created`))
            }
        } catch (repoError) {
            console.log(cliUtils.formatRed(`Not accessible - will be created`))
            logger.debug('Repository check failed', {
                organization: config.org,
                error: repoError.message
            })
        }

        // Check containers using getContent for each container type
        process.stdout.write('\tChecking for existing containers ... ')
        const containerNames = ['Companies', 'Interactions', 'Studies']
        const containerResults = []
        
        for (const containerName of containerNames) {
            try {
                const containerResult = await github.getContent(containerName)
                if (containerResult[0]) {
                    containerResults.push({
                        name: containerName,
                        exists: true,
                        data: containerResult[2]
                    })
                }
            } catch (error) {
                // Container doesn't exist, which is fine
                containerResults.push({
                    name: containerName,
                    exists: false
                })
            }
        }
        
        const existingContainers = containerResults.filter(c => c.exists)
        if (existingContainers.length > 0) {
            results.containers = existingContainers
            console.log(cliUtils.formatGreen(`(${existingContainers.length}/${containerNames.length} containers found)`))
        } else {
            console.log(cliUtils.formatRed(`No containers found - will be created`))
        }

        // Check actions installation
        if (results.repository) {
            process.stdout.write('\tChecking for existing GitHub Actions ... ')
            try {
                // Create Actions controller to check for existing installations
                const tempActionsCtl = new Actions(github.token, github.orgName, 'mrcli-setup-check')
                
                // Try to check for existing actions using getCurrentVersion (same as mrcli-actions.js)
                const versionResult = await tempActionsCtl.getCurrentVersion()
                
                if (versionResult[0] && versionResult[2]?.installed) {
                    results.actions = { 
                        installed: true, 
                        version: versionResult[2].version_file?.content?.version || 'Unknown',
                        details: versionResult[2]
                    }
                    console.log(cliUtils.formatGreen(`GitHub Actions installed (version: ${results.actions.version})`))
                } else {
                    // Fallback: check for workflows directory
                    const workflowsCheck = await github.getContent('.github/workflows')
                    if (workflowsCheck[0]) {
                        results.actions = { installed: true, type: 'workflows_directory' }
                        console.log(cliUtils.formatGreen('GitHub Actions workflows directory exists'))
                    } else {
                        console.log(cliUtils.formatRed('GitHub Actions not found - will be installed'))
                    }
                }
            } catch (error) {
                console.log(cliUtils.formatRed('GitHub Actions not found - will be installed'))
                logger.debug('Actions check failed', {
                    organization: config.org,
                    error: error.message
                })
            }
        } else {
            console.log(cliUtils.formatYellow('\tGitHub Actions check skipped, installing later'))
        }
    } catch (error) {
        logger.debug('Error checking existing installations', {
            organization: config.org,
            error: error.message,
            stack: error.stack
        })
        console.log(cliUtils.formatRed(`Error - ${error.message}`))
    } finally {
        tracker.end()
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
        const skipRepo = await wizardUtils.operationOrNot('\tRepository already exists, skip repository creation?')
        operations.createRepository = !skipRepo
    }

    if (existingInstallations.containers && existingInstallations.containers.length > 0) {
        const skipContainers = await wizardUtils.operationOrNot('\tContainers already exist, skip container setup?')
        operations.setupContainers = !skipContainers
    }

    if (existingInstallations.actions) {
        console.log(cliUtils.formatYellow('\tGitHub Actions already detected in your repository.'))
        console.log('\tDuring initial setup, you have the following options:')
        
        const choices = [
            { name: 'Update to latest version (recommended)', value: 'update' },
            { name: 'Remove and reinstall', value: 'reinstall' },
            { name: 'Skip actions setup', value: 'skip' }
        ]

        const action = await wizardUtils.doList(
            '\tHow would you like to handle the existing GitHub Actions?',
            choices
        )

        // For initial setup, provide additional confirmation for update operations
        if (action === 'update') {
            const confirmed = await wizardUtils.operationOrNot(
                'This will update your existing GitHub Actions to the latest version. Continue with update?'
            )
            if (!confirmed) {
                // If user declines update, ask if they want to reinstall instead
                const reinstall = await wizardUtils.operationOrNot(
                    'Would you like to reinstall from scratch instead? (This will remove existing actions first)'
                )
                operations.installActions = reinstall
                operations.actionsOperation = reinstall ? 'reinstall' : 'skip'
            } else {
                operations.installActions = true
                operations.actionsOperation = 'update'
            }
        } else {
            operations.installActions = action !== 'skip'
            operations.actionsOperation = action
        }
    }

    return operations
}

/**
 * Enhanced error handling wrapper for operations with comprehensive logging
 * @param {string} operationName - Name of the operation for logging
 * @param {Function} operation - The operation function to execute
 * @returns {Promise<any>} - Result of the operation
 */
async function safeOperation(operationName, operation) {
    const tracker = logger.trackOperation('safeOperation', 'mrcli-setup')
    
    try {
        console.log(`Starting: ${operationName}`)
        
        // Use signal handler's cancellable operation to respect shutdown signals
        const result = await signalHandler.cancellableOperation(operation, operationName)
        
        // Check if operation was cancelled by user
        if (result && result.cancelled) {
            console.log(`Cancelled: ${operationName}`)
            return result
        }
        
        console.log(`Completed: ${operationName}`)
        return result
    } catch (error) {
        // Check if error is due to shutdown cancellation
        if (error.message.includes('cancelled due to shutdown')) {
            logger.info('Operation cancelled due to shutdown', {
                operation: operationName,
                reason: 'SIGINT'
            })
            console.log(chalk.yellow(`\nOperation cancelled: ${operationName}`))
            return { cancelled: true, reason: 'shutdown' }
        }
        
        logger.debug('Operation failed', {
            operation: operationName,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        })
        console.error(cliUtils.formatError(`Failed: ${operationName}`))
        console.error(`\tDetailed message: ${error.message}`)
        
        // Provide specific guidance based on error type
        if (error.message.includes('App not installed')) {
            console.log('\nPossible solution: Install the Mediumroast for GitHub App')
            console.log('\thttps://github.com/apps/mediumroast-for-github')
        } else if (error.message.includes('permission')) {
            console.log('\nPossible solution: Check repository permissions')
            console.log('\tEnsure the GitHub App has proper access to your organization')
        } else if (error.message.includes('rate limit')) {
            console.log('\nPossible solution: GitHub API rate limit exceeded')
            console.log('\tPlease wait a few minutes before retrying')
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            console.log('\nPossible solution: Network connectivity issue')
            console.log('\tCheck your internet connection and try again')
        }
        
        throw error
    } finally {
        tracker.end()
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

// Initialize signal handler for graceful shutdown
const signalHandler = new SignalHandler('mrcli-setup')

// Initialize logging for setup operation
const setupTracker = logger.trackOperation('mediumroast-setup', 'mrcli-setup')
const setupStartTime = Date.now()
logger.info('Mediumroast setup utility started', {
    version: VERSION,
    timestamp: new Date().toISOString(),
    configFile: defaultConfigFile
})

// Construct the file system utility object
const fsUtils = new FilesystemOperators()

// Get configuration information from the config file - create environment first
const environment = new Environmentals(VERSION, NAME, DESC, 'all')

// Parse the commandline arguments using the standardized environment method
let myProgram = environment.parseCLIArgs(true)

// Remove command line options for reset_by_type, delete, update, and add_wizard by calling the removeArgByName method in the environmentals class
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--add_wizard')
myProgram = environment.removeArgByName(myProgram, '--reset_by_name')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--find_by_name')
myProgram = environment.removeArgByName(myProgram, '--find_by_x')
myProgram = environment.removeArgByName(myProgram, '--find_by_id')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--output')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--persona')

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
    console.error(cliUtils.formatError(verifiedToken[1].status_msg))
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
myEnv.Logging = configEnv.Logging

// Set the logging level from configuration file (if available) or use defaults
// This allows existing configuration files to control the mediumroast_api logger behavior
const logLevel = myEnv.logLevel || myEnv.Logging?.level || 'warn'
process.env.LOG_LEVEL = logLevel
console.log(`Logger configured to level: ${logLevel}`)

// Construct needed classes
const cliOutput = new CLIOutput(myEnv)
const cliUtils = new CLIUtilities()
const wizardUtils = new WizardUtils('all')
const setupWizard = new SetupWizard()

// Register cleanup tasks for graceful shutdown
signalHandler.registerCleanupTask(async () => {
    console.log(cliUtils.formatBlue('Finalizing setup tracking...'))
    if (setupTracker) {
        setupTracker.end()
    }
}, 'Finalize setup tracking')

signalHandler.registerCleanupTask(async () => {
    const duration = Date.now() - setupStartTime
    logger.info('Setup interrupted by user', {
        duration: duration,
        timestamp: new Date().toISOString(),
        reason: 'SIGINT'
    })
}, 'Log setup interruption')

// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    cliOutput.splashScreen(
        'Mediumroast Setup Wizard',
        `version ${VERSION}`,
        DESC
    )
    console.log(cliUtils.formatBlue('Press Ctrl-C at any time for graceful shutdown'))
    cliOutput.printLine()
}

/* ----------------------------------------- */
/* ---- Check if we should start setup ----- */

// Check to see if the config file exists and if it does prompt the user if they want to proceed
const configExists = fsUtils.checkFilesystemObject(defaultConfigFile)
if(configExists[0]) {
    const doSetup = await signalHandler.cancellablePrompt(
        () => wizardUtils.operationOrNot(`Previous configuration detected [${defaultConfigFile}], continue?`),
        'Setup continuation confirmation'
    )
    if (!doSetup) {
        console.log(chalk.red.bold('\t> Exiting CLI setup.'))
        process.exit()
    }
}

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

cliOutput.printLine()
// Step 1: Pre-flight check for GitHub App installation
cliUtils.printStep('Step 1 -> Performing pre-flight checks')
const appInstalled = await safeOperation('GitHub App Installation Check', async () => {
    return await checkGitHubAppInstallation(gitHubCtl, myEnv.GitHub.org)
})

if (!appInstalled) {
    logger.debug('Setup terminated due to missing GitHub App installation', {
        organization: myEnv.GitHub.org
    })
    console.error(cliUtils.formatError('Cannot proceed without proper GitHub App installation'))
    console.log('Please install the Mediumroast for GitHub App and try again.')
    process.exit(-1)
}

cliOutput.printLine()
// Step 1.5: Comprehensive check for existing installations and prerequisites
cliUtils.printStep('Step 1.5 -> Checking existing installations and prerequisites')
const existingInstallations = await safeOperation('Existing Installation and Prerequisites Check', async () => {
    return await checkExistingInstallations(gitHubCtl, {
        org: myEnv.GitHub.org,
        repoName: `${myEnv.GitHub.org}_discovery`
    })
})

// Log the results but don't fail setup - resources may not exist yet
if (existingInstallations.repository) {
    console.log(cliUtils.formatGreen('\tRepository exists and is accessible'))
} else {
    console.log(cliUtils.formatOrange('\t+ Repository will be created during setup'))
}

if (existingInstallations.containers && existingInstallations.containers.length > 0) {
    console.log(cliUtils.formatGreen(`\tContainers exist and are accessible (${existingInstallations.containers.length} found)`))
} else {
    console.log(cliUtils.formatOrange('\t+ Containers will be created during setup'))
}

if (existingInstallations.actions) {
    console.log(cliUtils.formatGreen('\tGitHub Actions are already installed'))
} else {
    console.log(cliUtils.formatOrange('\t+ GitHub Actions will be installed during setup'))
}

// Step 2: Get user preferences for existing resources
// Step 2: Get user preferences for existing resources
let operations = { 
    createRepository: true, 
    setupContainers: true, 
    installActions: true,
    actionsOperation: 'install'
}
if (existingInstallations.repository || existingInstallations.containers || existingInstallations.actions) {
    console.log(cliUtils.formatYellow('\tExisting installation detected, prompting user'))
    operations = await promptForExistingInstallations(existingInstallations)
}

// Ensure all operation flags have defaults
operations.createRepository = operations.createRepository !== undefined ? operations.createRepository : true
operations.setupContainers = operations.setupContainers !== undefined ? operations.setupContainers : true
operations.installActions = operations.installActions !== undefined ? operations.installActions : true
operations.actionsOperation = operations.actionsOperation || 'install'

// Store operations in environment for later use
myEnv.operations = operations

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
cliUtils.printStep('Step 2 -> Setup local environment')

// Check if configuration file already exists and prompt for overwrite
let overwriteConfig = true // Default to true for new installations
const existingConfigCheck = fsUtils.checkFilesystemObject(defaultConfigFile)

if(existingConfigCheck[0]) {
    console.log(cliUtils.formatYellow(`\tExisting configuration file detected: ${defaultConfigFile}`))
    
    // Verify if the existing configuration is valid
    try {
        const existingConfigValid = verifyConfiguration(myEnv, defaultConfigFile)
        if (existingConfigValid) {
            console.log(cliUtils.formatGreen('\tExisting configuration file appears to be valid'))
        } else {
            console.log(cliUtils.formatOrange('\tExisting configuration file may be outdated or different'))
        }
    } catch (error) {
        console.log(cliUtils.formatRed('\tExisting configuration file appears to be invalid or corrupted'))
        logger.debug('Configuration verification failed', {
            configFile: defaultConfigFile,
            error: error.message
        })
    }
    
    overwriteConfig = await signalHandler.cancellablePrompt(
        () => wizardUtils.operationOrNot('\tOverwrite existing configuration file with new settings?'),
        'Configuration overwrite confirmation'
    )
    
    if (!overwriteConfig) {
        console.log(cliUtils.formatYellow('\tKeeping existing configuration file'))
        console.log('\tProceeding with current settings...')
    } else {
        console.log(cliUtils.formatBlue('\tWill create new configuration file'))
    }
}

// Only prompt for theme selection if we're creating a new configuration
if (overwriteConfig) {
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
    const theme = await signalHandler.cancellablePrompt(
        () => wizardUtils.doList(
            '\tPlease select a theme for your Mediumroast reports',
            themeArray
        ),
        'Theme selection'
    )

    // Decode the theme value from the themes object
    myEnv.DEFAULT.theme = themes[theme]
} else {
    console.log(cliUtils.formatYellow('\tSkipping theme selection (using existing configuration)'))
}

/* ----------------------------------------- */
/* ----------- Save config file ------------ */
// Only save configuration if user agreed to overwrite or if it doesn't exist
if (overwriteConfig) {
    // Confirm that the configuration directory exists only if we don't already have one
    const configFile = environment.checkConfigDir()
    process.stdout.write(cliUtils.formatBlue(`\tSaving configuration to file ... `))

    // Write the config file
    const configurator = new ConfigParser()
    environment.writeConfig(configurator, myEnv, configFile)

    // Verify configuration
    const verifyConfig = verifyConfiguration(myEnv, configFile)
    if(verifyConfig) {
        console.log(cliUtils.formatGreen('Configuration saved'))
    } else {
        console.log(cliUtils.formatRed('Configuration written incorrectly'))
        process.exit(-1)
    }
} else {
    console.log(cliUtils.formatYellow('\tSkipping configuration file creation (keeping existing)'))
}

cliOutput.printLine()
// Confirm that Document directory exists and if not create it
const docDir = myEnv.DEFAULT.report_output_dir
const reportDirExists = fsUtils.safeMakedir(docDir)
if(!reportDirExists[0]) {
    console.error(cliUtils.formatError(`Unable to create report directory [${docDir}].`))
}

/* --------- End save config file ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* --------- Inform prev install ----------- */
// If we have a previous installation then we need to exit and let the user know
if(prevInstall) {
    console.warn(cliUtils.formatWarning('Previous installation detected, skipping initial object creation.'))
    printNextSteps()
    process.exit()
}
/* ------- End inform prev install --------- */
/* ----------------------------------------- */



/* ----------------------------------------- */
/* --------- Create the repository --------- */
if (!partialInstall && myEnv.operations.createRepository) {
    cliUtils.printStep('Step 3 -> Creating repository')
    await safeOperation('Repository Creation', async () => {
        process.stdout.write(cliUtils.formatBlue(`\tCreating mediumroast app repository ... `))
        gitHubCtl = new GitHubFunctions(accessToken, myEnv.GitHub.org, processName)
        const repoResp = await gitHubCtl.createRepository(accessToken)
        
        if(repoResp[0]) {
            console.log(cliUtils.formatGreen('Created successfully'))
            return repoResp
        } else {
            logger.debug('Repository creation failed', {
                organization: myEnv.GitHub.org,
                error: repoResp[1]
            })
            console.error(cliUtils.formatRed(`Failed to create repository`))
            throw new Error(`Repository creation failed: ${repoResp[1]}`)
        }
    })
} else if (!myEnv.operations.createRepository) {
    cliUtils.printStep('Step 3 -> Creating repository')
    console.warn(cliUtils.formatYellow('\tSkipping repository creation (user choice)'))
} else if (partialInstall) {
    console.warn(cliUtils.formatWarning('Partial installation detected, repository may already exist.'))
}

cliOutput.printLine()
/* --------- End create repository --------- */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* --------- Create the containers --------- */
if (!partialInstall && myEnv.operations.setupContainers) {
    cliUtils.printStep('Step 4 -> Creating app containers')
    await safeOperation('Container Creation', async () => {
        process.stdout.write(cliUtils.formatBlue(`\tCreating app containers ... `))
        const containerResp = await gitHubCtl.createContainers()
        
        if(containerResp[0]) {
            console.log(cliUtils.formatGreen('Containers created successfully'))
            return containerResp
        } else {
            logger.debug('Container creation failed', {
                organization: myEnv.GitHub.org,
                error: containerResp[1]
            })
            console.error(cliUtils.formatRed(`Failed to create containers`))
            throw new Error(`Container creation failed: ${containerResp[1]}`)
        }
    })
} else if (!myEnv.operations.setupContainers) {
    cliUtils.printStep('Step 4 -> Creating app containers')
    console.warn(cliUtils.formatYellow('\tSkipping container setup (user choice)'))
} else if (partialInstall) {
    console.warn(cliUtils.formatWarning('Partial installation detected, skipping container creation and picking up where we left off.'))
}

cliOutput.printLine()
/* --------- End create containers --------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ------------ Install actions ------------ */
if (myEnv.operations.installActions) {
    cliUtils.printStep('Step 5 -> Installing GitHub Actions')
    await safeOperation('GitHub Actions Management', async () => {
        // First, verify repository and actions availability
        const repoActionsStatus = await checkRepositoryAndActions(gitHubCtl, `${myEnv.GitHub.org}_discovery`)
        
        if (!repoActionsStatus.repository.exists) {
            logger.debug('Repository does not exist for actions installation', {
                organization: myEnv.GitHub.org,
                repository: `${myEnv.GitHub.org}_discovery`
            })
            console.warn(cliUtils.formatWarning('Repository does not exist yet - actions will be installed after repository creation'))
            return { skipped: true, reason: 'Repository not found' }
        }
        
        // Create Actions controller instance
        const actionsCtl = new Actions(accessToken, myEnv.GitHub.org, processName)
        
        if (myEnv.operations.actionsOperation === 'update') {
            console.log('\nUpdating existing GitHub Actions to latest version ...')
            console.log('\tThis will preserve your existing workflows and update them with the latest improvements.')
            process.stdout.write(cliUtils.formatBlue(`Updating GitHub Actions to latest version ... `))
            const updateResult = await actionsCtl.updateActions()
            if (updateResult[0]) {
                console.log(cliUtils.formatSuccess('GitHub Actions updated successfully'))
                if (updateResult[2]?.version) {
                    console.log(`\tVersion: ${updateResult[2].version}`)
                }
                return updateResult
            } else {
                throw new Error(`Actions update failed: ${updateResult[1]}`)
            }
        } else if (myEnv.operations.actionsOperation === 'reinstall') {
            console.log('\nReinstalling GitHub Actions from scratch ...')
            console.log('\tThis will remove existing workflows and install fresh ones.')
            // For initial setup with reinstall, we already got confirmation in the prompt above
            // But provide one final confirmation for this destructive operation
            const confirmed = await wizardUtils.operationOrNot(
                'Final confirmation: This will delete all existing workflows and actions, then reinstall them. Continue?'
            )
            
            if (!confirmed) {
                cliUtils.logError('Actions reinstallation cancelled by user')
                return { cancelled: true, reason: 'User cancelled destructive operation' }
            }
            
            process.stdout.write(cliUtils.formatBlue(`Reinstalling GitHub Actions from scratch ... `))
            // Delete existing actions first (if the method exists)
            try {
                await actionsCtl.deleteActions()
            } catch (deleteError) {
                console.warn(cliUtils.formatWarning('Could not delete existing actions, proceeding with installation'))
            }
            const installResult = await actionsCtl.installActions()
            if (installResult[0]) {
                console.log(cliUtils.formatSuccess('GitHub Actions reinstalled successfully'))
                if (installResult[2]?.version) {
                    console.log(`\tVersion: ${installResult[2].version}`)
                }
                if (installResult[2]?.workflows) {
                    console.log(`\tWorkflows: ${installResult[2].workflows.length} installed`)
                }
                return installResult
            } else {
                throw new Error(`Actions installation failed: ${installResult[1]}`)
            }
        } else {
            // Default installation - using Actions controller
            process.stdout.write(cliUtils.formatBlue(`\tInstalling actions and workflows ... `))
            
            // Use the Actions controller to install actions (proper installation method)
            try {
                const installResult = await actionsCtl.installActions()
                if (installResult[0]) {
                    console.log(cliUtils.formatGreen('GitHub Actions installed successfully'))
                    if (installResult[2]?.version) {
                        console.log(`\tVersion: ${installResult[2].version}`)
                    }
                    return installResult
                } else {
                    throw new Error(`Actions installation failed: ${installResult[1]}`)
                }
            } catch (error) {
                logger.error('Actions installation failed', {
                    organization: myEnv.GitHub.org,
                    error: error.message,
                    stack: error.stack
                })
                throw new Error(`Actions installation failed: ${error.message}`)
            }
        }
    })
} else {
    cliUtils.printStep('Step 5 -> Installing GitHub Actions')
    console.log(cliUtils.formatYellow('\tSkipping GitHub Actions installation (user choice)'))
}
cliOutput.printLine()
/* ---------- End Install actions ---------- */
/* ----------------------------------------- */

/* ----------------------------------------- */
/* ---- Begin initial objects creation ----- */

cliUtils.printStep('Step 6 -> Creating initial companies')

const companyCreationResult = await safeOperation('Initial Company Creation', async () => {
    // Create the owning company
    console.log(cliUtils.formatBlue('\tCreating your owning company'))
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
    if (!owningCompanyResp[0]) {
        throw new Error(`Failed to create owning company: ${owningCompanyResp[1]}`)
    }
    let owningCompany = owningCompanyResp[2]

    // Create the first company
    console.log(cliUtils.formatBlue('\tCreating the first company'))
    // Reset company user name to user name set in the company wizard
    myEnv.company = 'Unknown'
    const firstComp = new AddCompany(
        myEnv,
        {github: gitHubCtl, interaction: null, company: companyCtl, user: userCtl}, 
        myEnv.DEFAULT.company_dns
    )
    
    let firstCompanyResp = await firstComp.wizard(false, false)
    if (!firstCompanyResp[0]) {
        throw new Error(`Failed to create first company: ${firstCompanyResp[1]}`)
    }
    const firstCompany = firstCompanyResp[2]

    // Validate company data before saving
    const companiesToCreate = [owningCompany, firstCompany]
    const [isValid, validationErrors, validCompanies] = setupWizard.validateCompanyData(companiesToCreate)
    
    if (!isValid) {
        console.error(cliUtils.formatError('Company data validation failed:'))
        validationErrors.forEach(error => console.error(`   ${error}`))
        throw new Error('Company data validation failed')
    }

    // Confirm company creation with user
    const confirmed = await setupWizard.confirmCompanyCreation(validCompanies, 'Initial')
    if (!confirmed) {
        console.log(cliUtils.formatYellow('Company creation cancelled by user'))
        console.log(cliUtils.formatYellow('Setup will complete without creating initial companies'))
        console.log(cliUtils.formatBlue('You can create companies later using: mrcli company --add_wizard'))
        return { cancelled: true, reason: 'User cancelled company creation' }
    }

    // Save the companies to GitHub using enhanced method
    console.log(cliUtils.formatBlue('Saving companies to GitHub with transaction safety ...'))
    const success = await createCompaniesWithSafety(companyCtl, validCompanies, 'initial companies')
    
    if (!success) {
        throw new Error('Failed to save companies to GitHub')
    }

    return success
})

cliOutput.printLine()

/* ------ End initial objects creation ----- */
/* ----------------------------------------- */

// Companies output - only try to fetch if companies were actually created
let results = null
let companiesCreated = false

if (companyCreationResult && !companyCreationResult.cancelled) {
    console.log(cliUtils.formatBlue(`Fetching and listing created companies:`))
    results = await companyCtl.getAll()
    if (results[0]) {
        cliOutput.outputCLI(results[2].mrJson)
        companiesCreated = true
    } else {
        logger.error('Failed to fetch final company list', {
            error: results[1]
        })
        console.error(cliUtils.formatError('Failed to fetch final company list'))
    }
} else {
    console.log(cliUtils.formatYellow('Skipping company listing (no companies were created)'))
    companiesCreated = false
}
cliOutput.printLine()

// Calculate total setup duration
const totalDuration = Date.now() - setupStartTime

// Print comprehensive setup summary with logging
console.log(cliUtils.formatGreen('Mediumroast for GitHub setup completed successfully.\n'))

const setupSummary = {
    organization: myEnv.GitHub.org,
    repositoryCreated: myEnv.operations.createRepository,
    containersCreated: myEnv.operations.setupContainers,
    actionsInstalled: myEnv.operations.installActions,
    actionsOperation: myEnv.operations.actionsOperation,
    companiesCreated: companiesCreated && results && results[0] ? results[2].mrJson.length : 0,
    configurationFile: defaultConfigFile,
    theme: myEnv.DEFAULT.theme,
    totalDuration: totalDuration,
    timestamp: new Date().toISOString()
}

logger.debug('Mediumroast setup completed successfully', setupSummary)

console.log(cliUtils.formatBlue('Setup Summary:'))

// Create a formatted table for the setup summary - consistent with output.js styling
const setupTable = new Table({
    head: ['Component', 'Status'],
    colWidths: [30, 40]
})

setupTable.push(
    ['Organization', myEnv.GitHub.org],
    ['Repository', myEnv.operations.createRepository ? chalk.green('Created') : chalk.yellow('Skipped')],
    ['Containers', myEnv.operations.setupContainers ? chalk.green('Created') : chalk.yellow('Skipped')],
    ['GitHub Actions', myEnv.operations.installActions ? chalk.green(`${myEnv.operations.actionsOperation || 'Installed'}`) : chalk.yellow('Skipped')],
    ['Companies Created', companiesCreated && results && results[0] ? chalk.green(results[2].mrJson.length) : (companyCreationResult?.cancelled ? chalk.yellow('Cancelled') : chalk.red('0'))],
    ['Configuration File', defaultConfigFile],
    ['Theme', myEnv.DEFAULT.theme],
    ['Setup Duration', `${Math.round(totalDuration / 1000)}s`]
)

console.log(setupTable.toString())

cliOutput.printLine()

// Print out the next steps
printNextSteps()

// Finalize logging
setupTracker.end()
logger.debug('Mediumroast setup utility completed', {
    finalDuration: totalDuration,
    success: true
})

/**
 * Enhanced company creation workflow with transaction safety and comprehensive logging
 * @param {Companies} companiesCtl - The Companies controller instance
 * @param {Array} companiesToCreate - Array of company objects to create
 * @param {string} operationDescription - Description for logging purposes
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function createCompaniesWithSafety(companiesCtl, companiesToCreate, operationDescription) {
    const tracker = logger.trackOperation('createCompaniesWithSafety', 'mrcli-setup')
    
    try {
        process.stdout.write(`\tCreating ${companiesToCreate.length} companies with transaction safety ... `)
        
        // Use the createObj method which handles the full catch/write/release workflow
        const createResult = await companiesCtl.createObj(companiesToCreate)
        
        if (createResult[0]) {
            
            // Verify creation by listing the companies
            const verifyResult = await companiesCtl.getAll()
            if (verifyResult[0]) {
                const allCompanies = verifyResult[2].mrJson
                const createdNames = companiesToCreate.map(c => c.name)
                const verified = createdNames.every(name => 
                    allCompanies.some(company => company.name === name)
                )
                
                if (verified) {
                    cliUtils.formatGreen(`All ${companiesToCreate.length} companies created successfully and verified.`)
                } else {
                    logger.warn('Company creation verification failed', {
                        operation: operationDescription,
                        expectedCompanies: createdNames,
                        actualCompanies: allCompanies.map(c => c.name)
                    })
                    console.log(cliUtils.formatRed('Unable to verify all created companies.'))
                }
            }
            
            return true
        } else {                
            logger.error('Company creation failed', {
                    operation: operationDescription,
                    error: createResult[1]?.status_msg || createResult[1],
                    companyCount: companiesToCreate.length
                })
            console.log(cliUtils.formatRed(`${operationDescription} creation failed`))
            return false
        }
    } catch (error) {
        logger.error('Company creation error', {
            operation: operationDescription,
            error: error.message,
            stack: error.stack,
            companyCount: companiesToCreate.length
        })
        console.log(cliUtils.formatRed(`${operationDescription} creation error: ${error.message}`))
        return false
    } finally {
        tracker.end()
    }
}

/**
 * Open GitHub App installation URL in browser or display link
 * @param {string} orgName - Organization name for the installation URL
 * @returns {Promise<void>}
 */
async function openGitHubAppInstallation(orgName) {
    const installUrl = `https://github.com/marketplace/mediumroast-for-github`
    const orgInstallUrl = `https://github.com/apps/mediumroast-for-github/installations/new?target_id=${orgName}`
    
    logger.info('Attempting to open GitHub App installation URL', {
        organization: orgName,
        installUrl: installUrl
    })
    
    console.log('\nOpening GitHub App installation page...')
    
    try {
        // Try to use the 'open' command (available on macOS and many Linux systems)
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        
        // Detect platform and use appropriate command
        const platform = process.platform
        let openCommand
        
        if (platform === 'darwin') {
            // macOS
            openCommand = `open "${installUrl}"`
        } else if (platform === 'linux') {
            // Linux
            openCommand = `xdg-open "${installUrl}"`
        } else if (platform === 'win32') {
            // Windows
            openCommand = `start "" "${installUrl}"`
        }
        
        if (openCommand) {
            await execAsync(openCommand)
            cliUtils.logSuccess('GitHub App installation page opened in your default browser')
            logger.debug('Successfully opened GitHub App installation URL', {
                organization: orgName,
                platform: platform,
                command: openCommand
            })
        } else {
            throw new Error('Unsupported platform for auto-opening browser')
        }
    } catch (error) {
        // Fallback: display the URL
        logger.debug('Failed to auto-open browser, displaying URL', {
            error: error.message,
            organization: orgName
        })
        
        console.log('Please manually open this URL to install the GitHub App:')
        console.log(`\t${cliUtils.formatBlue.underline(installUrl)}`)
        console.log('\nAfter installation, press Enter to continue...')
        
        // Wait for user to press Enter
        await new Promise((resolve) => {
            process.stdin.once('data', resolve)
        })
    }
}

/**
 * Enhanced repository and GitHub Actions availability check
 * @param {GitHubFunctions} github - GitHub functions instance
 * @param {string} repoName - Repository name to check
 * @returns {Promise<Object>} - Object containing repository and actions status
 */
async function checkRepositoryAndActions(github, repoName) {
    const operationTracker = logger.trackOperation('repository-actions-check', 'mrcli-setup')
    
    try {
        logger.debug('Checking repository and Actions availability', { 
            repository: repoName,
            organization: github.orgName
        })
        process.stdout.write(cliUtils.formatBlue('\tChecking repository and Actions availability ... '))
        
        const status = {
            repository: { exists: false, error: null },
            actions: { enabled: false, error: null, workflows: [] }
        }

        // Check if repository exists
        const repoResult = await github.getRepoSize()
        if (repoResult[0]) {
            status.repository.exists = true
            logger.info('Repository verified', { 
                repository: repoName,
                size: repoResult[2] 
            })
            console.log(cliUtils.formatGreen('Repository exists and is verified'))
            
            // Check if Actions are enabled by trying to get workflows
            process.stdout.write(cliUtils.formatBlue('\tChecking if actions are enabled ... '))
            try {
                // Create Actions controller to check workflows (same pattern as mrcli-actions.js)
                const tempActionsCtl = new Actions(github.token, github.orgName, 'mrcli-setup-check')
                const versionResult = await tempActionsCtl.getCurrentVersion()
                
                if (versionResult[0] && versionResult[2]?.installed) {
                    status.actions.enabled = true
                    status.actions.version = versionResult[2].version_file?.content?.version || 'Unknown'
                    logger.info('GitHub Actions enabled', { 
                        repository: repoName,
                        version: status.actions.version
                    })
                    console.log(cliUtils.formatGreen(`GitHub Actions are enabled (version: ${status.actions.version})`))
                } else {
                    // Fallback: try to check actions via basic API call
                    try {
                        const basicActionsCheck = await github.getContent('.github/workflows')
                        if (basicActionsCheck[0]) {
                            status.actions.enabled = true
                            logger.debug('GitHub Actions workflows directory found', { repository: repoName })
                            console.log('GitHub Actions workflows directory exists')
                        } else {
                            console.log(cliUtils.formatYellow('No workflows directory found, creating during setup'))
                        }
                    } catch (workflowDirError) {
                        logger.debug('No workflows directory found', { 
                            repository: repoName,
                            error: workflowDirError.message 
                        })
                        console.log(cliUtils.formatYellow('No workflows directory found, creating during setup'))
                    }
                }
            } catch (actionsError) {
                status.actions.error = actionsError.message
                logger.error('Cannot access Actions', {
                    repository: repoName,
                    error: actionsError.message
                })
                console.log(cliUtils.formatRed('Cannot access Actions - may be disabled'))
            }
        } else {
            status.repository.error = 'Repository not found'
            logger.warn('Repository not found', { 
                repository: repoName,
                error: repoResult[1]
            })
            console.log('INFO: Repository does not exist (will be created during setup)')
        }
        
        return status
        
    } catch (repoError) {
        logger.error('Repository access check failed', {
            repository: repoName,
            error: repoError.message
        })
        console.log(cliUtils.formatRed('Cannot access repository'))
        return {
            repository: { exists: false, error: repoError.message },
            actions: { enabled: false, error: null, workflows: [] }
        }
    } finally {
        operationTracker.end()
    }
}

