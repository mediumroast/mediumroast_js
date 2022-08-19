#!/usr/bin/env node

// Import required modules
import { Interactions } from '../src/api/mrServer.js'
import program from 'commander'
import ConfigParser from 'configparser'

// Parse the cli options
function parseCLIArgs(version='2.0') {
   // Define commandline options
   program
      .version(version)
      .description('A CLI for mediumroast.io Interaction objects, without options or switches lists all Interactions. Other operations include adding, updating and deleting objects.')
      
   program
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
         'Delete an object from the backend by specifyin the object\'s id'
      )

   program.parse(process.argv)
   return program.opts()
}

// The business end of the cli
const byNameResource = '?interactionName='
const opts = parseCLIArgs()
const serverType = opts.server_type // TODO eventually augment with the CLI config file
const mrServer = opts.server // TODO eventually augment with the CLI config file
const control = new Interactions(mrServer, serverType)
let results = null
if (opts.get_guids) {
   results = await control.getAllGUIDs()
} else if (opts.get_names) {
   results = await control.getAllNames()
} else if (opts.get_map) {
   results = await control.getNamesAndGUIDs()
} else if (opts.get_by_guid) {
   results = await control.getByGUID(opts.get_by_guid)
} else if (opts.get_by_name) {
   results = await control.getByName(opts.get_by_name, byNameResource)
} else {
   results = await control.getAll()
}

console.log(results)
