#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to report on and update Mediumroast for GitHub Actions/Workflows 
 * @license Apache-2.0
 * @version 1.1.1
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-actions.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import { Actions } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import ora from "ora"
import chalk from 'chalk'
import { GitHubAuth } from '../src/api/authorize.js'

// Related object type
const objectType = 'Actions'

// Environmentals object
const environment = new Environmentals(
   '1.1.1',
   `${objectType}`,
   `A CLI utility to report on an update GitHub Actions/Workflows Mediumroast for GitHub`,
   objectType
)

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/


/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

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
   .option('-u, --update', 'Update actions and workflows from Mediumroast for GitHub package')
   .option('-b, --billing', 'Return all actions billing information for the GitHub organization')

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
const processName = 'mrcli-actions'

// Construct the controller objects
const actionsCtl = new Actions(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.update) {
   let spinner = ora(chalk.bold.blue('Updating actions and workflows on GitHub ... '))
   spinner.start() // Start the spinner
   const updates = await actionsCtl.updateActions()
   spinner.stop() // Stop the spinner
   if (updates[0]) {
      console.log(`SUCCESS: A total of [${updates[2].total}] actions and workflows updated successfully.`)
      process.exit(0)
   } else {
      console.log(`ERROR: Installing actions and workflows failed.\nTotal attempted: [${updates[2].total}] -> total failed: ${updates[2].failCount}; total successul: ${updates[2].successCount}.\nError message: ${updates[1].status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.billing) {
   [success, stat, results] = await actionsCtl.getActionsBilling()
   const myUserOutput = new CLIOutput(myEnv, 'ActionsBilling')
   myUserOutput.outputCLI([results], myArgs.output)
   process.exit()
} else {
   [success, stat, results] = await actionsCtl.getAll()
   const myUserOutput = new CLIOutput(myEnv, 'Workflows')
   myUserOutput.outputCLI(results, myArgs.output)
   process.exit()
}

