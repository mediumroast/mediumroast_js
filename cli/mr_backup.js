#!/usr/bin/env node

/**
 * A CLI utility to backup and restore data from the mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file mr_backup.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import { Auth, Companies, Interactions, Studies, Users } from '../src/api/mrServer.js'
import { Utilities } from '../src/helpers.js'
import ConfigParser from 'configparser'
import program from 'commander'

// Parse the cli options
function parseCLIArgs() {
    const name = 'mr_backup'
    const version = '1.0.0'
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
            'The URL of the target mediumroast.io server',
            'http://cherokee.from-ca.com:46767'
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

function restoreObjects (fileName, apiController) {
    let [success, msg, rawData] = utils.readTextFile(fileName)
        if (success) {
            const jsonData = JSON.parse(rawData)
            jsonData.array.forEach(element => {
                apiController.createObj(jsonData[element])
            })
        } else {
            console.error("ERROR (%d): " + msg, -1)
        }
}

// Business end of the CLI
const myArgs = parseCLIArgs()
const myConfig = getConfig(myArgs.conf_file)
const myEnv = getEnv(myArgs, myConfig)
const utils = new Utilities('all')

// Generate the credential & construct the API Controllers
const myAuth = new Auth(
    myEnv.restServer,
    myEnv.apiKey,
    myEnv.user,
    myEnv.secret
)
const myCredential = myAuth.login()
const compController = new Companies(myCredential)
const intController = new Interactions(myCredential)
const studController = new Studies(myCredential)
// const usersController = new Users(myCredential)

// Check the output directory
utils.safeMakedir(myEnv.outputDir)

utils.safeMakedir(myEnv.workDir + '/mr_restore') // Working directory for restores

if (myEnv.operation == 'backup') {
    // Create the directory to stage the backup to
    utils.safeMakedir(myEnv.workDir + '/mr_backup') // Working directory for backup packages
    // Get the data
    const myData = {
        "companies": await compController.getAll(),
        "interactions": await intController.getAll(),
        "studies": await studController.getAll()
    }
    // Save the data to individual JSON files
    for (const fil in myData) {
        const status = utils.saveTextFile(
            myEnv.workDir + '/mr_backup/' + fil + '.json',
            JSON.stringify(myData[fil][2])
        )
        // console.log(status)
        if (status[0] && myEnv.verbose) {
            console.log(
                'SUCCESS: created file [' +
                myEnv.workDir + '/mr_backup/' + fil + '.json' +
                '] for all ' + fil + '.'
            )
        }
    }
    // Create ZIP package and move to backup dir
    const [zipSuccess, zipMsg, zipResult] = await utils.createZIPArchive(
        myEnv.outputDir + '/' + myEnv.backupFile, myEnv.workDir + '/mr_backup/'
    )
    if (zipSuccess) {
        console.log('SUCCESS: created backup package [' + myEnv.outputDir + '/' + myEnv.backupFile + '].')
        // Cleanup the working content
        const [rmSuccess, rmMsg, rmResult] = utils.rmDir(myEnv.workDir + '/mr_backup/')
        if (rmSuccess && myEnv.verbose) {
            console.log(
                'SUCCESS: cleaned up the temporary backup directory [' +
                myEnv.workDir + '/mr_backup/' + '].'
            )
        }
    } else {
        const code = -1
        console.error('ERROR (%d): Failed to create backup package [' + zipMsg + ']', code)
        process.exit(code)
    }

} else if (myEnv.operation == 'restore') {
    // Extract ZIP package
    utils.extractZIPArchive(myEnv.outputDir + '/' + myEnv.backupFile, myEnv.workDir + '/mr_restore')
    // Restores
    /* 
    Ultimately we will want to enable recovery of individual objects this is emulating that logic for now.
    */
    const [doUsers, doCompanies, doInteractions, doStudies] = [true, true, true, true] // This is temporary

    // User objects
    if (doUsers) {
        restoreObjects(myEnv.workDir + '/mr_restore/users.json')
    }

    // Company objects
    if (doCompanies) {
        restoreObjects(myEnv.workDir + '/mr_restore/companies.json')
    }

    // Interaction objects
    if (doInteractions) {
        restoreObjects(myEnv.workDir + '/mr_restore/interactions.json')
    }

    // Study objects
    if (doStudies) {
        restoreObjects(myEnv.workDir + '/mr_restore/studies.json')
    }

    // Cleanup the working files
    utils.rmDir(myEnv.workDir + '/mr_restore/')
}