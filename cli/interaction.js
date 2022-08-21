#!/usr/bin/env node

// Import required modules
import { Auth, Interactions } from '../src/api/mrServer.js'
import { CLI } from '../src/helpers.js'

// Globals
const objectType = 'Interactions'

// Construct the CLI object
const myCLI = new CLI (
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

// Predefine the results variable
let results = null

// Process the cli options
if (myArgs.get_by_id) {
   results = await apiController.getById(myArgs.get_by_id)
} else if (myArgs.get_by_name) {
   results = await apiController.getByName(myArgs.get_by_name)
} else if (myArgs.get_by_x) {
   // TODO this requires a JSON input, need to investigate
   results = await apiController.getByX(myArgs.get_by_x)
} else if (myArgs.create) {
   results = await apiController.create(myArgs.create)
} else if (myArgs.delete) {
   results = await apiController.delete(myArgs.delete)
} else {
   results = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)