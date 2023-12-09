#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io user objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file user.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @verstion 1.0.0
 */

console.log(chalk.bold.yellow('NOTICE: This CLI is presently a work in progress and will not operate, exiting.'))
process.exit(0)

// // TODO: This needs to be reimplemented using the right structure as the other CLIs
// console.log('NOTICE: This CLI is presently a work in progress and will not operate, exiting.')
// process.exit(0)

// Import required modules
import AddUser from '../src/cli/userWizard.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import { serverOperations } from '../src/cli/common.js'

// External modules
import chalk from 'chalk'

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



// Related object type
const objectType = 'user'

// Environmentals object
const environment = new Environmentals(
   '1.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Create the environmental settings
const myArgs = environment.parseCLIArgs()
const myConfig = environment.getConfig(myArgs.conf_file)
const myEnv = environment.getEnv(myArgs, myConfig)

// Output object
const output = new CLIOutput(myEnv, objectType)

// Common server ops and also check the server
const serverOps = new serverOperations(myEnv)
// Checking to see if the server is ready for operations
const serverReady = await serverOps.checkServer()
if(serverReady[0]) {
   console.log(
      chalk.red.bold(
         `No objects detected on your mediumroast.io server [${myEnv.restServer}].\n` +
         `Perhaps you should try to run mr_setup first to create the owning company, exiting.`
      )
   )
   process.exit(-1)
}

// Assign the controllers based upon the available server
const userCtl = serverReady[2].userCtl
const companyCtl = serverReady[2].companyCtl
const interactionCtl = serverReady[2].interactionCtl
const studyCtl = serverReady[2].studyCtl
const owningCompany = await serverOps.getOwningCompany(companyCtl)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.report) {
   console.error(`WARNING: CLI function not yet implemented for ${objectType} objects: %d`, -1)
   process.exit(-1)
} else if (myArgs.find_by_id) {
   [success, stat, results] = await userCtl.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   [success, stat, results] = await userCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   const [myKey, myValue] = Object.entries(JSON.parse(myArgs.find_by_x))[0]
   const foundObjects = await userCtl.findByX(myKey, myValue)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const [success, stat, resp] = await userCtl.updateObj(myCLIObj)
   if(success) {
      console.log(`SUCCESS: processed update to ${objectType} object.`)
      process.exit(0)
   } else {
      console.error(`ERROR (%d): Unable to update ${objectType} object.`, -1)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   console.error(`WARNING: CLI function not yet implemented for ${objectType} objects: %d`, -1)
   process.exit(-1)
   // Delete an object
   // TODO need to support functionlity related to users before this can be operable
   // const [success, stat, resp] = await companyCtl.deleteObj(myArgs.delete)
   // if(success) {
   //    console.log(`SUCCESS: deleted ${objectType} object.`)
   //    process.exit(0)
   // } else {
   //    console.error(`ERROR (%d): Unable to delete ${objectType} object.`, -1)
   //    process.exit(-1)
   // }
} else if (myArgs.add_wizard) {
   // TODO this should invite a user to mediumroast.io
   console.error(`WARNING: CLI function not yet implemented for ${objectType} objects: %d`, -1)
   process.exit(-1)
   // const newUser = new AddUser(myEnv, userCtl)
   // const result = await newUser.wizard()
   // if(result[0]) {
   //    console.log(`SUCCESS: Created new ${objectType}.`)
   //    process.exit(0)
   // } else {
   //    console.error(`ERROR: Failed to create ${objectType} object with %d`, result[1].status_code)
   //    process.exit(-1)
   // }
} else if (myArgs.reset_by_type) {
   console.error(`WARNING: CLI function not supported for ${objectType} objects: %d`, -1)
   process.exit(-1)
} else {
   [success, stat, results] = await userCtl.getAll()
}

// Emit the output
output.outputCLI(results, myArgs.output)

