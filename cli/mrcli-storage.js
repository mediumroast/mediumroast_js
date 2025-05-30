#!/usr/bin/env node

/**
 * 
 * @fileoverview A CLI utility to report on Mediumroast for GitHub Storage consumption
 * @license Apache-2.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-storage.js
 * @copyright 2025 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import { Storage, GitHubAuth } from 'mediumroast_api'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'

// Related object type
const objectType = 'Storage'

// Environmentals object
const environment = new Environmentals(
   '1.2.0',
   `${objectType}`,
   `A CLI utility to report on Mediumroast for GitHub Storage consumption`,
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
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--splash')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--persona')
myProgram
   .option('-c, --containers', 'Return storage statistics for all containers')

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

if (myArgs.containers) {
   const storageResults = await storageCtl.getAll();
   const myResults = storageResults[2].containers;
   
   // Transform the data into the required format
   const myOutput = Object.entries(myResults).map(([key, value]) => [
     key,
     value.objectCount,
     value.metadataSize_readable,
     value.size_readable,
     value.lastUpdated
   ])
   
   const storageOutput = new CLIOutput(myEnv, 'StorageContainers');
   storageOutput.outputCLI(myOutput, myArgs.output);
   process.exit();
} else {
   const storageResults = await storageCtl.getAll()
   const myResults = storageResults[2]
   const myOutput = [
      myResults.organization,
      myResults.plan,
      myResults.billing_cycle_days_left,
      myResults.total_space_readable,
      myResults.consumed_space_readable,
      myResults.remaining_space_readable,
      myResults.remaining_percentage
   ]
   const storageOutput = new CLIOutput(myEnv, 'Storage')
   storageOutput.outputCLI(myOutput, myArgs.output)
   process.exit()
}

