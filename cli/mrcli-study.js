#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io study objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file study.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @verstion 3.0.0
 */


// Import required modules
import { Studies } from '../src/api/gitHubServer.js'
// NOTE: When we have a study wizard, we will need to import it here
// import AddStudy from '../src/cli/studyWizard.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'

// Globals
const objectType = 'Studies'

// Construct the CLI object
const environment = new Environmentals (
   '3.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Create the environmental settings
const myArgs = environment.parseCLIArgs()
const myConfig = environment.readConfig(myArgs.conf_file)
const myEnv = environment.getEnv(myArgs, myConfig)
const accessToken = await environment.verifyAccessToken()
const processName = 'mrcli-study'

// Output object
const output = new CLIOutput(myEnv, objectType)

// Construct the controller objects
const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
if (myArgs.find_by_id) {
   console.error('ERROR (%d): Find by id not implemented.', -1)
   process.exit(-1)
} else if (myArgs.find_by_name) {
   console.error('ERROR (%d): Find by name not yet implemented.', -1)
   process.exit(-1)
   [success, stat, results] = await studyCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   console.error('ERROR (%d): Find by X not yet implemented.', -1)
   process.exit(-1)
   const myCLIObj = JSON.parse(myArgs.find_by_x)
   const toFind = Object.entries(myCLIObj)[0]
   [success, stat, results] = await studyCtl.findByX(toFind[0], toFind[1])
} else if (myArgs.create) {
   console.error('ERROR (%d): Create not yet implemented.', -1)
   process.exit(-1)
   //results = await studyCtl.delete(myArgs.delete)
} else if (myArgs.delete) {
   console.error('ERROR (%d): Delete not implemented.', -1)
   process.exit(-1)
   //results = await studyCtl.delete(myArgs.delete)
} else {
   [success, stat, results] = await studyCtl.getAll()
   results = results.mrJson
}

// Emit the output
output.outputCLI(results, myArgs.output)