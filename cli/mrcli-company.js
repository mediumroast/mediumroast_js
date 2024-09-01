#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io company objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file company.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import { CompanyStandalone } from '../src/report/companies.js'
import { Interactions, Companies, Studies, Users } from '../src/api/gitHubServer.js'
import DOCXUtilities from '../src/report/helpers.js'
import CLIUtilities from '../src/cli/common.js'
import GitHubFunctions from '../src/api/github.js'
import AddCompany from '../src/cli/companyWizard.js'
import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import CLIOutput from '../src/cli/output.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import ArchivePackage from '../src/cli/archive.js'
import ora from 'ora'
import WizardUtils from '../src/cli/commonWizard.js'


// Related object type
const objectType = 'Companies'

// Environmentals object
const environment = new Environmentals(
   '3.2.0',
   `${objectType}`,
   `Command line interface for mediumroast.io ${objectType} objects.`,
   objectType
)

// Filesystem object
const fileSystem = new FilesystemOperators()


// Process the command line options
let myProgram = environment.parseCLIArgs(true)
myProgram
   .option('-o, --allow_orphans', 'Allow orphaned interactions to remain in the system', false)

// Parse the command line arguments into myArgs and obtain the options
let myArgs = myProgram.parse(process.argv)
myArgs = myArgs.opts()

// Read the environmental settings
const myConfig = environment.readConfig(myArgs.conf_file)
let myEnv = environment.getEnv(myArgs, myConfig)
myEnv.company = 'Unknown'
const myAuth = new GitHubAuth(myEnv, environment, myArgs.conf_file)
const verifiedToken = await myAuth.verifyAccessToken()
let accessToken = null
if (!verifiedToken[0]) {
   console.error(`ERROR: ${verifiedToken[1].status_msg}`)
   process.exit(-1)
} else {
   accessToken = verifiedToken[2].token
}
const processName = 'mrcli-company'

// Construct the DOCXUtilities object
const docxUtils = new DOCXUtilities(myEnv)

// Construct the CLIUtilities object
const cliUtils = new CLIUtilities()

// Output object
const output = new CLIOutput(myEnv, objectType)

// CLI Wizard object
const wutils = new WizardUtils()

// Construct the controller objects
const companyCtl = new Companies(accessToken, myEnv.gitHubOrg, processName)
const interactionCtl = new Interactions(accessToken, myEnv.gitHubOrg, processName)
const gitHubCtl = new GitHubFunctions(accessToken, myEnv.gitHubOrg, processName)
// const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)
const userCtl = new Users(accessToken, myEnv.gitHubOrg, processName)

// Predefine the results variable
let [success, stat, results] = [null, null, null]

