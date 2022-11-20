/**
 * A class for common steps in a CLI based wizard.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file commonWizard.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */


// Import required modules
import inquirer from "inquirer"
import node_geocoder from "node-geocoder"

class WizardUtils {
    /**
     * Common steps and utilities needed across all CLI based wizards.  Currently focused on manual
     * object creation and proceeding to perform an operation/step or not.
     * @constructor
     * @classdesc Construct an object for common wizard utilities/steps
     * @param {String} objectType - the type of object (interaction, company, study) used for these common utilities
     */
    constructor(objectType){
        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = objectType
        this.geoProvider = 'openstreetmap' // Openstreet maps provides consistent outputs w/o API keys, etc.
        this.itemLineLength = 80 // The line length for long items in a checkbox
    }

    /**
     * @async
     * @function operationOrNot
     * @description Prompt the user for a step to take and return true if they want to take the step or false if they don't
     * @param {String} myStep - the name of the step to check
     * @returns {Boolean} - returns true or false relating to if the user wants to perform the step or not
     */
    async operationOrNot(myStep) {
        let doOperation = null 
        await inquirer
                .prompt([
                    {
                        name: "operation",
                        type: "confirm",
                        message: myStep
                    }
                ])
                // If we don't want to perform the setup then exit
                .then((answer) => {
                        doOperation = answer.operation
                    }
                )
        return doOperation
    }

    /**
     * @async
     * @function doManual
     * @description Using an input prototype object step the user through setting each property
     * @param {Object} prototype - the object to use for prompting the user
     * @param {Array} whiteList - a list used in conjunction with summary
     * @param {Boolean} summary - when present only the items in whiteList will be prompted to the user
     * @returns {Object} - the final object with the changes the user wants to see
     */
    async doManual(prototype, whiteList=[], summary=false) {
        let myObj = {}
        for (const setting in prototype) {
            if (summary) {
                // This is the whitelist of items to manually ask for should we want to do summary verification
                if (!whiteList.includes(setting)) {
                    myObj[setting] = prototype[setting].value
                    continue
                }
            }
            // TODO check to see if the length of setting is more than the console line lenght and if so truncate
            await inquirer
                .prompt([
                    {
                        name: setting,
                        type: 'input',
                        message: `What\'s the ${this.objectType}\'s ` + prototype[setting].consoleString + '?',
                        default() {
                            return prototype[setting].value
                        }
                    }
                ])
                .then(async (answer) => {
                    myObj[setting] = await answer[setting]
                })
        }
        return myObj
    }

    async doCheckbox(message, choices){
        let myResult = null
            await inquirer
                .prompt([
                    {
                        name: 'option',
                        type: 'checkbox',
                        message: message,
                        choices: choices,
                        validate(answer) {
                            if(answer.length !== 1){
                                return 'Please choose from one of the options available.'
                            }
                            return true
                        }
                    }
                ])
                .then(async (answer) => {
                    myResult = await answer.option
                })
        return myResult
    }

    async locate(location) {
        const options = {
            provider: this.geoProvider,
            httpAdapter: 'https'
        }
        const myGeoCoder = node_geocoder(options)
        const coordinates = await myGeoCoder.geocode(location)
        return coordinates
    }

    async getLatLong(mrObj) {
        let locationString = "" // Set to an empty string
        // Add the address if present
        mrObj.street_address !== this.defaultValue ? 
            locationString = mrObj.street_address + ', ' : 
            locationString = locationString
        // Add the state/province if present
        mrObj.city !== this.defaultValue ? 
            locationString += mrObj.city + ', ' :
            locationString = locationString
        // Add state/province if present
        mrObj.state_province !== this.defaultValue ?
            locationString += mrObj.state_province + ', ' :
            locationString = locationString
        // Add zip/postal code if present
        mrObj.zip_postal !== this.defaultValue ?
            locationString += mrObj.zip_postal + ', ' :
            locationString = locationString
        // Add country if present
        mrObj.country !== this.defaultValue ?
            locationString += mrObj.country :
            locationString = locationString
        
        let coordinates = null
        locationString ? coordinates = await this.locate(locationString) : coordinates = coordinates
        
        // TODO test to see if an empty array will trigger this or not
        if(coordinates) {
            let idx = 0
            const choices = coordinates.map(
                (choice) => {
                    const item = {
                        name: choice.formattedAddress.substring(0, this.itemLineLength) + `... [item: ${idx}]`
                    }
                    idx += 1
                    return item
                }
            )
            const addressChoice = await this.doCheckbox(
                `Which address is closest to your intended ${this.objectType}\'s location?`,
                choices
            )
            let myItem = parseInt(addressChoice[0].split('item:')[1].replace(']', ''))
            return coordinates[myItem]
        } else {
            return {
                latitude: this.defaultValue,
                longitude: this.defaultValue,
                formattedAddress: this.defaultValue
            }
        }
    }
        
}

export { WizardUtils }