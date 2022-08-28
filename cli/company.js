#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io company objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file company.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import { Auth, Companies } from '../src/api/mrServer.js'
import { CLI } from '../src/helpers.js'

// Globals
const objectType = 'Companies'

// Construct the CLI object
const myCLI = new CLI (
   '2.0',
   'company',
   'Command line interface for mediumroast.io Company objects.',
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
const apiController = new Companies(myCredential)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
if (myArgs.find_by_id) {
   [success, stat, results] = await apiController.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   [success, stat, results] = await apiController.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   const myCLIObj = JSON.parse(myArgs.find_by_x)
   const toFind = Object.entries(myCLIObj)[0]
   [success, stat, results] = await apiController.findByX(toFind[0], toFind[1])
} else if (myArgs.create) {
   const [success, msg, rawData] = myCLI.readTextFile(myArgs.create)
   if (success) {
      const jsonData = JSON.parse(rawData)
      const toRegister = jsonData.map(async element => {
         const [success, stat, resp] = await apiController.createObj(element)
         if (await stat.status_code == 200) {
            console.log(`SUCCESS: Created new [${objectType}] object in the mediumroast.io backend.`)
         } else {
            console.error('ERROR (%d): ' + stat.status_msg, stat.status_code)
         }
      })
      const registered = await Promise.all(toRegister)
      console.log(`SUCCESS: Loaded [${jsonData.length}] objects from file [${myArgs.create}].`)
      process.exit(0)
   } else {
      console.error("ERROR (%d): " + msg, -1)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   console.error('ERROR (%d): Delete not implemented on the backend.', -1)
   process.exit(-1)
   //results = await apiController.delete(myArgs.delete)
} else {
   [success, stat, results] = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)