#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io interaction objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactions.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 3.0.0
 */



// Import required modules
import { InteractionStandalone } from '../src/report/interactions.js'
import { Interactions, Companies, Studies, Users } from '../src/api/gitHubServer.js'
import GitHubFunctions from '../src/api/github.js'
import AddInteraction from '../src/cli/interactionWizard.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import ArchivePackage from '../src/cli/archive.js'
import ora from 'ora'
import WizardUtils from "../src/cli/commonWizard.js"

// Reset the status of objects for caffiene reprocessing
async function resetStatuses(interactionType, interactionCtl, objStatus=0) {
   let interactionResults = {successful: [], failed: []}
   const myInteractions = await interactionCtl.findByX('interaction_type', interactionType)
   if(myInteractions[0]) {
      for(const myInteraction in myInteractions[2]) {
         const myId = myInteractions[2][myInteraction].id
         const resetResults = await interactionCtl.updateObj({id: myId, status: objStatus})
         if(resetResults[0]){
            interactionResults.successful.push({id: myId, value: objStatus, success: resetResults[0]})
         } else {
            interactionResults.failed.push({id: myId, value: objStatus, success: resetResults[0]})
         }
      }
      return [
         true,
         {status_code: myInteractions[1].status_code, status_msg: myInteractions[1].status_msg},
         interactionResults
      ]
   } else {
      return [
         false,
         {status_code: myInteractions[1].status_code, status_msg: myInteractions[1].status_msg},
         null
      ]
   }
}


// Related object type
const objectType = 'Interactions'

// Environmentals object
const environment = new Environmentals(
   '3.0.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Filesystem object
const fileSystem = new FilesystemOperators()

// Create the environmental settings
const myArgs = environment.parseCLIArgs()
const myConfig = environment.readConfig(myArgs.conf_file)
const myEnv = environment.getEnv(myArgs, myConfig)
const accessToken = await environment.verifyAccessToken()
const processName = 'mrcli-interaction'

// Output object
const output = new CLIOutput(myEnv, objectType)

// Common wizard utilities
const wutils = new WizardUtils(objectType)

// Construct the controller objects
const companyCtl = new Companies(accessToken, myEnv.gitHubOrg, processName)
const interactionCtl = new Interactions(accessToken, myEnv.gitHubOrg, processName)
const gitHubCtl = new GitHubFunctions(accessToken, myEnv.gitHubOrg, processName)

// const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)
const userCtl = new Users(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let success = Boolean()
let stat = Object() || {}
let results = Array() || []

// Process the cli options
if (myArgs.report) {
   console.error('ERROR (%d): Report not implemented.', -1)
   process.exit(-1)
   // Retrive the interaction by Id
   const [int_success, int_stat, int_results] = await interactionCtl.findById(myArgs.report)
   // Retrive the company by Name
   const companyName = Object.keys(int_results[0].linked_companies)[0]
   const [comp_success, comp_stat, comp_results] = await companyCtl.findByName(companyName)
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
      const [dir_success, dir_msg, dir_res] = fileSystem.safeMakedir(baseDir + '/interactions')
      
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
         // await s3.s3DownloadObjs(int_results, baseDir + '/interactions', sourceBucket)
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
      const archiver = new ArchivePackage(myEnv.outputDir + '/' + baseName + '.zip')
      const [package_success, package_stat, package_result] = await archiver.createZIPArchive(baseDir)
      if (package_success) {
         console.log(package_stat)
         fileSystem.rmDir(baseDir)
         process.exit(0)
      } else {
         console.error(package_stat, -1)
         fileSystem.rmDir(baseDir)
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
   console.error('ERROR (%d): Find by name not implemented.', -1)
   process.exit(-1)
   // Retrive the interaction by Id
   [success, stat, results] = await interactionCtl.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   // Retrive the interaction by Name
   [success, stat, results] = await interactionCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   // Retrive the interaction by attribute as specified by X
   const [myKey, myValue] = Object.entries(JSON.parse(myArgs.find_by_x))[0]
   const foundObjects = await interactionCtl.findByX(myKey, myValue)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const mySpinner = new ora(`Updating interaction [${myCLIObj.name}] object ...`)
   mySpinner.start()
   const [success, stat, resp] = await interactionCtl.updateObj(myCLIObj)
   mySpinner.stop()
   if(success) {
      console.log(`SUCCESS: ${stat.status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${stat.status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   // Use operationOrNot to confirm the delete
   const deleteOrNot = await wutils.operationOrNot(`Preparing to delete the interaction [${myArgs.delete}], are you sure?`)
   if(!deleteOrNot) {
      console.log(`INFO: Delete of [${myArgs.delete}] cancelled.`)
      process.exit(0)
   }
   // Delete the object
   const mySpinner = new ora(`Deleting interaction [${myArgs.delete}] ...`)
   mySpinner.start()
   const [success, stat, resp] = await interactionCtl.deleteObj(myArgs.delete)
   mySpinner.stop()
   if(success) {
      console.log(`SUCCESS: ${stat.status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${stat.status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.add_wizard) {
   const newInteraction = new AddInteraction(myEnv, {github: gitHubCtl, interaction: interactionCtl, company: companyCtl, user: userCtl})
   const result = await newInteraction.wizard()
   if(result[0]) {
      console.log(`SUCCESS: Added new interaction object(s).`)
      process.exit(0)
   } else {
      console.log(`ERROR: Unable to add interaction object due to [${result[1].status_msg}].`)
      process.exit(-1)
   }
} else if (myArgs.reset_by_type) {
   console.error('ERROR (%d): Reset by type not implemented.', -1)
   process.exit(-1)
   const resetResponses = await resetStatuses(myArgs.reset_by_type, interactionCtl)
   if(resetResponses[0]) {
      console.log(`SUCCESS: Reset status of ${resetResponses[2].successful.length} interactions.`)
      process.exit(0)
   } else {
      console.error(`ERROR: Failed to reset statuses of interactions with type ${myArgs.reset_by_type} and error: %d`, resetResponses[1].status_code)
      process.exit(-1)
   }
} else {
   // Get all objects
   [success, stat, results] = await interactionCtl.getAll()
   results = results.mrJson
}

// Emit the output
output.outputCLI(results, myArgs.output)