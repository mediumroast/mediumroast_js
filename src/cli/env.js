/**
 * @fileoverview A class used by CLIs to capture and set environmental variables
 * @license Apache-2.0
 * @version 2.5.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file env.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @class Environment
 * @classdesc A class to create consistent CLI envrionmentals for mediumroast.io objects
 * 
 * @requires commander
 * @requires configparser
 * @requires filesystem
 * 
 * @exports Environment
 * 
 * @example
 * const env = new Environmentals()
 * const program = env.parseCLIArgs()
 * const config = env.readConfig(program.conf_file)
 * const envSettings = env.getEnv(program, config)
 * 
 * 
 */

// Import required modules
import program from 'commander'
import ConfigParser from 'configparser'
import FilesystemOperators from './filesystem.js'


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
        this.fsUtils = new FilesystemOperators()
    }

    /**
     * @function parseCLIArgs
     * @description Consistently parse the CLI for options and switches
     * @returns {Object} - an object containing all CLI options and switches
     */
    parseCLIArgs(returnInomplete=false) {
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
                `Find individual ${this.objectType} by name`
            )
            .option(
                '--find_by_x <JSON>',
                `Find ${this.objectType} by an arbitrary attribute as specified by JSON (ex \'{\"zip_postal\":\"92131\"}\')`
            )
            .option(
                '--update <JSON>',
                `Update ${this.objectType} from the backend by specifying the object\'s name plus attribute and value to update in JSON`
            )
            .option(
                '--delete <name>',
                `Delete ${this.objectType} from the backend by specifying the object\'s id`
            )
            .option(
                '--report <name>',
                `Create an MS word document for ${this.objectType} by specifying the object\'s id`
            )
            .option(
                '--package',
                'An additional switch used with --report to generate a ZIP package that includes the Interaction artifact(s)'
            )
            .option(
                '--add_wizard',
                `Run the CLI wizard to add ${this.objectType} to the mediumroast.io backend.`
            )
            .option(
                '--reset_by_name <name>',
                'Reset the status of an individual object by name to 0.'
            )
            .option(
                '--persona [type]',
                'Select the persona type: product or analyst.',
                'product',
                'analyst'
            )
        
        // If returnIncomplete is set to true return the program object directly
        if (returnInomplete) {
            return program
        }
        program.parse(process.argv)
        return program.opts()
    }

    /**
     * @function removeArgByName
     * @description Remove an argument from the CLI by name
     * @param {Object} program - the program object from the CLI
     * @param {String} name - the name of the argument to remove
     * @returns {Object} the program object with the argument removed
     * @example
     * const env = new Environmentals()
     * const program = env.parseCLIArgs()
     * env.removeArgByName(program, 'conf_file')
     * 
     * // program will now be missing the conf_file argument
    */
    removeArgByName(program, name) {
        const index = program.options.findIndex(option => option.short === name || option.long === name);
        if (index !== -1) {
          program.options.splice(index, 1)
        }
        return program
    }

    /**
     * @function readConfig
     * @description Using the configFile argument read, parse and return the contents of a configuration file
     * @param {String} configFile - a fully qualified path to the configuration file
     * @returns {Object} The object containing the parsed configuration file results
     */
    readConfig(configFile) {
        const configurator = new ConfigParser()
        configurator.read(configFile)
        return configurator
    }

    /**
     * @function checkConfigDir
     * @description
     * @param {*} configDir - the directory to the configuration file
     * @param {*} configFile - the name of the configuration file
     * @returns {String} The full path to the configuration file
     */
    checkConfigDir(configDir='/.mediumroast', configFile='config.ini') {
        this.fsUtils.safeMakedir(process.env.HOME + configDir)
        return process.env.HOME + configDir + '/' + configFile
    }

    /**
     * @function removeConfigSetting
     * @description Remove a setting from a configuration
     * @param {Object} configurator - A configurator object that can be used to operate on a configuration
     * @param {String} sectionName - The name of the section to add 
     * @param {String} setting - The name of the setting to update
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the configurator object or error message
     */
    removeConfigSetting(configurator, sectionName, setting) {
        try {
            configurator.removeKey(sectionName, setting)
        } catch (err) {
            return [false, err]
        }

        return [true, configurator]
    }

    /**
     * @function addConfigSection
     * @description Add a section named sectionName to a configuration
     * @param {Object} configurator - A configurator object that can be used to operate on a configuration
     * @param {String} sectionName - The name of the section to add
     * @param {Object} config - The contents for the section to add
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being null/err
     */
    addConfigSection(configurator, sectionName, config) {
        try {
            configurator.addSection(sectionName)
        } catch (err) {
            return [false, err]
        }

        for(const setting in config){
            configurator.set(sectionName, setting, config[setting])
        }

        return [true, configurator]
    }

    /**
     * @function getConfigSetting
     * @description Safely retrieve the value of setting in sectionName
     * @param {Object} configurator - A constructed instance of ConfigParser
     * @param {String} sectionName - The name of the section the setting resides in
     * @param {String} setting - The name of the setting to update
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the setting's value
     */
    getConfigSetting(configurator, sectionName, setting) {
        // Check if it exists
        const keyExists = configurator.hasKey(sectionName, setting)
        if (keyExists) {
            // Get and return the setting
            
            return [true, configurator.get(sectionName, setting)] 
        } else {
            return [false, `Error: [${sectionName}: ${setting}] doesn't exist.`]
        }
    }

    /**
     * @function updateConfigSetting
     * @description Remove and replace an existing configuration setting in sectionName with value.
     * @param {Object} configurator - A constructed instance of ConfigParser
     * @param {String} sectionName - The name of the section the setting resides in
     * @param {String} setting - The name of the setting to update
     * @param {String} value - The value for the setting
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the configurator object
     */
    updateConfigSetting(configurator, sectionName, setting, value) {
        // Check if it exists
        const keyExists = configurator.hasKey(sectionName, setting)
        if (keyExists) {
            // Remove the setting
            configurator.removeKey(sectionName, setting)
            // Add it back
            configurator.set(sectionName, setting, value)
            return [true, configurator] 
        } else {
            return [false, configurator]
        }
    }

    /**
     * @function writeConfig
     * @description Write a configuration file to configFile from the configuration config
     * @param {*} config - a object with various sections to be written to a config file
     * @param {*} configFile - the fully qualified path to the configuration file
     */
    writeConfig(configurator, config, configFile) {
        // Write the config file
        for(const section in config){
            configurator.addSection(section)
            for(const setting in config[section]){
                configurator.set(section, setting, config[section][setting])
            }
        }
        // This won't return anything so we'll need to see if we can find another way to determine success/failure
        configurator.write(configFile)
    }


    /**
     * @function getEnv
     * @description With the CLI arguments as the priority create an environmentals object to be used in the CLI
     * @param {Object} cliArgs - should contain the results of parseCLIArgs() above
     * @param {Object} config - should contain the results of getConfig() above
     * @returns {Object} after merging cliArgs and config an Object containing the final environmental settings 
     * @todo When we're back to mrServer we will want to change the environment
     */
    getEnv(cliArgs, config) {
        let env = {}

        // Set up additional parameters from config file
        env.workDir = process.env.HOME + '/.mediumroast/' + config.get('DEFAULT', 'working_directory')
        env.companyDNS = config.get('DEFAULT', 'company_dns')
        env.companyLogos = config.get('DEFAULT', 'company_logos')
        env.echartsServer = config.get('DEFAULT', 'echarts')
        env.nominatim = config.get('DEFAULT', 'nominatim')
        env.theme = config.get('DEFAULT', 'theme')
        env.outputDir = process.env.HOME + '/' + config.get('DEFAULT', 'report_output_dir')
        env.clientId = config.get('GitHub', 'clientId')
        env.appId = config.get('GitHub', 'appId')
        env.deviceCodeUrl = config.get('GitHub', 'deviceCodeUrl')
        env.accessTokenUrl = config.get('GitHub', 'accessTokenUrl')
        env.gitHubOrg = config.get('GitHub', 'org')
        env.authType = config.get('GitHub', 'authType')
        env.deviceCode = config.get('GitHub', 'deviceCode')

        // Setup options with cli settings only
        env.splash = cliArgs.splash
        env.persona = cliArgs.persona || 'product'

        // Return the environmental settings needed for the CLI to operate
        return env
    }
}

export default Environmentals