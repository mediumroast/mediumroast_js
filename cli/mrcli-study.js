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
import { Interactions, Companies, Studies, Users } from '../src/api/gitHubServer.js'
import AddStudy from '../src/cli/studyWizard.js'
import GitHubFunctions from '../src/api/github.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import CLIUtilities from '../src/cli/common.js'
import ora from 'ora'
import { GitHubAuth } from '../src/api/authorize.js'

// Globals
const objectType = 'Studies'

// Construct the CLI object
const environment = new Environmentals (
   '3.0.0',
   `${objectType}`,
   `A CLI utility to manage and report on Mediumroast for GitHub Study objects`,
   objectType
)

// Read the command line switches
let myProgram = environment.parseCLIArgs(true)
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--persona')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--add_wizard')
myProgram.option('-i, --init_foundation', 'Initialize Foundation Study.')
// Parse the command line arguments
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

// Create the environmental settings
const myConfig = environment.readConfig(myArgs.conf_file)
const myEnv = environment.getEnv(myArgs, myConfig)
const myAuth = new GitHubAuth(myEnv, environment, myArgs.conf_file, true)
const verifiedToken = await myAuth.verifyAccessToken()
let accessToken = null
if (!verifiedToken[0]) {
   console.error(`ERROR: ${verifiedToken[1].status_msg}`)
   process.exit(-1)
} else {
   accessToken = verifiedToken[2].token
}
const processName = 'mrcli-study'

// Output object
const output = new CLIOutput(myEnv, objectType)

// CLI Utilities object
const cliUtils = new CLIUtilities()

// Construct the controller objects
const companyCtl = new Companies(accessToken, myEnv.gitHubOrg, processName)
const interactionCtl = new Interactions(accessToken, myEnv.gitHubOrg, processName)
const gitHubCtl = new GitHubFunctions(accessToken, myEnv.gitHubOrg, processName)
const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)
const userCtl = new Users(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let success = Boolean()
let stat = Object() || {}
let results = Array() || []

// Process the cli options
if (myArgs.find_by_name) {
   [success, stat, results] = await studyCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   const myCLIObj = JSON.parse(myArgs.find_by_x)
   const toFind = Object.entries(myCLIObj)[0]
   [success, stat, results] = await studyCtl.findByX(toFind[0], toFind[1])
} else if (myArgs.delete) {
   console.error('ERROR (%d): Delete not implemented.', -1)
   process.exit(-1)
   //results = await studyCtl.delete(myArgs.delete)
} else if (myArgs.init_foundation) {
   // Check for a lock in the repository
   const lockResp = await studyCtl.checkForLock()
   if (lockResp[0]) {
      console.log(`ERROR: ${lockResp[1].status_msg}`)
      process.exit(-1)
   }
   // Get all objects
   const allObjects = await cliUtils.getAllObjects({
      companies: companyCtl, 
      interactions: interactionCtl, 
      studies: studyCtl, 
      users: userCtl,
   })
   const newStudy = new AddStudy(myEnv, { github: gitHubCtl, interaction: interactionCtl, company: companyCtl, user: userCtl, study: studyCtl }, allObjects[2])
   const result = await newStudy.wizard()
   if (result[0]) {
      console.log(`SUCCESS: ${result[1].status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${result[1].status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.rest_by_name) {
   console.error('ERROR (%d): Reset by name not implemented.', -1)
   process.exit(-1)
   //results = await studyCtl.delete(myArgs.delete)
} else {
   [success, stat, results] = await studyCtl.getAll()
   results = results.mrJson
}

// Emit the output
output.outputCLI(results, myArgs.output)