/**
 * A class used for consistent outputting of CLI data
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file output.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.1.0
 */

// Import required modules
import Table from 'cli-table'
import Parser from 'json2csv'
import * as XLSX from 'xlsx'
import logo from 'asciiart-logo'
import { Utilities } from './helpers.js'

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
        this.utils = new Utilities(objectType)
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

    // TODO add error checking via try catch
    outputCSV(objects) {
        const fileName = 'Mr_' + this.objectType + '.csv'
        const myFile = this.env.outputDir + '/' + fileName
        const csv = Parser.parse(objects)
        this.utils.saveTextFile(myFile, csv)
    }

    // TODO add error checking via try catch
    outputXLS(objects) {
        const fileName = 'Mr_' + this.objectType + '.xlsx'
        const myFile = this.env.outputDir + '/' + fileName
        const mySheet = XLSX.utils.json_to_sheet(objects)
        const myWorkbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
        XLSX.writeFile(myWorkbook, myFile)
    }

    /**
     * @function splashScreen
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