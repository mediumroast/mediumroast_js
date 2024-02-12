#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io user objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file billing.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @verstion 2.0.0
 */

// Import required modules
import { Billings } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import chalk from 'chalk'

// Related object type
const objectType = 'Billings'

// Environmentals object
const environment = new Environmentals(
   '2.0',
   `${objectType}`,
   `Command line interface to report on consumed units of GitHub actions and storage.`,
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
myProgram
   .option('-s, --storage', 'Return all storage billing information for the GitHub organization')
   .option('-a, --actions', 'Return all actions billing information for the GitHub organization')

// Remove command line options for reset_by_type, delete, update, and add_wizard by calling the removeArgByName method in the environmentals class
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--add_wizard')
myProgram = environment.removeArgByName(myProgram, '--reset_by_type')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--find_by_name')
myProgram = environment.removeArgByName(myProgram, '--find_by_x')
myProgram = environment.removeArgByName(myProgram, '--find_by_id')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--splash')

// Parse the command line arguments into myArgs and obtain the options
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
const accessToken = await environment.verifyAccessToken()
const processName = 'mrcli-billing'

// Output object
const output = new CLIOutput(myEnv, objectType)

// Construct the controller objects
const billingsCtl = new Billings(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.actions) {
   [success, stat, results] = await billingsCtl.getActionsBilling()
   const myUserOutput = new CLIOutput(myEnv, 'ActionsBilling')
   myUserOutput.outputCLI([results], myArgs.output)
   process.exit()
} else if (myArgs.storage) {
    [success, stat, results] = await billingsCtl.getStorageBilling()
    const myUserOutput = new CLIOutput(myEnv, 'StorageBilling')
    myUserOutput.outputCLI([results], myArgs.output)
    process.exit()
} else {
   [success, stat, results] = await billingsCtl.getAll()
   const myUserOutput = new CLIOutput(myEnv, 'AllBilling')
   myUserOutput.outputCLI(results, myArgs.output)
   process.exit()
}

