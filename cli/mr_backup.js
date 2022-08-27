#!/usr/bin/env node

// Import required modules
import { Auth, Companies, Interactions, Studies, Users } from '../src/api/mrServer.js'
import CLI from '../src/helpers.js'
import ConfigParser from 'configparser'
import program from 'commander'

// Parse the cli options
function parseCLIArgs() {
    // Define commandline options
    program
        .name(this.name) // Set this
        .version(this.version) // Set this
        .description(this.description) // Set this

    program
        // System command line switches
        .requiredOption(
            '-c --conf_file <file>',
            'Path to the configuration file',
            process.env.HOME + '/.mediumroast/config.ini'
        )
        .option(
            '-r --rest_server <server>',
            'The URL of the target mediumroast.io server',
            'http://cherokee.from-ca.com:46767'
        )
        .option(
            '-a --api_key <key>',
            'The API key needed to talk to the mediumroast.io server'
        )
        .option(
            '-u --user <user name>',
            'Your user name for the mediumroast.io server'
        )
        .option(
            '-s --secret <user secret or password>',
            'Your user secret or password for the mediumroast.io server'
        )
        .option(
            '-o --output_dir <output location>',
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
            '--operation',
            'Specify which process to perform from: backup or restore',
            'backup',
            'restore'
        )
        .option(
            '--object_type',
            'Specify which type of object(s) to backup/restore',
            'all',
            'interactions',
            'studies',
            'companies',
            'users'
        )
        .option(
            '--backup_file',
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
    const backupFileName = 'mr_backup_full_' + currentTimeInSeconds

    let env = {
        "restServer": null,
        "apiKey": null,
        "user": null,
        "secret": null,
        "workDir": null,
        "outputDir": null,
        "operation": null,
        "objectType": null,
        "backupFile": null
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

    return env
}

function restoreObjects (fileName, apiController) {
    let [success, msg, rawData] = myCli.readTextFile(fileName)
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
const myCli = new CLI(null, null, null, null)

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
const usersController = new Users(myCredential)

// Check working and backup output directories
myCli.safeMakedir(myEnv.outputDir)
myCli.safeMakedir(myEnv.workDir)
myCli.safeMakedir(myEnv.workDir + '/mr_backup') // Working directory for backup packages
myCli.safeMakedir(myEnv.workDir + '/mr_restore') // Working directory for restores

if (myEnv.operation == 'backup') {
    // Get the data
    const myData = {
        "companies": await compController.getAll(),
        "interactions": await intController.getAll(),
        "studies": await studController.getAll(),
        "users": await usersController.getAll()
    }
    // Save the data to individual JSON files
    for (const fil in myData) {
        myCli.saveTextFile(
            myEnv.workDir + '/mr_backup/' + fil + '.json',
            JSON.stringify(myData[fil])
        )
    }
    // Create ZIP package and move to backup dir
    myCli.createZIPArchive(myEnv.outputDir + '/' + myEnv.backupFile, myEnv.workDir + '/mr_backup/')
    // Cleanup the working content
    myCli.rmDir(myEnv.workDir + '/mr_backup/')
} else if (myEnv.operation == 'restore') {
    // Extract ZIP package
    myCli.extractZIPArchive(myEnv.outputDir + '/' + myEnv.backupFile, myEnv.workDir + '/mr_restore')
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
    myCli.rmDir(myEnv.workDir + '/mr_restore/')
}