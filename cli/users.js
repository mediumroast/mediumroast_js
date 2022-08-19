#!/usr/bin/env node

// Import required modules
import {Users} from '../src/api/highLevel.js'
import program from 'commander'

// Parse the cli options
function parseCLIArgs() {
   // Define commandline options
   program
      .version('0.7.5')
      .description('A CLI for mediumroast.io User objects, without options: list all Users.')
   program
      .requiredOption('-s --server <server>', 'Specify the server URL', 'http://mr-01:3000')
      .requiredOption('-t --server_type <type>', 'Specify the server type as [json || mr_server]','json')
      .requiredOption('-c --config_file <file>', 'Path to the configuration file','~/.mr_config')
   program.parse(process.argv)
   const options = program.opts()
   return options
}

// The business end of the cli
const opts = parseCLIArgs()
const serverType = opts.server_type // TODO eventually augment with the CLI config file
const mrServer = opts.server // TODO eventually augment with the CLI config file
const control = new Users(mrServer, serverType)
const results = await control.getAll()

console.log(results)
