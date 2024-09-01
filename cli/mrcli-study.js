#!/usr/bin/env node

/**
 * @fileoverview A CLI utility to manage and report on Mediumroast for GitHub Study objects
 * @license Apache-2.0
 * @version 3.0.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-study.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 */


// Import required modules
import { Studies } from '../src/api/gitHubServer.js'
// NOTE: When we have a study wizard, we will need to import it here
// import AddStudy from '../src/cli/studyWizard.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import chalk from 'chalk'

console.log(chalk.bold.yellow('NOTICE: Studies aren\'t supported in this release, exiting.'))
process.exit()

// Globals
const objectType = 'Studies'

// Construct the CLI object
const environment = new Environmentals (
   '3.0',
   `${objectType}`,
   `A CLI utility to manage and report on Mediumroast for GitHub Study objects`,
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
   [success, stat, results] = await studyCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
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