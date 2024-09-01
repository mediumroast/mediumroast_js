#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io user objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file user.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @verstion 2.0.0
 */

// Import required modules
import { Users } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import { GitHubAuth } from '../src/api/authorize.js'

// Related object type
const objectType = 'Users'

// Environmentals object
const environment = new Environmentals(
   '2.1.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
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
myProgram
   .option('-m, --my_user', 'Return information about me')

// Remove command line options for reset_by_type, delete, update, and add_wizard by calling the removeArgByName method in the environmentals class
myProgram = environment.removeArgByName(myProgram, '--delete')
myProgram = environment.removeArgByName(myProgram, '--update')
myProgram = environment.removeArgByName(myProgram, '--add_wizard')
myProgram = environment.removeArgByName(myProgram, '--reset_by_type')
myProgram = environment.removeArgByName(myProgram, '--report')
myProgram = environment.removeArgByName(myProgram, '--package')
myProgram = environment.removeArgByName(myProgram, '--find_by_id')
myProgram = environment.removeArgByName(myProgram, '--splash')

// Parse the command line arguments into myArgs and obtain the options
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
const myAuth = new GitHubAuth(myEnv, environment, myArgs.conf_file)
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
   [success, stat, results] = await userCtl.getMyself()
   const myUserOutput = new CLIOutput(myEnv, 'MyUser')
   myUserOutput.outputCLI([results], myArgs.output)
   process.exit()
} else if (myArgs.find_by_name) {
   const foundObjects = await userCtl.findByName(myArgs.find_by_name)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else if (myArgs.find_by_x) {
   const [myKey, myValue] = Object.entries(JSON.parse(myArgs.find_by_x))[0]
   const foundObjects = await userCtl.findByX(myKey, myValue)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else {
   [success, stat, results] = await userCtl.getAll()
}

// Emit the output
output.outputCLI(results, myArgs.output)

