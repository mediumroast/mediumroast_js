/**
 * A class for common functions for all CLIs.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.2.0
 * 
 * @note Signal handling has been implemented for mrcli-setup.js using SignalHandler class.
 *       Other CLI utilities can integrate similar graceful shutdown handling by importing
 *       and initializing the SignalHandler from '../cli/signalHandler.js'
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

class CLIUtilities {

    /**
     * @async
     * @function getAllObjects
     * @description Retrieve all objects from all controllers
     * @param {Object} apiControllers - an object containing all controllers
     * @returns {Array} an array containing if the operation succeeded, the message, and the objects
     * 
     * @example
     * const allObjects = await utilities.getAllObjects({companies: companyCtl, interactions: interactionCtl, studies: studyCtl})
     */
    async getAllObjects(apiControllers) {
        let allObjects = {
            companies: [],
            interactions: [],
            studies: []
        }
        const controllerNames = Object.keys(apiControllers)
        for (const controllerName of controllerNames) {
            try {
                const objs = await apiControllers[controllerName].getAll()
                allObjects[controllerName] = objs[2].mrJson
            } catch (err) {
                console.error(`ERROR: Unable to retrieve all objects from ${controllerName} due to [${err}]`)
                return [false, {status_code: 500, status_msg: `ERROR: Unable to retrieve all objects from ${controllerName} due to [${err}]`}, null]
            }
        }
        return [true, {status_code: 200, status_msg: `SUCCESS: Retrieved all objects from all controllers.`}, allObjects]
    }

    /**
     * @function getObject
     * @description Retrieve a single object from an array of objects 
     * @param {String} objName - the name of the object to retrieve
     * @param {Array} objects - the array of objects to search
     * @returns {Array} an array containing if the operation succeeded, the message, and the object
     */
    getObject(objName, objects) {
        return objects.filter(obj => obj.name === objName)
    }

    /**
     * @function getOwningCompany
     * @description Retrieve the owning company from an array of companies
     * @param {Array} companiesArray - an array of companies
     * @returns {Array} an array containing the owning company
     * 
     * @example
     * const owningCompany = utilities.getOwningCompany(companiesArray)
     * console.log(`The owning company is ${owningCompany}`)
     * 
    */
    getOwningCompany(companiesArray) {
        return companiesArray.filter(company => company.role === "Owner")
    }

    /**
     * @function getVersionFromPackageJson
     * @description Retrieve the version number from the package.json file
     * @returns {String} the version number
     * 
     * @example
     * const version = utilities.getVersionFromPackageJson()
     * console.log(`The version number is ${version}`)
     */
    getVersionFromPackageJson() {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const packageJsonPath = path.join(__dirname, '../..', 'package.json')
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
        return packageJson.version
    }

    /**
     * @async
     * @function resetStatus
     * @description Reset the status of an object
     * @param {String} objName - the name of the object to reset
     * @param {Object} apiCtl - the controller for the object
     * @param {Number} objStatus - the status to reset to
     * @returns {Array} an array containing if the operation succeeded, the message, and the object
     * 
     * @example
     * const resetResult = await utilities.resetStatus(objName, apiCtl, objStatus)
     * if(resetResult[0]) {
     *    console.log(`SUCCESS: ${resetResult[1].status_msg}`)
     * } else {
     *   console.log(`ERROR: ${resetResult[1].status_msg}`)
     * }
     */
    async resetStatus(objName, apiCtl, objStatus=0) {
        const myUpdate = {name: objName, value: objStatus, key: 'status'}
        const updateResult = await apiCtl.updateObj(myUpdate)
        if(updateResult[0]){
        return [
            true,
            {
                status_code: updateResult[1].status_code, 
                status_msg: updateResult[1].status_msg
            },
            updateResult
        ]
        } else {
            return [
                false,
                {
                    status_code: updateResult[1].status_code, 
                    status_msg: updateResult[1].status_msg
                },
                null
            ]
        }
    }

    /**
     * @function formatSuccess
     * @description Format a SUCCESS message with bold green text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatSuccess('Operation completed successfully'))
     */
    formatSuccess(message) {
        return chalk.green.bold(`SUCCESS: ${message}`)
    }

    /**
     * @function formatWarning
     * @description Format a WARNING message with bold yellow text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.warn(utilities.formatWarning('This is a warning message'))
     */
    formatWarning(message) {
        return chalk.yellow.bold(`WARNING: ${message}`)
    }

    /**
     * @function formatError
     * @description Format an ERROR message with bold red text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.error(utilities.formatError('Operation failed'))
     */
    formatError(message) {
        return chalk.red.bold(`ERROR: ${message}`)
    }

    /**
     * @function formatBlue
     * @description Format a message with bold blue text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatBlue('This is a blue message'))
     */
    formatBlue(message) {
        return chalk.blue.bold(`${message}`)
    }

    /**
     * @function formatGreen
     * @description Format a message with bold green text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatGreen('This is a green message'))
     */
    formatGreen(message) {
        return chalk.green.bold(`${message}`)
    }

    /**
     * @function formatYellow
     * @description Format a message with bold yellow text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatYellow('This is a yellow message'))
     */
    formatYellow(message) {
        return chalk.yellow.bold(`${message}`)
    }

    /**
     * @function formatRed
     * @description Format a message with bold red text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatRed('This is a red message'))
     */
    formatRed(message) {
        return chalk.red.bold(`${message}`)
    }

    /**
     * @function formatOrange
     * @description Format a message with bold orange text
     * @param {String} message - the message to format
     * @returns {String} the formatted message
     * 
     * @example
     * console.log(utilities.formatOrange('This is an orange message'))
     */
    formatOrange(message) {
        return chalk.ansi256(208).bold(`${message}`)
    }
    

    /**
     * @function logSuccess
     * @description Log a SUCCESS message with bold green text
     * @param {String} message - the message to log
     * 
     * @example
     * utilities.logSuccess('Operation completed successfully')
     */
    logSuccess(message) {
        console.log(this.formatSuccess(message))
    }

    /**
     * @function logWarning
     * @description Log a WARNING message with bold yellow text
     * @param {String} message - the message to log
     * 
     * @example
     * utilities.logWarning('This is a warning message')
     */
    logWarning(message) {
        console.warn(this.formatWarning(message))
    }

    /**
     * @function logError
     * @description Log an ERROR message with bold red text
     * @param {String} message - the message to log
     * 
     * @example
     * utilities.logError('Operation failed')
     */
    logError(message) {
        console.error(this.formatError(message))
    }

    /**
     * @function printStep
     * @description Log an ERROR message with bold red text
     * @param {String} message - the message to log
     * 
     * @example
     * utilities.logError('Operation failed')
     */
    printStep(message) {
        console.log(`\n${this.formatBlue(message)}`)
    }
}

export default CLIUtilities

