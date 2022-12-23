#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io company objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file company.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.2.0
 */

// Import required modules
import { CompanyStandalone } from '../src/report/companies.js'
import AddCompany from '../src/cli/companyWizard.js'
import Environmentals from '../src/cli/env.js'
import s3Utilities from '../src/cli/s3.js'
import CLIOutput from '../src/cli/output.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import serverOperations from '../src/cli/common.js'
import ArchivePackage from '../src/cli/archive.js'

// External modules
import chalk from 'chalk'

// Related object type
const objectType = 'company'

// Environmentals object
const environment = new Environmentals(
   '2.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Filesystem object
const fileSystem = new FilesystemOperators()

// Create the environmental settings
const myArgs = environment.parseCLIArgs()
const myConfig = environment.getConfig(myArgs.conf_file)
const myEnv = environment.getEnv(myArgs, myConfig)

// Output object
const output = new CLIOutput(myEnv, objectType)

// S3 object
const s3 = new s3Utilities(myEnv)

// Common server ops and also check the server
const serverOps = new serverOperations(myEnv)
// Checking to see if the server is ready for operations
const serverReady = await serverOps.checkServer()
if(serverReady[0]) {
   console.log(
      chalk.red.bold(
         `No objects detected on your mediumroast.io server [${myEnv.restServer}].\n` +
         `Perhaps you should try to run mr_setup first to create the owning company, exiting.`
      )
   )
   process.exit(-1)
}

// Assign the controllers based upon the available server
const companyCtl = serverReady[2].companyCtl
const interactionCtl = serverReady[2].interactionCtl
const studyCtl = serverReady[2].studyCtl
const owningCompany = await serverOps.getOwningCompany(companyCtl)
const sourceBucket = s3.generateBucketName(owningCompany[2])

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
// TODO consider moving this out into at least a separate function to make main clean
if (myArgs.report) {
   // Retrive the interaction by Id
   const [comp_success, comp_stat, comp_results] = await companyCtl.findById(myArgs.report)
   // Retrive the company by Name
   const interactionNames = Object.keys(comp_results[0].linked_interactions)
   // Obtain relevant interactions
   let interactions = []
   for (const interactionName in interactionNames) {
      const [mySuccess, myStat, myInteraction] = await interactionCtl.findByName(
         interactionNames[interactionName]
      )
      interactions.push(myInteraction[0])
   }
   // Obtain the competitors
   let competitors = []
   let competitiveInteractions = []
   const competitorIds = Object.keys(comp_results[0].comparison)
   for (const comp in competitorIds) {
      const competitor = competitorIds[comp]
      const [compSuccess, compStat, myCompetitor] = await companyCtl.findById(competitor)
      const [mostSuccess, mostStat, myMost] = await interactionCtl.findByName(
         comp_results[0].comparison[competitor].most_similar.name
      )
      const [leastSuccess, leastStat, myLeast] = await interactionCtl.findByName(
         comp_results[0].comparison[competitor].least_similar.name
      )
      // Format the scores and names
      const leastScore = String(
         comp_results[0].comparison[competitor].least_similar.score.toFixed(2) * 100
      ) + '%'
      const mostScore = String(
         comp_results[0].comparison[competitor].most_similar.score.toFixed(2) * 100
      ) + '%'
      const leastName = comp_results[0].comparison[competitor].least_similar.name.slice(0,40) + '...'
      const mostName = comp_results[0].comparison[competitor].most_similar.name.slice(0,40) + '...'
      competitors.push(
         {
            company: myCompetitor[0],
            mostSimilar: {
               score: mostScore,
               name: comp_results[0].comparison[competitor].most_similar.name,
               interaction: myMost[0]
            },
            leastSimilar: {
               score: leastScore,
               name: comp_results[0].comparison[competitor].least_similar.name,
               interaction: myLeast[0]
            }
         }
      )
      competitiveInteractions.push(myMost[0], myLeast[0])
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
      competitors, // Relevant competitors for the company
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
      // Append the competitive interactions on the list and download all
         interactions = [...interactions, ...competitiveInteractions]
         await s3.s3DownloadObjs(interactions, baseDir + '/interactions', sourceBucket)
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
   [success, stat, results] = await companyCtl.findById(myArgs.find_by_id)
} else if (myArgs.find_by_name) {
   [success, stat, results] = await companyCtl.findByName(myArgs.find_by_name)
} else if (myArgs.find_by_x) {
   const [myKey, myValue] = Object.entries(JSON.parse(myArgs.find_by_x))[0]
   const foundObjects = await companyCtl.findByX(myKey, myValue)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const [success, stat, resp] = await companyCtl.updateObj(myCLIObj)
   if(success) {
      console.log(`SUCCESS: processed update to company object.`)
      process.exit(0)
   } else {
      console.error('ERROR (%d): Unable to update company object.', -1)
      process.exit(-1)
   }
} else if (myArgs.delete) {
   // Delete an object
   const [success, stat, resp] = await companyCtl.deleteObj(myArgs.delete)
   if(success) {
      console.log(`SUCCESS: deleted company object.`)
      process.exit(0)
   } else {
      console.error('ERROR (%d): Unable to delete company object.', -1)
      process.exit(-1)
   }
} else if (myArgs.add_wizard) {
   // pass in credential, companyCtl
   const newCompany = new AddCompany(myEnv, companyCtl)
   const result = await newCompany.wizard()
   if(result[0]) {
      console.log('SUCCESS: Created new company in the backend')
      process.exit(0)
   } else {
      console.error('ERROR: Failed to create company object with %d', result[1].status_code)
      process.exit(-1)
   }
} else if (myArgs.reset_by_type) {
   console.error(`WARNING: CLI function not yet implemented for companies: %d`, -1)
   process.exit(-1)
} else {
   [success, stat, results] = await companyCtl.getAll()
}

// Emit the output
output.outputCLI(results, myArgs.output)