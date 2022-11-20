#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io company objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file company.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import { Auth, Companies, Interactions } from '../src/api/mrServer.js'
import { Utilities } from '../src/helpers.js'
import { CLIUtilities } from '../src/cli.js'
import { CompanyStandalone } from '../src/report/companies.js'
import { AddCompany } from '../src/cli/companyWizard.js'

// Globals
const objectType = 'company'

// Construct the CLI object
const myCLI = new CLIUtilities (
   '2.0',
   'company',
   'Command line interface for mediumroast.io Company objects.',
   objectType
)

// Construct the Utilities object
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
const apiController = new Companies(myCredential)
const interactionController = new Interactions(myCredential)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
if (myArgs.report) {
   // Retrive the interaction by Id
   const [comp_success, comp_stat, comp_results] = await apiController.findById(myArgs.report)
   // Retrive the company by Name
   const interactionNames = Object.keys(comp_results[0].linked_interactions)
   let interactions = []
   for (const interactionName in interactionNames) {
      const [mySuccess, myStat, myInteraction] = await interactionController.findByName(
         interactionNames[interactionName]
      )
      interactions.push(myInteraction[0])
   }
   // Set the root name to be used for file and directory names in case of packaging
   const baseName = comp_results[0].name.replace(/ /g,"_")
   // Set the directory name for the package
   const baseDir = myEnv.workDir + '/' + baseName
   // Define location and name of the report output, depending upon the package switch this will change
   let fileName = process.env.HOME + '/Documents/' + comp_results[0].name.replace(/ /g,"_") + '.docx'
   
   // Set up the document controller
   const docController = new CompanyStandalone(
      comp_results[0], // Company to report on
      interactions, // The interactions associated to the company
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
         await utils.s3DownloadObjs(interactions, myEnv, baseDir + '/interactions')
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
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const [success, stat, resp] = await apiController.updateObj(myCLIObj)
   if(success) {
      console.log(`SUCCESS: processed update to company object.`)
      process.exit(0)
   } else {
      console.error('ERROR (%d): Unable to update company object.', -1)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   // Delete an object
   const [success, stat, resp] = await apiController.deleteObj(myArgs.delete)
   if(success) {
      console.log(`SUCCESS: deleted company object.`)
      process.exit(0)
   } else {
      console.error('ERROR (%d): Unable to delete company object.', -1)
      process.exit(-1)
   }
} else if (myArgs.add_wizard) {
   // pass in credential, apiController
   const newCompany = new AddCompany(myEnv, apiController, myCredential, myCLI)
   const result = await newCompany.wizard()
   if(result[0]) {
      console.log('SUCCESS: Created new company in the backend')
      process.exit(0)
   } else {
      console.error('ERROR: Failed to create company object with %d', result[1].status_code)
      process.exit(-1)
   }
} else {
   [success, stat, results] = await apiController.getAll()
}

// Emit the output
myCLI.outputCLI(myArgs.output, results, myEnv, objectType)