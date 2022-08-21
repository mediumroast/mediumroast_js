// Import required modules
import * as fs from 'fs'
import program from 'commander'
import ConfigParser from 'configparser'
import Table from 'cli-table'
import {Parser} from 'json2csv'
import * as XLSX from 'xlsx'

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
            '--get_by_name <name>',
            'Get an individual Interaction by name'
        )
        .option(
            '--get_by_id <ID>',
            'Get an individual Interaction by ID'
        )
        .option(
            '--get_by_x <JSON>',
            'Get object by an arbitrary attribute as specified by JSON (ex \'{\"zip_postal\":\"92131\"}\')'
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
        this.saveTextFile(myFile, csv)
     }
     
     // TODO add error checking
     outputXLS(objects, env) {
        const fileName = 'Mr_' + this.objectType + '.xlsx'
        const myFile = process.env.HOME + '/' + env['outputDir'] + '/' + fileName
        const mySheet = XLSX.utils.json_to_sheet(objects)
        const myWorkbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
        XLSX.writeFile(myWorkbook, myFile)
     }

    saveTextFile (fileName, content) {
        fs.writeFileSync(fileName, content, err => {
           if (err) {
             console.error(err);
           } else {
              console.log('Successfully wrote to [' + fileName + '].')
           }
        })
    }

    outputCLI (outputType, results, env, objType) {
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
}

export { CLI }