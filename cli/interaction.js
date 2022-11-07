#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io interaction objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactions.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import { Auth, Interactions, Companies, Studies } from '../src/api/mrServer.js'
import { CLIUtilities } from '../src/cli.js'
import { Utilities } from '../src/helpers.js'
import { InteractionStandalone } from '../src/report/interactions.js'
import { AddInteraction } from '../src/cli/interactionWizard.js'

// Globals
const objectType = 'interaction'

// Construct the CLI object
const myCLI = new CLIUtilities(
   '2.0',
   'interaction',
   'Command line interface for mediumroast.io Interaction objects.',
   objectType
)
const utils = new Utilities(objectType)

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
const studyController = new Studies(myCredential)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
if (myArgs.report) {
   // Retrive the interaction by Id
   const [int_success, int_stat, int_results] = await apiController.findById(myArgs.report)
   // Retrive the company by Name
   const companyName = Object.keys(int_results[0].linked_companies)[0]
   const [comp_success, comp_stat, comp_results] = await companyController.findByName(companyName)
   // Set the root name to be used for file and directory names in case of packaging
   const baseName = int_results[0].name.replace(/ /g,"_")
   // Set the directory name for the package
   const baseDir = myEnv.workDir + '/' + baseName
   // Define location and name of the report output, depending upon the package switch this will change
   let fileName = process.env.HOME + '/Documents/' + int_results[0].name.replace(/ /g,"_") + '.docx'
   
   // Set up the document controller
   const docController = new InteractionStandalone(
      int_results[0], // Interaction to report on
      comp_results[0], // The company associated to the interaction
      'mediumroast.io barrista robot', // The author
      'Mediumroast, Inc.' // The authoring company/org
   )

   
   if(myArgs.package) {
      // Create the working directory
      const [dir_success, dir_msg, dir_res] = utils.safeMakedir(baseDir + '/interactions')
      
      // If the directory creations was successful download the interaction
      if(dir_success) {
         fileName = baseDir + '/' + baseName + '_report.docx'
         /* 
         TODO the below only assumes we're storing data in S3, this is intentionally naive.
             In the future we will need to be led by the URL string to determine where and what
             to download from.  Today we only support S3, but this could be Sharepoint, 
             a local file system, OneDrive, GDrive, etc.  There might be an initial less naive
             implementation that looks at OneDrive, GDrive, DropBox, etc. as local file system
             access points, but the tradeoff would be that caffeine would need to run on a
             system with file system access to these objects.
         */
         await utils.s3DownloadObjs(int_results, myEnv, baseDir + '/interactions')
      // Else error out and exit
      } else {
         console.error('ERROR (%d): ' + dir_msg, -1)
         process.exit(-1)
      }

   }
   // Create the document
   const [report_success, report_stat, report_result] = await docController.makeDOCX(fileName, myArgs.package)

   // Create the package and cleanup as needed
   if (myArgs.package) {
      const [package_success, package_stat, package_result] = await utils.createZIPArchive(
         myEnv.outputDir + '/' + baseName + '.zip',
         baseDir
      )
      if (package_success) {
         console.log(package_stat)
         utils.rmDir(baseDir)
         process.exit(0)
      } else {
         console.error(package_stat, -1)
         process.exit(-1)
      }

   }

   // This is the fallback case if we were just creating the report
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
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const [success, stat, resp] = await apiController.updateObj(myCLIObj)
   if(success) {
      console.log(`SUCCESS: processed update to interaction object.`)
      process.exit(0)
   } else {
      console.error('ERROR (%d): Unable to update interaction object.', -1)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   // Delete an object
   console.error('ERROR (%d): Delete not implemented on the backend.', -1)
   process.exit(-1)
   //results = await apiController.delete(myArgs.delete)
} else if (myArgs.add_wizard) {
   // pass in credential, apiController, etc.
   const myApiCtl = {
      interaction: apiController,
      company: companyController,
      study: studyController
   }
   const newInteraction = new AddInteraction(myEnv, myApiCtl, myCredential, myCLI)
   const result = await newInteraction.wizard()
   if(result[0]) {
      console.log('SUCCESS: Created new interaction in the backend')
      process.exit(0)
   } else {
      console.error('ERROR: Failed to create interaction object with %d', result[1].status_code)
      process.exit(-1)
   }
} else {
   // Get all objects
   [success, stat, results] = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)