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
import { Companies, Studies } from '../src/api/gitHubServer.js'
import AddCompany from '../src/cli/companyWizard.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import ArchivePackage from '../src/cli/archive.js'
import ora from 'ora'

// Related object type
const objectType = 'Companies'

// Environmentals object
const environment = new Environmentals(
   '3.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Filesystem object
const fileSystem = new FilesystemOperators()

// Process the command line options
let myProgram = environment.parseCLIArgs(true)
myProgram
   .option('-o, --allow_orphans', 'Allow orphaned interactions to remain in the system')

// Parse the command line arguments into myArgs and obtain the options
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

// Read the environmental settings
const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
const accessToken = await environment.verifyAccessToken()
const processName = 'mrcli-company'

// Output object
const output = new CLIOutput(myEnv, objectType)

// Construct the controller objects
const companyCtl = new Companies(accessToken, myEnv.gitHubOrg, processName)
// const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)

// TODO: We need to create a higher level abstraction for capturing the owning company
// const owningCompany = await serverOps.getOwningCompany(companyCtl)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
// TODO consider moving this out into at least a separate function to make main clean
if (myArgs.report) {
   console.error('ERROR (%d): Report not implemented.', -1)
   process.exit(-1)
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
   const competitorIdxs = Object.keys(comp_results[0].comparison)
   for (const compIdx in competitorIdxs) {
      // const competitor = competitorIds[comp]
      // console.log(comp_results[0].comparison[competitor].name)
      const competitorIndex = competitorIdxs[compIdx] // Index in the comparison property for the company
      const competitorName = comp_results[0].comparison[competitorIndex].name // Actual company name
      const [compSuccess, compStat, myCompetitor] = await companyCtl.findByName(competitorName)
      const [mostSuccess, mostStat, myMost] = await interactionCtl.findByName(
         comp_results[0].comparison[competitorIndex].most_similar.name
      )
      const [leastSuccess, leastStat, myLeast] = await interactionCtl.findByName(
         comp_results[0].comparison[competitorIndex].least_similar.name
      )
      // Format the scores and names
      const leastScore = String(
         Math.round(comp_results[0].comparison[competitorIndex].least_similar.score * 100)
      ) + '%'
      const mostScore = String(
         Math.round(comp_results[0].comparison[competitorIndex].most_similar.score * 100)
      ) + '%'
      const leastName = comp_results[0].comparison[competitorIndex].least_similar.name.slice(0,40) + '...'
      const mostName = comp_results[0].comparison[competitorIndex].most_similar.name.slice(0,40) + '...'
      competitors.push(
         {
            company: myCompetitor[0],
            mostSimilar: {
               score: mostScore,
               name: comp_results[0].comparison[competitorIndex].most_similar.name,
               interaction: myMost[0]
            },
            leastSimilar: {
               score: leastScore,
               name: comp_results[0].comparison[competitorIndex].least_similar.name,
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
   let fileName = process.env.HOME + '/Documents/' + baseName + '.docx'
   
   // Set up the document controller
   const docController = new CompanyStandalone(
      comp_results[0], // Company to report on
      interactions, // The interactions associated to the company
      competitors, // Relevant competitors for the company
      myEnv,
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
         // TODO: We need to rewrite the logic for obtaining the interactions as they are from GitHub
         // await s3.s3DownloadObjs(interactions, baseDir + '/interactions', sourceBucket)
         null
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
// NOTICE: For Now we won't have any ids available for companies, so we'll need to use names
/* } else if (myArgs.find_by_id) {
   [success, stat, results] = await companyCtl.findById(myArgs.find_by_id) */
} else if (myArgs.find_by_name) {
   [success, stat, results] = await companyCtl.findByName(myArgs.find_by_name)
// TODO: Need to reimplment the below to account for GitHub
} else if (myArgs.find_by_x) {
   const [myKey, myValue] = Object.entries(JSON.parse(myArgs.find_by_x))[0]
   const foundObjects = await companyCtl.findByX(myKey, myValue)
   success = foundObjects[0]
   stat = foundObjects[1]
   results = foundObjects[2]
} else if (myArgs.update) {
   const myCLIObj = JSON.parse(myArgs.update)
   const mySpinner = new ora(`Updating company [${myCLIObj.name}] object ...`)
   mySpinner.start()
   const [success, stat, resp] = await companyCtl.updateObj(myCLIObj)
   mySpinner.stop()
   if(success) {
      console.log(`SUCCESS: ${stat.status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${stat.status_msg}`)
      process.exit(-1)
   }
// TODO: Need to reimplement the below to account for GitHub
} else if (myArgs.delete) {
   if (myArgs.allow_orphans) {
      // Use operationOrNot to confirm the delete
      const deleteOrNot = await wutils.operationOrNot(`Preparing to delete the company [${myArgs.delete}], are you sure?`)
      if(!deleteOrNot) {
         console.log(`INFO: Delete of [${myArgs.delete}] cancelled.`)
         process.exit(0)
      }
      // Delete the object
      const mySpinner = new ora(`Deleting company [${myArgs.delete}] object ...`)
      mySpinner.start()
      const [success, stat, resp] = await companyCtl.deleteObj(myArgs.delete)
      mySpinner.stop()
      if(success) {
         console.log(`SUCCESS: ${stat.status_msg}`)
         process.exit(0)
      } else {
         console.log(`ERROR: ${stat.status_msg}`)
         process.exit(-1)
      }
   }
} else if (myArgs.add_wizard) {
   myEnv.DEFAULT = {company: 'Unknown'}
   const newCompany = new AddCompany(myEnv, companyCtl)
   const result = await newCompany.wizard()
   if(result[0]) {
      console.log('SUCCESS: Created new company in the backend')
      process.exit(0)
   } else {
      console.log(`ERROR: Failed to create company object with:, ${result[2]}`)
      process.exit(-1)
   }
} else if (myArgs.reset_by_type) {
   console.error(`WARNING: CLI function not yet implemented for companies: %d`, -1)
   process.exit(-1)
// TODO: Need to reimplement the below to account for GitHub, and this is where we will start to use the new CLIOutput
} else {
   [success, stat, results] = await companyCtl.getAll()
   results = results.mrJson
}

// Emit the output
output.outputCLI(results, myArgs.output)