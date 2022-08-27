#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io study objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file study.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import { Auth, Studies } from '../src/api/mrServer.js'
import { CLI } from '../src/helpers.js'

// Globals
const objectType = 'Studies'

// Construct the CLI object
const myCLI = new CLI (
   '2.0',
   'study',
   'Command line interface for mediumroast.io Study objects.',
   objectType
)

// Create the environmental settings
const myArgs = myCLI.parseCLIArgs()
const myConfig = myCLI.getConfig(myArgs.conf_file)
const myEnv = myCLI.getEnv(myArgs, myConfig)

// Generate the credential & construct the API Controller
const myAuth = new Auth(
   myEnv.restServer,
   myEnv.apiKey,
   myEnv.user,
   myEnv.secret
)
const myCredential = myAuth.login()
const apiController = new Studies(myCredential)

// Predefine the results variable
let results = null

// Process the cli options
if (myArgs.find_by_id) {
   results = await apiController.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   results = await apiController.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   const myCLIObj = JSON.parse(myArgs.find_by_x)
   const toFind = Object.entries(myCLIObj)[0]
   results = await apiController.findByX(toFind[0], toFind[1])
} else if (myArgs.create) {
   results = await apiController.createObj(myArgs.create)
} else if (myArgs.delete) {
   console.error('ERROR (%d): Delete not implemented on the backend.', -1)
   process.exit(-1)
   //results = await apiController.delete(myArgs.delete)
} else {
   results = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)