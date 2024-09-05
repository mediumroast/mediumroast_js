#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to report on Mediumroast for GitHub Storage consumption
 * @license Apache-2.0
 * @version 1.1.1
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-storage.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 */


// Import required modules
import { Storage } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import { GitHubAuth } from '../src/api/authorize.js'


// Related object type
const objectType = 'Storage'

// Environmentals object
const environment = new Environmentals(
   '1.1.1',
   `${objectType}`,
   `A CLI utility to report on Mediumroast for GitHub Storage consumption`,
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
myProgram = environment.removeArgByName(myProgram, '--reset_by_type')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--find_by_name')
myProgram = environment.removeArgByName(myProgram, '--find_by_x')
myProgram = environment.removeArgByName(myProgram, '--find_by_id')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--splash')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram
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
const processName = 'mrcli-storage'

// Construct the controller objects
const storageCtl = new Storage(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.billing) {
   [success, stat, results] = await storageCtl.getStorageBilling()
   const myUserOutput = new CLIOutput(myEnv, 'StorageBilling')
   myUserOutput.outputCLI([results], myArgs.output)
   process.exit()
} else {
   const storageResults = await storageCtl.getAll()
   const myUserOutput = new CLIOutput(myEnv, 'Storage')
   myUserOutput.outputCLI([storageResults[2]], myArgs.output)
   process.exit()
}

