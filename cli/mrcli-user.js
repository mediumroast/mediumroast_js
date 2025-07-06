#!/usr/bin/env node

/**
 * 
 * @fileoverview A CLI utility to report on Mediumroast for GitHub Storage authorized users
 * @license Apache-2.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mrcli-user.js
 * @copyright 2025 Mediumroast, Inc. All rights reserved.
 * 
 */

// Import required modules
import { Users, GitHubAuth } from 'mediumroast_api'
// import { Users } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
// import { GitHubAuth } from '../src/api/authorize.js'

// Related object type
const objectType = 'Users'

// Environmentals object
const environment = new Environmentals(
   '2.2.0',
   `${objectType}`,
   `A CLI utility to report on Mediumroast for GitHub Storage authorized users`,
   objectType
)

// Create the environmental settings
let myProgram = environment.parseCLIArgs(true)
myProgram
   .option('-m, --my_user', 'Return information about me')

// Remove command line options for reset_by_type, delete, update, and add_wizard by calling the removeArgByName method in the environmentals class
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--add_wizard')
myProgram = environment.removeArgByName(myProgram, '--reset_by_name')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--find_by_id')
myProgram = environment.removeArgByName(myProgram, '--find_by_x')
myProgram = environment.removeArgByName(myProgram, '--find_by_name')
myProgram = environment.removeArgByName(myProgram, '--splash')
myProgram = environment.removeArgByName(myProgram, '--persona')
myProgram = environment.removeArgByName(myProgram, '--update')

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
const processName = 'mrcli-user'

// Output object
const output = new CLIOutput(myEnv, objectType)

// Construct the controller objects
const userCtl = new Users(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

if (myArgs.my_user) {
   const userResults = await userCtl.getAuthenticatedUser()
   const myResults = [userResults[2]]
   const userOutput = new CLIOutput(myEnv, 'MyUser')
   userOutput.outputCLI(myResults, myArgs.output)
   process.exit()
} else {
   [success, stat, results] = await userCtl.getAll()
}

// Emit the output
output.outputCLI(results, myArgs.output)

