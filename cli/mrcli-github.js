#!/usr/bin/env node

import { Companies, Interactions, Studies } from '../src/api/gitHubServer.js'
import Environmentals from '../src/cli/env.js'
import CLIOutput from '../src/cli/output.js'
import FilesystemOperators from '../src/cli/filesystem.js'
import chalk from 'chalk'
import GitHubFunctions from '../src/api/github.js'
import * as progress from 'cli-progress'

console.log(chalk.bold.yellow('NOTICE: This CLI is being deprecated and will be removed in a future release.'))

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Related object type
const objectType = 'Interactions'

// Environmentals object
const environment = new Environmentals(
   '3.0',
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

// Construct the controller objects
const companyCtl = new Companies(accessToken, myEnv.gitHubOrg, processName)
const studyCtl = new Studies(accessToken, myEnv.gitHubOrg, processName)
const interactionCtl = new Interactions(accessToken, myEnv.gitHubOrg, processName)
const gitHubCtl = new GitHubFunctions(accessToken, myEnv.gitHubOrg, processName)

let gitHubResp

gitHubResp = await gitHubCtl.checkForLock(objectType)
if(gitHubResp[0]) {
    console.log(`The ${objectType} container is locked, please remove the lock and try again.`)
    process.exit(1)
}


gitHubResp = await gitHubCtl.lockContainer(objectType)
// Save the sha for the unlock
const lockSha = gitHubResp[2].data.content.sha

// doSetup = await wizardUtils.operationOrNot(
//     `Did the lock occur?`
// )

// Create a new Branch
gitHubResp = await gitHubCtl.createBranchFromMain()

// console.log(gitHubResp[2].data)

// doSetup = await wizardUtils.operationOrNot(
//     `Did the Branch create?`
// )

const branchName = gitHubResp[2].data.ref
const branchSha = gitHubResp[2].data.object.sha 


// Read the blob
const fileName = './sample doc_one 1.pdf'
const dirName = './sample_pdf'
// const fileData = fileSystem.readBlobFile(fileName)
const progressBar = new progress.SingleBar(
    {format: '\tProgress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'}, 
    progress.Presets.rect
)

let myFiles = []
const allFiles = fileSystem.listAllFiles(dirName)
progressBar.start(allFiles[2].length - 1, 0)
for(const myIdx in allFiles[2]) {
    // Set the file name for easier readability
    const fileName = allFiles[2][myIdx]
    // Skip files that start with . including present and parent working directories 
    if(fileName.indexOf('.') === 0) { continue }
    const fileData = fileSystem.readBlobFile(`${dirName}/${fileName}`)
    const insteractionResp = await gitHubCtl.writeBlob(objectType, fileName, fileData[2], branchName, branchSha)
    myFiles.push(insteractionResp[2].data.commit)
    // Increment the progress bar
    progressBar.increment()
}
progressBar.stop()
console.log('Finished writing files to the repository.')

// Create the object
// const insteractionResp = await gitHubCtl.writeBlob(objectType, fileName, fileData[2], branchName, branchSha)

// console.log(insteractionResp[2].data.commit)

// Read objects from the repository
// gitHubResp = await gitHubCtl.readObjects(objectType)
// console.log(gitHubResp[2].mrJson)
// doSetup = await wizardUtils.operationOrNot(
//     `Objects read?`
// )
// const objectSha = gitHubResp[2].data.sha
// gitHubResp = await gitHubCtl.writeObject(objectType, companies[2], branchName, objectSha)
// console.log(gitHubResp[2])

// doSetup = await wizardUtils.operationOrNot(
//     `Objects write?`
// )

// Merge branch into main
gitHubResp = await gitHubCtl.mergeBranchToMain(branchName, branchSha)
// console.log(gitHubResp[2])


// doSetup = await wizardUtils.operationOrNot(
//     `Did the Branch merge?`
// )

gitHubResp = await gitHubCtl.unlockContainer(objectType, lockSha, branchName)
// console.log(gitHubResp[2])
gitHubResp = await gitHubCtl.unlockContainer(objectType, lockSha)
// console.log(gitHubResp[2])

// doSetup = await wizardUtils.operationOrNot(
//     `Did the repo unlock merge?`
// )


