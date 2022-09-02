#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io interaction objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactions.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import { Auth, Interactions, Companies } from '../src/api/mrServer.js'
import { CLI } from '../src/helpers.js'
import { Standalone } from '../src/report/interactions.js'

// Globals
const objectType = 'Interactions'

// Construct the CLI object
const myCLI = new CLI(
   '2.0',
   'interaction',
   'Command line interface for mediumroast.io Interaction objects.',
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
const apiController = new Interactions(myCredential)
const companyController = new Companies(myCredential)

// Predefine the results variable
let [success, stat, results] = [null, null, null]




// Process the cli options
if (myArgs.report) {
   // Retrive the interaction by Id
   const [int_success, int_stat, int_results] = await apiController.findById(myArgs.report)
   // Retrive the company by Name
   const companyName = Object.keys(int_results[0].linked_companies)[0]
   const [comp_success, comp_stat, comp_results] = await companyController.findByName(companyName)
   // Set up the document controller
   const docController = new Standalone (int_results[0], comp_results[0], 'mediumroast.io barrista robot', 'Mediumroast, Inc.')
   // Create the document
   const [report_success,report_stat, report_result] = await docController.makeDocx()
   if (report_success) {
      console.log(report_stat)
      process.exit(0)
   } else {
      console.error(report_stat, -1)
      process.exit(-1)
   }
} else if (myArgs.find_by_id) {
   // Retrive the interaction by Id
   [success, stat, results] = await apiController.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   // Retrive the interaction by Name
   [success, stat, results] = await apiController.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   // Retrive the interaction by attribute as specified by X
   const myCLIObj = JSON.parse(myArgs.find_by_x)
   const toFind = Object.entries(myCLIObj)[0]
   [success, stat, results] = await apiController.findByX(toFind[0], toFind[1])
} else if (myArgs.create) {
   // Create objects as defined in a JSON file, see example_data/*.json for examples
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
   // Delete an object
   console.error('ERROR (%d): Delete not implemented on the backend.', -1)
   process.exit(-1)
   //results = await apiController.delete(myArgs.delete)
} else {
   // Get all objects
   [success, stat, results] = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)