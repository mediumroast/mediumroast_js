#!/usr/bin/env node

/**
 * A CLI utility to backup and restore data from the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_backup.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.5.0
 */

// Import required modules
import ConfigParser from 'configparser'
import program from 'commander'
import chalk from 'chalk'

import FilesystemOperators from '../src/cli/filesystem.js' 
import ArchivePackage from '../src/cli/archive.js'
import WizardUtils from '../src/cli/commonWizard.js'
import serverOperations from '../src/cli/common.js'

import * as fs from 'fs'

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

// Parse the cli options
function parseCLIArgs() {
    const name = 'backup'
    const version = '1.5.0'
    const description = 'A mediumroast.io CLI utility to backup and restore objects.'
    // Define commandline options
    program
        .name(name)
        .version(version)
        .description(description)

    program
        // System command line switches
        .requiredOption(
            '-c --conf_file <file>',
            'Path to the configuration file',
            process.env.HOME + '/.mediumroast/config.ini'
        )
        .option(
            '--rest_server <server>',
            'The URL of the target mediumroast.io server'
        )
        .option(
            '--api_key <key>',
            'The API key needed to talk to the mediumroast.io server'
        )
        .option(
            '--user <user name>',
            'Your user name for the mediumroast.io server'
        )
        .option(
            '--secret <user secret or password>',
            'Your user secret or password for the mediumroast.io server'
        )
        .option(
            '--output_dir <output location>',
            'Select output location to to store the backup',
            process.env.HOME + '/.mediumroast/backups'
        )
        .option(
            '-w --work_dir <working directory location>',
            'Select output location to to store the backup',
            process.env.HOME + '/.mediumroast/tmp'
        )

        // Operational command line switches
        .option(
            '--verbose',
            'Specify whether or not to print out details of the backup process'
        )
        .option(
            '--operation <operation to perform>',
            'Specify which process to perform from: backup or restore',
            'backup',
            'restore'
        )
        .option(
            '--object_type <object type to restore>',
            'Specify which type of object(s) to backup/restore',
            'all',
            'interactions',
            'studies',
            'companies'
        )
        .option(
            '--backup_file <backup file name>',
            'Define the backup file to create or restore from, blank means the system will define'
        )

    program.parse(process.argv)
    return program.opts()
}

function getConfig(confFile) {
    const config = new ConfigParser()
    config.read(confFile)
    return config
}

function getEnv(cliArgs, config) {
    // Create the backup output file name
    const currentTimeInSeconds = Math.floor(Date.now() / 1000)
    const backupFileName = 'mr_backup_full_' + currentTimeInSeconds + '.zip'

    let env = {
        "restServer": null,
        "apiKey": null,
        "user": null,
        "secret": null,
        "workDir": null,
        "outputDir": null,
        "operation": null,
        "objectType": null,
        "backupFile": null,
        "verbose": null
    }

    // With the cli options as the priority set up the environment for the cli
    cliArgs.rest_server ? env.restServer = cliArgs.rest_server : env.restServer = config.get('DEFAULT', 'rest_server')
    cliArgs.api_key ? env.apiKey = cliArgs.api_key : env.apiKey = config.get('DEFAULT', 'api_key')
    cliArgs.user ? env.user = cliArgs.user : env.user = config.get('DEFAULT', 'user')
    cliArgs.secret ? env.secret = cliArgs.secret : env.secret = config.get('DEFAULT', 'secret')
    cliArgs.work_dir ? env.workDir = cliArgs.work_dir : env.workDir = config.get('DEFAULT', 'working_dir')
    cliArgs.backup_file ? env.backupFile = cliArgs.backup_file : env.backupFile = backupFileName

    // Set up additional parameters from command line switches
    env.outputDir = cliArgs.output_dir
    env.operation = cliArgs.operation
    env.objectType = cliArgs.object_type
    env.verbose = cliArgs.verbose

    return env
}

async function restoreObjects (fileName, apiController) {
    const myFilesystem = new FilesystemOperators()
    const [success, msg, rawData] = myFilesystem.readTextFile(fileName)
    if (success) {
        const jsonData = JSON.parse(rawData)
        const toRegister = jsonData.map(async element => {
            let restoredObjs = {}
            const [success, stat, resp] = await apiController.createObj(element)
            if (await stat.status_code == 200) {
                restoredObjs[element.name] = true
            } else {
                restoredObjs[element.name] = false
            }
            return restoredObjs
        })
        const registered = await Promise.all(toRegister)
        return true
    } else {
        return false
    }
}

/**
 * 
 * @param {*} apiControllers 
 * @param {*} myEnv 
 */
async function backupObjects(apiControllers, myEnv) {
    // Construct the file system object
    const myFilesystem = new FilesystemOperators()

    // Create the directory to stage the backup to
    myFilesystem.safeMakedir(myEnv.workDir + '/mr_backup') // Working directory for backup packages

    // Provide the user some feedback on what we're about to do
    process.stdout.write(chalk.blue.bold('Performing backup of all mediumroast.io objects. '))

    // Get the data
    const myData = {
        "companies": await apiControllers.companyCtl.getAll(),
        "interactions": await apiControllers.interactionCtl.getAll(),
        "studies": await apiControllers.studyCtl.getAll()
    }
    // Save the data to individual JSON files
    for (const fil in myData) {
        const status = myFilesystem.saveTextFile(
            myEnv.workDir + '/mr_backup/' + fil + '.json',
            JSON.stringify(myData[fil][2])
        )

    }
    // Create ZIP package and move to backup dir
    const archiver = new ArchivePackage(myEnv.outputDir + '/' + myEnv.backupFile)
    const [zipSuccess, zipMsg, zipResult] = await archiver.createZIPArchive(myEnv.workDir + '/mr_backup/')
    if (zipSuccess) {
        console.log(chalk.green.bold(`[Success, created backup package ${myEnv.outputDir + '/' + myEnv.backupFile}]`))
        // Cleanup the working content
        const rmSuccess = myFilesystem.rmDir(myEnv.workDir + '/mr_backup/')
    } else {
        console.log(chalk.red.bold(`[Unable to create backup package due to ${zipMsg}, exiting.]`))
        process.exit(-1)
    }
}