// Process the cli options
// TODO consider moving this out into at least a separate function to make main clean
if (myArgs.report) {
   // Use CLIUtils to get all objects
   const allObjects = await cliUtils.getAllObjects({interactions: interactionCtl, companies: companyCtl})
   if(!allObjects[0]) {
      console.error(`ERROR: ${allObjects[1].status_msg}`)
      process.exit(-1)
   }
   const allInteractions = allObjects[2].interactions
   const allCompanies = allObjects[2].companies

   // Set the root name to be used for file and directory names in case of packaging
   const baseName = myArgs.report.replace(/ /g, "_")
   // Set the directory name for the package
   const baseDir = myEnv.workDir + '/' + baseName
   // Define location and name of the report output, depending upon the package switch this will change
   let fileName = process.env.HOME + '/Documents/' + baseName + '.docx'
   // Set up the document controller
   const docController = new CompanyStandalone(
      myArgs.report,
      allCompanies,
      allInteractions,
      myEnv
   )

   let mySpinner = null
   if (myArgs.package) {
      mySpinner = new ora(`Generating report package for [${myArgs.report}] ...`)
      mySpinner.start()
      // Create the working directory
      const [dir_success, dir_msg, dir_res] = fileSystem.safeMakedir(baseDir + '/interactions')

      // If the directory creations was successful download the interaction
      if (dir_success) {
         fileName = baseDir + '/' + baseName + '_report.docx'
         // Get the company interactions
         let interactions = docController.sourceData.interactions
         // Get the competitive interactions
         const competitiveInteractions = [
            ...docController.sourceData.competitors.mostSimilar.interactions, 
            ...docController.sourceData.competitors.leastSimilar.interactions
         ]
         // Add the competitive interactions to the interactions
         interactions = [...interactions, ...competitiveInteractions]
         // Download the interactions
         for (const interaction of interactions) {
            let interactionFileName = interaction.url.split('/').pop()
            // Replace all spaces with underscores in the file name
            interactionFileName = interactionFileName.replace(/ /g, '_')
            const downloadResults = await gitHubCtl.readBlob(interaction.url)
            if(downloadResults[0]) {
               fileSystem.saveTextOrBlobFile(`${baseDir}/interactions/${interactionFileName}`, downloadResults[2])
            } else {
               console.error(`ERROR: ${downloadResults[1]}`)
               process.exit(-1)
            }
         }

         // TODO: We need to rewrite the logic for obtaining the interactions as they are from GitHub
         // await s3.s3DownloadObjs(interactions, baseDir + '/interactions', sourceBucket)

         // Else error out and exit
      } else {
         console.error('ERROR (%d): ' + dir_msg, -1)
         process.exit(-1)
      }

   }

   // Create the document
   const [report_success, sourceData] = await docController.makeDOCX(fileName, myArgs.package)


   // Create the package and cleanup as needed
   if (myArgs.package) {
      const archiver = new ArchivePackage(myEnv.outputDir + '/' + baseName + '.zip')
      const [package_success, package_stat, package_result] = await archiver.createZIPArchive(baseDir)
      if (package_success) {
         fileSystem.rmDir(baseDir)
         mySpinner.stop()
         console.log(package_stat)
         process.exit(0)
      } else {
         fileSystem.rmDir(baseDir)
         mySpinner.stop()
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
   const lockResp = await companyCtl.checkForLock()
   if (lockResp[0]) {
      console.log(`ERROR: ${lockResp[1].status_msg}`)
      process.exit(-1)
   }
   const myCLIObj = JSON.parse(myArgs.update)
   const mySpinner = new ora(`Updating company [${myCLIObj.name}] ...`)
   mySpinner.start()
   const [success, stat, resp] = await companyCtl.updateObj(myCLIObj)
   mySpinner.stop()
   if (success) {
      console.log(`SUCCESS: ${stat.status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${stat.status_msg}`)
      process.exit(-1)
   }
   // TODO: Need to reimplement the below to account for GitHub
} else if (myArgs.delete) {
   const lockResp = await companyCtl.checkForLock()
   if (lockResp[0]) {
      console.log(`ERROR: ${lockResp[1].status_msg}`)
      process.exit(-1)
   }
   // Use operationOrNot to confirm the delete
   const deleteOrNot = await wutils.operationOrNot(`Preparing to delete the company [${myArgs.delete}], are you sure?`)
   if (!deleteOrNot) {
      console.log(`INFO: Delete of [${myArgs.delete}] cancelled.`)
      process.exit(0)
   }
   // If allow_orphans is set log a warning to the user that they are allowing orphaned interactions
   if (myArgs.allow_orphans) {
      console.log(chalk.bold.yellow(`WARNING: Allowing orphaned interactions to remain in the system.`))
   }
   // Delete the object
   const mySpinner = new ora(`Deleting company [${myArgs.delete}] ...`)
   mySpinner.start()
   const [success, stat, resp] = await companyCtl.deleteObj(myArgs.delete, myArgs.allow_orphans)
   mySpinner.stop()
   if (success) {
      console.log(`SUCCESS: ${stat.status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${stat.status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.add_wizard) {
   const lockResp = await companyCtl.checkForLock()
   if (lockResp[0]) {
      console.log(`ERROR: ${lockResp[1].status_msg}`)
      process.exit(-1)
   }
   myEnv.DEFAULT = { company: 'Unknown' }
   const newCompany = new AddCompany(myEnv, { github: gitHubCtl, interaction: interactionCtl, company: companyCtl, user: userCtl })
   const result = await newCompany.wizard()
   if (result[0]) {
      console.log(`SUCCESS: ${result[1].status_msg}`)
      process.exit(0)
   } else {
      console.log(`ERROR: ${result[1].status_msg}`)
      process.exit(-1)
   }
} else if (myArgs.reset_by_type) {
   console.error(`WARNING: CLI function not yet implemented for companies: %d`, -1)
   process.exit(-1)
   const lockResp = companyCtl.checkForLock()
   if (lockResp[0]) {
      console.log(`ERROR: ${lockResp[1].status_msg}`)
      process.exit(-1)
   }
   // TODO: Need to reimplement the below to account for GitHub, and this is where we will start to use the new CLIOutput
} else {
   [success, stat, results] = await companyCtl.getAll()
   results = results.mrJson
   // console.log(JSON.stringify(obj, null, 2))
}

// Emit the output
output.outputCLI(results, myArgs.output)