/**
 * A class used for consistent outputting of CLI data
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file output.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.2.0
 */

// Import required modules
import Table from 'cli-table'
import {Parser} from '@json2csv/plainjs'
import * as XLSX from 'xlsx'
import logo from 'asciiart-logo'
import FilesystemOperators from './filesystem.js'

class CLIOutput {
    /**
     * A class to enable consistent output formatting for CLI operations
     * @constructor
     * @classdesc Construct utilities, environmental variables and the object type
     * @param {Object} env - An object containing all needed environmental variables
     * @param {String} objectType - A string that contains the type of object using this module
     */
    constructor(env, objectType) {
        this.env = env
        this.objectType = objectType
        this.fileSystem = new FilesystemOperators()
    }

    /**
     * @function outputCLI
     * @description An output router enabling users to pick their output format of choice for a CLI
     * @param  {String} outputType Type of output to produce/route to: table, json, csv, xls
     * @param  {Object} results Data objects to be output
     */
     outputCLI(results, outputType='table') {
        // Emit the output as per the cli options
        if (outputType === 'table') {
            this.outputTable(results)
        } else if (outputType === 'json') {
            console.dir(results)
        } else if (outputType === 'csv') {
            this.outputCSV(results)
        } else if (outputType === 'xls') {
            this.outputXLS(results)
        }
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output an ASCII formatted table with key object metadata to the console
    outputTable(objects) {
        // User objects output
        // Note: The separation between User and other objects is due to their structure. Pointedly 
        //          user objects do not contain name and description fields.
        let table
        if (this.objectType === 'Users') {
            table = new Table({
                head: ['GitHub Id', 'Login', 'User Type', 'Role Name', 'Site Admin'],
                colWidths: [12, 20, 15, 20, 30]
            })
            // NOTE: In this alpha version users aren't yet operable
            for (const myObj in objects) {
                table.push([
                    objects[myObj].id,
                    objects[myObj].login,
                    objects[myObj].type,
                    objects[myObj].role_name,
                    objects[myObj].site_admin
                ])
            }
        } else if (this.objectType === 'Org') {
            table = new Table({
                head: ['Id', 'Name', 'GitHub Url', 'Description'],
            })
            table.push([
                gitHubOrg.id,
                gitHubOrg.name,
                gitHubOrg.html_url,
                gitHubOrg.description,
            ])
        } else if (this.objectType === 'MyUser') {
            table = new Table({
                head: ['GitHub Id', 'Login', 'Name', 'Type', 'Company', 'GitHub Website'],
                colWidths: [12, 20, 30, 10, 25, 50]
            })
            for (const myObj in objects) {
                table.push([
                    objects[myObj].id,
                    objects[myObj].login,
                    objects[myObj].name,
                    objects[myObj].type,
                    objects[myObj].company,
                    objects[myObj].html_url
                ])
            }
        // Study, Company and Interaction objects output
        } else if (this.objectType === 'Companies') {
            table = new Table({
                head: ['Name', 'Role', 'Interaction No.', 'Region', 'Description'],
                colWidths: [27, 15, 17, 8, 60]
            })
            
            for (const myObj in objects) {
                let totalInteractions = 0
                if (Object.keys(objects[myObj].linked_interactions).length) {
                    totalInteractions = Object.keys(objects[myObj].linked_interactions).length
                }
                table.push([
                    objects[myObj].name,
                    objects[myObj].role,
                    totalInteractions,
                    objects[myObj].region,
                    objects[myObj].description

                ])
            }
        } else if (this.objectType === 'Interactions') {
            table = new Table({
                head: ['Name', 'Creator Name', 'Region', 'Linked Company'],
                colWidths: [80, 15, 10, 25]
            })
            for (const myObj in objects) {
                let linkedCompany = 'Orphaned'
                if(Object.keys(objects[myObj].linked_companies).length) {
                    linkedCompany = Object.keys(objects[myObj].linked_companies)[0]
                }
                    
                table.push([
                    objects[myObj].name,
                    objects[myObj].creator_name,
                    objects[myObj].region,
                    linkedCompany
                ])
            }
        } else {
            table = new Table({
                head: ['Name', 'Description'],
                colWidths: [35, 70]
            })
            for (const myObj in objects) {
                table.push([
                    objects[myObj].name,
                    objects[myObj].description
                ])
            }
        }
        console.log(table.toString())
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output a CSV file to this.env.outputDir containing all object metadata
    outputCSV(objects) {
        const fileName = 'Mr_' + this.objectType + '.csv'
        const myFile = this.env.outputDir + '/' + fileName
        const csvParser = new Parser()
        try {
            const csv = csvParser.parse(objects)
            this.fileSystem.saveTextFile(myFile, csv)
            return [true, null]
        } catch (err) {
            return [false, err]
        }
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output an XLSX file to this.env.outputDir containing all object metadata
    outputXLS(objects) {
        const fileName = 'Mr_' + this.objectType + '.xlsx'
        const myFile = this.env.outputDir + '/' + fileName
        try {
            const mySheet = XLSX.utils.json_to_sheet(objects)
            const myWorkbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
            XLSX.writeFile(myWorkbook, myFile)
            return [true, null]
        } catch (err) {
            return [false, err]
        }
    }

    /**
     * @function splashScreen
     * @description print a splash screen with using name as the big title, description as the subtitle and a version declaration
     * @param {String} name Used for the big title on the splash screen.
     * @param {String} description Forms the subtitle on the splash screen.
     * @param {String} version Defines the version number on the splash screen.
     */
     splashScreen (name, description, version) {
        const logoConfig = {
            name: name,
            lineChars: 10,
            padding: 3,
            margin: 3,
            borderColor: 'bold-gray',
            logoColor: 'bold-orange',
            textColor: 'orange',
        }
        // Print out the splash screen
        console.clear()
        console.log(
            logo(logoConfig)
            .emptyLine()
            .right(version)
            .emptyLine()
            .center(description)
            .render()
        )
    }

    /**
     * @function printLine
     * @description print line for separation in various steps
     */
    printLine () {
        const line = '-'.repeat(process.stdout.columns)
        console.log(line)
    }
}

export default CLIOutput