function prepare() {
    // Business end of the CLI
    const myArgs = parseCLIArgs()
    const myConfig = getConfig(myArgs.conf_file)
    const myEnv = getEnv(myArgs, myConfig)

    // Construct the file system object
    const myFilesystem = new FilesystemOperators()

    // Check the output directory
    myFilesystem.safeMakedir(myEnv.outputDir) // Target directory for backup packages
    myFilesystem.safeMakedir(myEnv.workDir + '/mr_restore/') // Working directory for restores

    // Return the environmental setting
    return myEnv
}

async function checkServer(myEnv, operation) {
    process.stdout.write(chalk.blue.bold('Performing checks to see if the server is ready. '))
    const serverChecks = new serverOperations(myEnv)
    const serverReady = await serverChecks.checkServer()

    if(operation === 'backup') {
        if(serverReady[0]) { // We are looking to ensure that the system is empty without interactions
            console.log(chalk.red.bold('[No objects detected, exiting]'))
            process.exit(-1)
        } else { // We've detected that at least one object has been found on the system so we cannot proceed
            console.log(chalk.green.bold('[Objects detected, ready.]'))
            return serverReady
        }
    } else if(operation === 'restore') {
        if(serverReady[0]) { // We are looking to ensure that the system is empty without interactions
            console.log(chalk.green.bold('[No objects detected, ready]'))
            return serverReady
        } else { // We've detected that at least one object has been found on the system so we cannot proceed
            console.log(chalk.red.bold('[Objects detected, not ready.]'))
            process.exit(-1)
        }
    }
}

async function getBackup(myEnv) {
    const myFilesystem = new FilesystemOperators()
    // Get all of the backup packages in the default backup directory
    const allFiles = myFilesystem.listAllFiles(myEnv.outputDir)
    // Construct the wizard utility
    const wizardUtils = new WizardUtils('all')
    // Process the individual files and put them into an array of objects
    let backupFiles = []
    for(const myIdx in allFiles[2]) {
        // Set the file name for easier readability
        const fileName = allFiles[2][myIdx]
        // Skip files that start with . including present and parent working directories 
        if(fileName.indexOf('.') === 0) { continue } // TODO check to see if this causes the problem
        const fileMetadata = fs.statSync(myEnv.outputDir + '/' + fileName)
        backupFiles.push({name: 'Backup file: ' + fileName + '; Created on: ' + fileMetadata.ctime, value: fileName})
    }
    // Prompt the user to pick the backup package
    const backupFile = await wizardUtils.doCheckbox(
        "Which backup package would you like to restore from?",
        backupFiles
    )
    // Return the file name of the selected backup package
    return backupFile[0]
}

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Prepare the environment for the backup
const myEnv = prepare()

// Perform a full backup
if (myEnv.operation == 'backup') {
    // Check to see if the server is ready for adding interactions
    const myServerControllers = await checkServer(myEnv, myEnv.operation)
    await backupObjects(myServerControllers[2], myEnv)

} else if (myEnv.operation == 'restore') {
    // Check to see if the server is ready for adding interactions
    const myServerControllers = await checkServer(myEnv, myEnv.operation)

    // Prompt the user to pick a backup package
    const myBackup = await getBackup(myEnv)

    // Extract the package to the working directory
    const archiver = new ArchivePackage(myEnv.outputDir + '/' + myBackup)
    // NOTE: the zip package does the right thing and unzips the backup package to the working directory, 
    //      but for some reason it errors out.  So we don't need to worry about the return for now.
    const archiveResults = await archiver.extractZIPArchive(myEnv.workDir + '/mr_restore/')
    
    // Restores

    // User objects
    // if (doUsers) {
    //     restoreObjects(myEnv.workDir + '/mr_restore/users.json')
    // }

    // Define the statuses for each object type to restore
    let [myCompanies, myInteractions, myStudies] = [true, true, true]

    // 
    process.stdout.write(chalk.blue.bold(`Restoring objects to mediumroast.io server [${myEnv.restServer}]. `))

    // Company objects
    if (myEnv.objectType == 'companies' || myEnv.objectType == 'all' ) {
        myCompanies = await restoreObjects(myEnv.workDir + '/mr_restore/companies.json', myServerControllers[2].companyCtl)
    }

    // Interaction objects
    if (myEnv.objectType == 'interactions' || myEnv.objectType == 'all' ) {
        myInteractions = await restoreObjects(myEnv.workDir + '/mr_restore/interactions.json', myServerControllers[2].interactionCtl)
    }

    // Study objects
    if (myEnv.objectType == 'studies' || myEnv.objectType == 'all' ) {
        myStudies = await restoreObjects(myEnv.workDir + '/mr_restore/studies.json', myServerControllers[2].studyCtl)
    }

    // Cleanup the working files
    const myFilesystem = new FilesystemOperators()
    myFilesystem.rmDir(myEnv.workDir + '/mr_restore/')

    // Provide a response to the user
    myCompanies && myStudies && myInteractions ? 
        console.log(chalk.green.bold(`[Success, restored object backup]`)) :
        console.log(chalk.red.bold(`[Failed, unable to restore object backup]`))

}