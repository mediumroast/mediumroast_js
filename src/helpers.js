/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file helpers.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import * as fs from 'fs'
import program from 'commander'
import ConfigParser from 'configparser'
import Table from 'cli-table'
import Parser from 'json2csv'
import * as XLSX from 'xlsx'
import zip from 'adm-zip'

class CLI {
    constructor(version, name, description, objectType) {
        this.version = version
        this.name = name
        this.description = description
        this.objectType = objectType
    }

    // Parse the cli options
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
                '-o --output <choose the output type to emit>',
                'Select output type: table, json, xls or csv. xls & csv will save to a file.',
                'table',
                'json',
                'xls',
                'csv'
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

        program.parse(process.argv)
        return program.opts()
    }

    getConfig(confFile) {
        const config = new ConfigParser()
        config.read(confFile)
        return config
    }

    getEnv(cliArgs, config) {
        let env = {
            "restServer": null,
            "apiKey": null,
            "user": null,
            "secret": null,
            "workDir": null,
            "outputDir": null
        }

        // With the cli options as the priority set up the environment for the cli
        cliArgs.rest_server ? env.restServer = cliArgs.rest_server : env.restServer = config.get('DEFAULT', 'rest_server')
        cliArgs.api_key ? env.apiKey = cliArgs.api_key : env.apiKey = config.get('DEFAULT', 'api_key')
        cliArgs.user ? env.user = cliArgs.user : env.user = config.get('DEFAULT', 'user')
        cliArgs.secret ? env.secret = cliArgs.secret : env.secret = config.get('DEFAULT', 'secret')

        // Set up additional parameters from config file
        env.workDir = config.get('DEFAULT', 'working_dir')
        env.outputDir = config.get('document_settings', 'output_dir')

        return env
    }


    /**
     * An output router enabling users to pick their output format of choice for a CLI
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
        const myFile = process.env.HOME + '/' + env['outputDir'] + '/' + fileName
        const parser = new Parser()
        const csv = parser.parse(objects)
        success, message = this.saveTextFile(myFile, csv)
    }

    // TODO add error checking via try catch
    outputXLS(objects, env) {
        const fileName = 'Mr_' + this.objectType + '.xlsx'
        const myFile = process.env.HOME + '/' + env['outputDir'] + '/' + fileName
        const mySheet = XLSX.utils.json_to_sheet(objects)
        const myWorkbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
        XLSX.writeFile(myWorkbook, myFile)
    }

    

    saveTextFile(fileName, content) {
        fs.writeFileSync(fileName, content, err => {
            if (err) {
                return false, 'Did not save file [' + fileName + '] because: ' + err
            } else {
                return true, 'Saved file [' + fileName + ']'
            }
        })
    }

    readTextFile(fileName) {
        try {
            const fileData = fs.readFileSync(fileName, 'utf8')
            return true, 'Read file [' + fileName + ']', fileData
        } catch (err) {
            return false, 'Unable to read file [' + fileName + '] because: ' + err
        }
    }

    // simple function for safe directory creation
    safeMakedir(name) {
        try {
            if (!fs.existsSync(name)) {
                fs.mkdirSync(name)
                return true, 'Created directory [' + name + ']'
            }
        } catch (err) {
            return false, 'Did not create directory [' + name + '] because: ' + err
        }
    }

    // Recursively remove a directory
    rmDir(dirName) {
        try {
            fs.rmdirSync(dirName, {recursive: true})
            return true, 'Removed directory [' + dirName + '] and all contents'
        } catch (err) {
            return false, 'Did not remove directory [' + dirName + '] because: ' + err
        }
    }

    // create a ZIP package
    async createZIPArchive(outputFile, sourceDirectory) {
        try {
            const zipPackage = new zip()
            zipPackage.addLocalFolder(sourceDirectory)
            zipPackage.writeZip(outputFile)
            console.log(`Created ${outputFile} successfully`)
        } catch (e) {
            console.log(`Something went wrong. ${e}`)
        }
    }

    // Extract a ZIP package
    async extractZIPArchive(inputFile, targetDirectory) {
        try {
            const zipPackage = new zip(inputFile)
            zipPackage.extractAllTo(targetDirectory, true)
            console.log(`Extracted ${outputFile} successfully`)
        } catch (e) {
            console.log(`Something went wrong. ${e}`)
        }
    }

    
}

export { CLI }