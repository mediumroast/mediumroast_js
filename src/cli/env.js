/**
 * A class used by CLIs to capture and set environmental variables
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file env.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.2.0
 */

// Import required modules
import program from 'commander'
import ConfigParser from 'configparser'


class Environmentals {
    /**
     * A class to create consistent CLI envrionmentals for mediumroast.io objects like
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
                '--experimental',
                'An additional switch used with --report to enable experimental charting for reporting. Requires Apache e-charts server.'
            )
            .option(
                '--add_wizard',
                `Run the CLI wizard to add a ${this.objectType} to the mediumroast.io backend.`
            )
            .option(
                '--reset_by_type <OBJECT_TYPE>',
                'Reset the status of objects to reprocesses them in the caffeine service.'
            )

            // Ending arguments
            // .argument(
            //     '[string]',
            //     'A fully qualified path to the resource in file system to include, exclusively used for interactions'
            // )

        program.parse(process.argv)
        return program.opts()//, program.args
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
            restServer: null,
            apiKey: null,
            user: null,
            secret: null,
            workDir: null,
            outputDir: null,
            s3Server: null,
            s3User: null,
            s3APIKey: null,
            s3Region: null,
            s3Source: null, // TODO this is deprecated remove after testing
            splash: null,
            companyDNS: null,
            reset: null,
            experimental: null,
            echartsServer: null
        }

        // With the cli options as the priority set up the environment for the cli
        cliArgs.rest_server ? env.restServer = cliArgs.rest_server : env.restServer = config.get('DEFAULT', 'rest_server')
        cliArgs.api_key ? env.apiKey = cliArgs.api_key : env.apiKey = config.get('DEFAULT', 'api_key')
        cliArgs.user ? env.user = cliArgs.user : env.user = config.get('DEFAULT', 'user')
        cliArgs.secret ? env.secret = cliArgs.secret : env.secret = config.get('DEFAULT', 'secret')

        // Set up additional parameters from config file
        env.workDir = process.env.HOME + '/.mediumroast/' + config.get('DEFAULT', 'working_dir')
        env.companyDNS = config.get('DEFAULT', 'company_dns_server')
        env.echartsServer = config.get('DEFAULT', 'echarts_server')
        env.theme = config.get('DEFAULT', 'theme')
        env.outputDir = process.env.HOME + '/' + config.get('document_settings', 'output_dir')
        env.s3Server = config.get('s3_settings', 'server')
        env.s3User = config.get('s3_settings', 'user')
        env.s3Region = config.get('s3_settings', 'region')
        env.s3APIKey = config.get('s3_settings', 'api_key')
        env.s3Source = config.get('s3_settings', 'source') // TODO this is deprecated remove after testing

        // Setup options with cli settings only
        env.splash = cliArgs.splash

        // Detect if we want to reset a set of objects by their object_type
        env.reset = cliArgs.reset_by_type

        // Enable experimental charting for reports
        env.experimental = cliArgs.experimental

        // Return the environmental settings needed for the CLI to operate
        return env
    }
}

export default Environmentals