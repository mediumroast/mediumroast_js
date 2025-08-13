#!/usr/bin/env node

/**
 * 
 * @fileoverview A CLI utility to report on and update Mediumroast for GitHub Actions/Workflows 
 * @license Apache-2.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-actions.js
 * @copyright 2025 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import { Actions, GitHubAuth } from 'mediumroast_api'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import ora from "ora"
import chalk from 'chalk'

// Related object type
const objectType = 'Actions'

// Environmentals object
const environment = new Environmentals(
   '2.0.0',
   `${objectType}`,
   `A CLI utility to report, install, delete and update Mediumroast for GitHub Actions/Workflows`,
   objectType
)

// Create the environmental settings
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
myProgram = environment.removeArgByName(myProgram, '--splash')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--persona')

myProgram
   .option('-u, --update', 'Update GitHub Actions workflows and files to the latest version')
   .option('-d, --delete [workflows...]', 'Delete GitHub Actions workflows (all or specific ones)')
   .option('-i, --install', 'Install actions and workflows from Mediumroast for GitHub')
   .option('-b, --billing', 'Return all actions billing information for the GitHub organization')
   .option('-c, --check', 'Check if updates are available for GitHub Actions')
   .option('-v, --version', 'Get current GitHub Actions installation version')
   .option('--debug', 'Enable debug mode for detailed logging of operations')

// Parse the command line arguments into myArgs and obtain the options
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
const myAuth = new GitHubAuth(myEnv, environment, myArgs.conf_file, true)
const verifiedToken = await myAuth.verifyAccessToken()
let accessToken = null
if (!verifiedToken[0]) {
   console.error(`ERROR: ${verifiedToken[1].status_msg}`)
   process.exit(-1)
} else {
   accessToken = verifiedToken[2].token
}

// Define debugMode before it's used
const debugMode = myArgs.debug || false

// Set environment variables needed by the API
// Always set MR4GH_TMP_DIR regardless of debug mode
process.env.MR4GH_TMP_DIR = myEnv.workDir + '/tmp';

// Set the log level based on debug mode
debugMode ? process.env.LOG_LEVEL = 'debug' : process.env.LOG_LEVEL = myEnv.logLevel || 'warn';

const processName = 'mrcli-actions'

// Construct the controller objects
const actionsCtl = new Actions(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.check) {
   // Check if updates are available
   let spinner = ora(chalk.bold.blue('Checking for GitHub Actions updates... '))
   spinner.start()
   const versionResult = await actionsCtl.getCurrentVersion()
   
   if (versionResult[0] && versionResult[2].installed) {
      const updateCheck = await actionsCtl.checkForUpdates()
      spinner.stop()
      
      if (updateCheck[0]) {
         if (updateCheck[2].update_available) {
            console.log(chalk.green(`Update available! Current version: ${updateCheck[2].current_version}, Latest version: ${updateCheck[2].latest_version}`))
            console.log(chalk.cyan(`Release notes: ${updateCheck[2].latest_release.body}`))
         } else {
            console.log(chalk.green(`Already on the latest version: ${updateCheck[2].current_version}`))
         }
      } else {
         console.error(chalk.red(`ERROR: Failed to check for updates: ${updateCheck[1].status_msg}`))
         process.exit(-1)
      }
   } else {
      spinner.stop()
      console.log(chalk.yellow('No GitHub Actions installation detected. Use the --install option to install.'))
   }
   process.exit(0)
   
} else if (myArgs.version) {
   // Get current version information
   let spinner = ora(chalk.bold.blue('Getting current installation details... '))
   spinner.start()
   const versionResult = await actionsCtl.getCurrentVersion()
   spinner.stop()
   
   if (versionResult[0] && versionResult[2].installed) {
      const versionInfo = versionResult[2].version_file.content
      console.log(chalk.bold.green(`Installed version: ${versionInfo.version}`))
      console.log(chalk.green(`Installation date: ${versionInfo.updated_at}`))
      
      // List installed workflows
      console.log(chalk.bold.cyan('\nInstalled workflows:'))
      versionResult[2].files.workflows.forEach(workflow => {
         console.log(`- ${workflow.name}`)
      })
   } else {
      console.log(chalk.yellow('No GitHub Actions installation detected. Use the --install option to install.'))
   }
   process.exit(0)
   
} else if (myArgs.update) {
   // First check if installation exists
   const versionResult = await actionsCtl.getCurrentVersion()
   
   if (!versionResult[0] || !versionResult[2].installed) {
      console.log(chalk.yellow('No installation detected. Use the --install option first.'))
      process.exit(0)
   }
   
   // Check if updates are available
   const updateCheck = await actionsCtl.checkForUpdates()
   if (updateCheck[0] && !updateCheck[2].update_available) {
      console.log(chalk.green(`Already on the latest version: ${updateCheck[2].current_version}. No update needed.`))
      process.exit(0)
   }
   
   // Perform the update
   let spinner = ora(chalk.bold.blue('Updating actions and workflows on GitHub... '))
   spinner.start()
   const updates = await actionsCtl.updateActions(debugMode)
   spinner.stop()
   
   if (updates[0]) {
      if (debugMode) {
         console.log('Update response:', JSON.stringify(updates[2], null, 2));
      }
      
      // Verify update by checking the current version
      const verifyUpdate = await actionsCtl.getCurrentVersion();
      
      if (verifyUpdate[0] && verifyUpdate[2].installed) {
         const newVersion = verifyUpdate[2].version_file.content.version;
         const previousVersion = updateCheck[2].current_version; // We already have this from the earlier check
         
         console.log(chalk.green(`SUCCESS: GitHub Actions workflows and files updated successfully!`));
         console.log(chalk.cyan(`Updated from version ${previousVersion} to ${newVersion}`));
      } else {
         console.log(chalk.green(`SUCCESS: GitHub Actions updated, but couldn't verify version.`));
      }
      process.exit(0)
   } else {
      console.log(chalk.red(`ERROR: Updating actions and workflows failed.\nTotal attempted: [${updates[2].total}] -> total failed: ${updates[2].failCount}; total successful: ${updates[2].successCount}.\nError message: ${updates[1].status_msg}`))
      process.exit(-1)
   }
   
} else if (myArgs.install) {
   // Check if already installed
   const versionResult = await actionsCtl.getCurrentVersion()
   
   if (versionResult[0] && versionResult[2].installed) {
      console.log(chalk.yellow(`GitHub Actions are already installed (version ${versionResult[2].version_file.content.version}). Use --update to update to the latest version.`))
      process.exit(0)
   }
   
   // Perform the installation
   let spinner = ora(chalk.bold.blue('Installing actions and workflows for Mediumroast for GitHub'))
   spinner.start()
   const installation = await actionsCtl.installActions(debugMode)
   spinner.stop()
   
   // Fix for the installation output
   if (installation[0]) {
      if (debugMode) {
         console.log('Installation response:', JSON.stringify(installation[2], null, 2));
      }
      
      // Verify installation by checking the current version
      const verifyInstall = await actionsCtl.getCurrentVersion();
      
      if (verifyInstall[0] && verifyInstall[2].installed) {
         const version = verifyInstall[2].version_file.content.version;
         console.log(chalk.green(`SUCCESS: GitHub Actions successfully installed! Version: ${version}`));
      } else {
         console.log(chalk.green(`SUCCESS: GitHub Actions installed, but couldn't verify version.`));
      }
      process.exit(0);
   } else {
      console.log(chalk.red(`ERROR: Installing actions and workflows failed.\nError message: ${installation[1].status_msg}`))
      if (installation[2] && installation[2].error) {
         console.error(chalk.red(`Error details: ${installation[2].error}`))
      }
      process.exit(-1)
   }
   
} else if (myArgs.delete) {
   // Check if anything is installed
   const versionResult = await actionsCtl.getCurrentVersion()
   
   if (!versionResult[0] || !versionResult[2].installed) {
      console.log(chalk.yellow('No GitHub Actions installation detected. Nothing to delete.'))
      process.exit(0)
   }
   
   // Determine if specific workflows or all
   const specificWorkflows = Array.isArray(myArgs.delete) && myArgs.delete.length > 0 ? myArgs.delete : null
   
   // Confirm deletion
   console.log(chalk.yellow(`WARNING: You are about to delete ${specificWorkflows ? 'specific' : 'all'} GitHub Actions workflows and action files.`))
   if (specificWorkflows) {
      console.log(chalk.yellow(`Workflows to delete: ${specificWorkflows.join(', ')}`))
   }
   
   // Perform the deletion - pass true as the second parameter to delete both workflows and actions
   let spinner = ora(chalk.bold.blue(`Deleting ${specificWorkflows ? 'specific' : 'all'} GitHub Actions workflows and action files... `))
   spinner.start()
   const deletion = await actionsCtl.deleteActions(specificWorkflows, true)
   spinner.stop()
   
   // Fix for the deletion output
   if (deletion[0]) {
      if (debugMode) {
         console.log('Deletion response:', JSON.stringify(deletion[2], null, 2));
      }
      
      console.log(chalk.green(`SUCCESS: GitHub Actions workflows and action files successfully deleted!`));
      process.exit(0)
   } else {
      console.log(chalk.red(`ERROR: Deleting actions and workflows failed.\nError message: ${deletion[1].status_msg}`))
      process.exit(-1)
   }
   
} else if (myArgs.billing) {
   // Existing billing code
   if (myEnv.authType === 'pat') {
      console.log(chalk.bold.yellow('NOTE:\tYou are using a Personal Access Token (PAT) for authentication.\n\tThis may not have sufficient permissions to retrieve billing information.\n\tIf you encounter issues, please ensure your PAT has the necessary scopes or use device flow.'))
   }
   [success, stat, results] = await actionsCtl.getActionsBilling()
   const myUserOutput = new CLIOutput(myEnv, 'ActionsBilling')
   myUserOutput.outputCLI(results, myArgs.output)
   process.exit()
   
} else {
   // Existing code for listing workflows
   [success, stat, results] = await actionsCtl.getAll()
   const myUserOutput = new CLIOutput(myEnv, 'Workflows')
   myUserOutput.outputCLI(results.workflowList, myArgs.output)
   process.exit()
}

