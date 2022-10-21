/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file cli.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import program from 'commander'
import ConfigParser from 'configparser'
import Table from 'cli-table'
import Parser from 'json2csv'
import * as XLSX from 'xlsx'
import logo from 'asciiart-logo'
import { Utilities } from './helpers.js'


class CLIUtilities {
    /**
     * A class to create consistent CLI operations for mediumroast.io objects like
     * interactions, studies, companies and users.  The functions within help with environmental
     * settings, command line switches and output formatting.
     * @constructor
     * @classdesc Construct a CLI object with key parameters
     * @param {String} version - the version for the CLI
     * @param {String} name - name for the CLI
     * @param {String} description - a description for the CLI
     * @param {String} objectType - the type of objects the CLI manages
     */
    constructor(version, name, description, objectType) {
        this.version = version
        this.name = name
        this.description = description
        this.objectType = objectType
        this.utils = new Utilities(objectType)
    }

    /**
     * @function parseCLIArgs
     * @description Consistently parse the CLI for options and switches
     * @returns {Object} - an object containing all CLI options and switches
     */
    parseCLIArgs() {
        // Define commandline options
        program
            .name(this.name)
            .version(this.version)
            .description(this.description)

        program
            // System command line switches
            .requiredOption(
                '-c --conf_file <file>',
                'Path to the configuration file',
                process.env.HOME + '/.mediumroast/config.ini'
            )
            .option(
                '-r --rest_server <http://server:port>',
                'The URL of the target mediumroast.io server'
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
                '-o --output <choose the output type to emit>',
                'Select output type: table, json, xls or csv. xls & csv will save to a file.',
                'table',
                'json',
                'xls',
                'csv'
            )
            .option(
                '-s --splash <yes | no>',
                'Whether or not to include the splash screen at startup.',
                'yes',
                'no'
            )

            // Operational command line switches
            .option(
                '--find_by_name <name>',
                'Find an individual Interaction by name'
            )
            .option(
                '--find_by_id <ID>',
                'Find an individual Interaction by ID'
            )
            .option(
                '--find_by_x <JSON>',
                'Find object by an arbitrary attribute as specified by JSON (ex \'{\"zip_postal\":\"92131\"}\')'
            )
            .option(
                '--create <file.json>',
                'Add objects to the backend by specifying a JSON file'
            )
            .option(
                '--update <JSON>',
                'Update an object from the backend by specifying the object\'s id and value to update in JSON'
            )
            .option(
                '--delete <ID>',
                'Delete an object from the backend by specifying the object\'s id'
            )
            .option(
                '--report <ID>',
                'Create an MS word document for an object by specifying the object\'s id'
            )
            .option(
                '--package',
                'An additional switch used with --report to generate a ZIP package that includes the interaction'
            )
            .option(
                '--add_company',
                'Run the CLI wizard to add a company to the mediumroast.io backend.'
            )

        program.parse(process.argv)
        return program.opts()
    }

    /**
     * @function getConfig
     * @description Using the confFile argument read, parse and return the contents of a configuration file
     * @param {String} confFile - a fully qualified path to the configuration file
     * @returns {Object} The object containing the parsed configuration file results
     */
    getConfig(confFile) {
        const config = new ConfigParser()
        config.read(confFile)
        return config
    }


    /**
     * @function getEnv
     * @description With the CLI arguments as the priority create an environmentals object to be used in the CLI
     * @param {Object} cliArgs - should contain the results of parseCLIArgs() above
     * @param {Object} config - should contain the results of getConfig() above
     * @returns {Object} after merging cliArgs and config an Object containing the final environmental settings 
     */
    getEnv(cliArgs, config) {
        let env = {
            "restServer": null,
            "apiKey": null,
            "user": null,
            "secret": null,
            "workDir": null,
            "outputDir": null,
            "s3Server": null,
            "s3User": null,
            "s3APIKey": null,
            "s3Region": null,
            "s3Source": null,
            "splash": null
        }

        // With the cli options as the priority set up the environment for the cli
        cliArgs.rest_server ? env.restServer = cliArgs.rest_server : env.restServer = config.get('DEFAULT', 'rest_server')
        cliArgs.api_key ? env.apiKey = cliArgs.api_key : env.apiKey = config.get('DEFAULT', 'api_key')
        cliArgs.user ? env.user = cliArgs.user : env.user = config.get('DEFAULT', 'user')
        cliArgs.secret ? env.secret = cliArgs.secret : env.secret = config.get('DEFAULT', 'secret')

        // Set up additional parameters from config file
        env.workDir = config.get('DEFAULT', 'working_dir')
        env.outputDir = process.env.HOME + '/' + config.get('document_settings', 'output_dir')
        env.s3Server = config.get('s3_settings', 'server')
        env.s3User = config.get('s3_settings', 'user')
        env.s3Region = config.get('s3_settings', 'region')
        env.s3APIKey = config.get('s3_settings', 'api_key')
        env.s3Source = config.get('s3_settings', 'source')

        // Setup options with cli settings only
        env.splash = cliArgs.splash

        // Return the environmental settings needed for the CLI to operate
        return env
    }


    /**
     * @function outputCLI
     * @description An output router enabling users to pick their output format of choice for a CLI
     * @param  {String} outputType Type of output to produce/route to: table, json, csv, xls
     * @param  {Object} results Data objects to be output
     * @param  {Object} env Environmental variables from the CLI
     * @param  {String} objType The object type: Interactions, Studies or Companies
     */
    outputCLI(outputType, results, env, objType) {
        // Emit the output as per the cli options
        if (outputType === 'table') {
            this.outputTable(results)
        } else if (outputType === 'json') {
            console.dir(results)
        } else if (outputType === 'csv') {
            this.outputCSV(results, env)
        } else if (outputType === 'xls') {
            this.outputXLS(results, env, objType)
        }
    }

    outputTable(objects) {
        let table = new Table({
            head: ['Id', 'Name', 'Description'],
            colWidths: [5, 40, 90]
        })

        for (const myObj in objects) {
            table.push([
                objects[myObj].id,
                objects[myObj].name,
                objects[myObj].description
            ])
        }
        console.log(table.toString())
    }

    outputCSV(objects, env) {
        const fileName = 'Mr_' + this.objectType + '.csv'
        const myFile = env['outputDir'] + '/' + fileName
        const csv = Parser.parse(objects)
        this.utils.saveTextFile(myFile, csv)
    }

    // TODO add error checking via try catch
    outputXLS(objects, env) {
        const fileName = 'Mr_' + this.objectType + '.xlsx'
        const myFile = env['outputDir'] + '/' + fileName
        const mySheet = XLSX.utils.json_to_sheet(objects)
        const myWorkbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
        XLSX.writeFile(myWorkbook, myFile)
    }

    /**
     * @function splasgScreen
     * @description print a splash screen with using name as the big title, description as the subtitle and a version declaration
     * @param {String} name Used for the big title on the splash screen.
     * @param {String} description Forms the subtitle on the splash screen.
     * @param {String} description Defines the version number on the splash screen.
     */
    splashScreen (name, description, version) {
        const logoConfig = {
            name: name,
            // font: 'Speed',
            lineChars: 10,
            padding: 3,
            margin: 3,
            borderColor: 'bold-gray',
            logoColor: 'bold-orange',
            textColor: 'orange',
        }
        // Print out the splash screen
        console.log(
            logo(logoConfig)
            .emptyLine()
            .right(version)
            .emptyLine()
            .center(description)
            .render()
        )
    }
}

export { CLIUtilities }