#!/usr/bin/env node

/**
 * A CLI utility used for accessing and reporting on mediumroast.io interaction objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file s3.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.2.0
 */

// Import required modules
import ConfigParser from 'configparser'
import program from 'commander'
import chalk from 'chalk'
import FilesystemOperators from '../src/cli/filesystem.js' 
import serverOperations from '../src/cli/common.js'
import Environmentals from '../src/cli/env.js'
import s3Utilities from '../src/cli/s3.js'

// console.log('NOTICE: This CLI is presently a work in progress and will not operate, exiting.')
// process.exit(0)

/* 
    -----------------------------------------------------------------------

    FUNCTIONS - Key functions needed for MAIN

    ----------------------------------------------------------------------- 
*/

// Parse the cli options
function parseCLIArgs() {
    const name = 's3'
    const version = '1.5.0'
    const description = 'A mediumroast.io CLI utility to archive files associated to interactions stored within an s3 bucket.'
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
        .requiredOption(
            '--output_dir <output location>',
            'Select output location to to store the backup'
        )
        .option(
            '--s3_server <s3_server>',
            'The URL of the target S3 server'
        )
        .option(
            '--s3_api_key <s3_api_key>',
            'The URL of the target S3 server'
        )
        .option(
            '--s3_region <s3_region>',
            'The S3 region for the S3 server'
        )
        .option(
            '--rest_server <rest_server>',
            'The URL of the target mediumroast.io server'
        )
        .option(
            '--rest_api_key <rest_api_key>',
            'The API key needed to talk to the mediumroast.io server'
        )
        .option(
            '--s3_user <user>',
            'Your user name for the s3 server'
        )

        // Operational command line switches
        .option(
            '--verbose',
            'Specify whether or not to print out details of the backup process'
        )
        .option(
            '--operation <operation to perform>',
            'Specify which process to perform from: archive or unarchive ',
            'archive',
            'unarchive'
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

    let env = {
        restServer: null,
        apiKey: null,
        s3Server: null,
        s3User: null,
        s3APIKey: null,
        s3Region: null,
        outputDir: null,
        bucket: null,
        operation: null,
        verbose: null,
        user: null,
        secret: null
    }

    // S3 settings
    cliArgs.s3_server ? env.s3Server = cliArgs.s3_server : env.s3Server = config.get('s3_settings', 'server')
    cliArgs.s3_api_key ? env.s3APIKey = cliArgs.s3_api_key : env.s3APIKey = config.get('s3_settings', 'api_key')
    cliArgs.s3_user ? env.s3User = cliArgs.s3_user : env.s3User = config.get('s3_settings', 'user')
    cliArgs.s3_region ? env.s3Region = cliArgs.s3_region : env.s3Region = config.get('s3_settings', 'region')

    // Mediumroast.io settings
    cliArgs.rest_server ? env.restServer = cliArgs.rest_server : env.restServer = config.get('DEFAULT', 'rest_server')
    cliArgs.rest_api_key ? env.apiKey = cliArgs.rest_api_key : env.apiKey = config.get('DEFAULT', 'api_key')

    // Set up additional parameters from command line switches
    env.outputDir = cliArgs.output_dir
    env.archiveDir = env.outputDir + '/bucket'
    env.s3Metadata = env.outputDir + '/s3_meta.json'
    env.operation = cliArgs.operation
    env.verbose = cliArgs.verbose
    env.user = config.get('DEFAULT', 'user')
    env.secret = config.get('DEFAULT', 'secret')

    return env
}

function prepare() {
    // Business end of the CLI
    const myArgs = parseCLIArgs()
    const myConfig = getConfig(myArgs.conf_file)
    const myEnv = getEnv(myArgs, myConfig)

    // Construct the file system object
    const myFilesystem = new FilesystemOperators()

    // Check the output directory
    myFilesystem.safeMakedir(myEnv.archiveDir) // Target directory for archival process

    // Return the environmental setting
    return myEnv
}

async function checkServer(myEnv) {
    process.stdout.write(chalk.blue.bold('Performing checks to see if the server is ready. '))
    const serverChecks = new serverOperations(myEnv)
    const serverReady = await serverChecks.checkServer()

    if(serverReady[0]) { // We are looking to ensure that the system is empty without interactions
        console.log(chalk.red.bold('[No objects detected, exiting]'))
        process.exit(-1)
    } else { // We've detected that at least one object has been found on the system so we cannot proceed
        console.log(chalk.green.bold('[Objects detected, ready.]'))
        return serverReady
    }
}

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Prepare the environment for the archive
const myEnv = prepare()


// S3 controller object
const s3 = new s3Utilities(myEnv)


if (myEnv.operation == 'archive') {
    // Check to see if the server is ready for adding interactions
    const myServer = await checkServer(myEnv)

    // Download the bucket
    const myOwner = myServer[2].owner
    const myS3Meta = {
        bucket: s3.generateBucketName(myOwner),
        owner: myOwner
    }
    console.log(chalk.blue.bold(`Preparing to archive bucket [${myS3Meta.bucket}] to [${myEnv.archiveDir}]` ))
    await s3.s3DownloadBucket(myEnv.archiveDir, myS3Meta.bucket)

    // Save the metadata
    const myFilesystem = new FilesystemOperators()
    const metaFile = myEnv.outputDir + '/archive_meta.json'
    process.stdout.write(chalk.blue.bold(`Saving archive metadata ` ))
    const saveResults = myFilesystem.saveTextFile(metaFile, JSON.stringify(myS3Meta))
    if(saveResults[0]) {
        console.log(chalk.green.bold(`[Saved data to ${metaFile}]`))
    } else {
        console.log(chalk.red.bold(`[Unable to save data to ${metaFile}] due to ${saveResults[1]}`))
    }

} else if (myEnv.operation == 'unarchive') {
    await s3.s3UploadBucket(myEnv.archiveDir, myEnv.s3Bucket)
}