#!/usr/bin/env node

// Import required modules
import * as fs from 'fs'
import { Auth, Interactions } from '../src/api/mrServer.js'
import program from 'commander'
import ConfigParser from 'configparser'
import Table from 'cli-table'
import {Parser} from 'json2csv'
import * as XLSX from 'xlsx'

// Parse the cli options
function parseCLIArgs(name = 'interaction', version = '2.0') {
   // Define commandline options
   program
      .name(name)
      .version(version)
      .description('A CLI for mediumroast.io Interaction objects, without options or switches lists all Interactions. Other operations include adding, updating and deleting objects.')

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

function getConfig(confFile) {
   const config = new ConfigParser() // Config file
   config.read(confFile)
   return config
}

function getEnv(cliArgs, config) {
   let env = {
      "restServer": null,
      "apiKey": null,
      "user": null,
      "secret": null
   }

   // With the cli options as the priority set up the environment for the cli
   cliArgs.rest_server ? env['restServer'] = cliArgs.rest_server : env['restServer'] = config.get('DEFAULT', 'rest_server')
   cliArgs.api_key ? env['apiKey'] = cliArgs.api_key : env['apiKey'] = config.get('DEFAULT', 'api_key')
   cliArgs.user ? env['user'] = cliArgs.user : env['user'] = config.get('DEFAULT', 'user')
   cliArgs.secret ? env['secret'] = cliArgs.secret : env['secret'] = config.get('DEFAULT', 'secret')

   // Set up additional parameters from config file
   env['workDir'] = config.get('DEFAULT', 'working_dir')
   env['outputDir'] = config.get('document_settings', 'output_dir')

   return env
}

function outputTable(objects) {
   let table = new Table({
      head: ['Id', 'Name', 'Type', 'Region', 'Description'],
      colWidths: [4, 30, 15, 6, 85]
   })

   for (const myObj in objects) {
      table.push([
         objects[myObj].id,
         objects[myObj].name,
         objects[myObj].interaction_type,
         objects[myObj].region,
         objects[myObj].description
      ])
   }
   console.log(table.toString())
}

function outputCSV(objects, env, fileName='Mr_Interactions.csv') {
   const myFile = process.env.HOME + '/' + env['outputDir'] + '/' + fileName
   const parser = new Parser()
   const csv = parser.parse(objects)
   saveTextFile(myFile, csv)
}

function outputXLS(objects, env, workBook, fileName='Mr_Interactions.xlsx', ) {
   const myFile = process.env.HOME + '/' + env['outputDir'] + '/' + fileName
   const mySheet = XLSX.utils.json_to_sheet(objects)
   const myWorkbook = XLSX.utils.book_new()
   XLSX.utils.book_append_sheet(myWorkbook, mySheet, workBook)
   console.log(myFile)
   XLSX.writeFile(myWorkbook, myFile)
}

function saveTextFile (fileName, content) {
   fs.writeFileSync(fileName, content, err => {
      if (err) {
        console.error(err);
      } else {
         console.log('Successfully wrote to [' + fileName + '].')
      }
   })
}

function saveBinaryFile (fileName, content) {
   fs.writeFileSync(fileName, content, 'binary', err => {
      if (err) {
        console.error(err);
      } else {
         console.log('Successfully wrote to [' + fileName + '].')
      }
   })
}

// Set up the environment for later use
const myArgs = parseCLIArgs()
const myConfig = getConfig(myArgs.conf_file)
const myEnv = getEnv(myArgs, myConfig)

// Build the credential needed for each API call
const myAuth = new Auth(
   myEnv.restServer,
   myEnv.apiKey,
   myEnv.user,
   myEnv.secret
)
const credential = myAuth.login()

// Instantiate the api controller object
const apiController = new Interactions(credential)

// Predefine the results variable
let results = null

// Process the cli options
if (myArgs.get_by_id) {
   results = await apiController.getById(myArgs.get_by_id)
} else if (myArgs.get_by_name) {
   results = await apiController.getByName(myArgs.get_by_name)
} else if (myArgs.get_by_x) {
   // TODO this requires a JSON input, need to investigate
   results = await apiController.getByX(myArgs.get_by_x)
} else if (myArgs.create) {
   results = await apiController.create(myArgs.create)
} else if (myArgs.delete) {
   results = await apiController.delete(myArgs.delete)
} else {
   results = await apiController.getAll()
}

// Emit the output as per the cli options
if (myArgs.output === 'table') {
   outputTable(results)
} else if (myArgs.output === 'json') {
   console.dir(results)
} else if (myArgs.output === 'csv') {
   outputCSV(results, myEnv)
} else if (myArgs.output === 'xls') {
   outputXLS(results, myEnv, 'Interactions')
}
