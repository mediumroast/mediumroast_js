#!/usr/bin/env node

/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactionCLIwizard.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */


// Import required modules
import inquirer from "inquirer"
import chalk from 'chalk'
import ora from "ora"
import { WizardUtils } from "./commonWizard.js"
import { Utilities } from "../helpers.js"

class AddInteraction {
    /**
     * A class which encodes the steps needed to create a company in the mediumroast.io application. There are two
     * modes of the automated case and the manual case.  For the automated case, the method wizard() will call
     * to the open source company_dns service enabling many of the attributes of a company to be automatically
     * filled in.  It is generally suggested for the user to run the automated case to minimze the burden of
     * adding the attributes.  However, in some cases running a manual process isn't avoidable, this could be
     * because the company name is incorrrect or the company isn't in the Wikipedia.  As a result the user
     * can choose to enable a fully manual process to add a company object.  In this mode the default value
     * for each attribute is 'Unknown'.
     * @constructor
     * @classdesc Construct the object to execute the company wizard
     * @param {Object} env - contains key items needed to interact with the mediumroast.io application
     * @param {Object} apiController - an object used to interact with the backend for companies
     * @param {Object} credential - a credential needed to talk to a RESTful service which is the company_dns in this case
     * @param {Object} cli - the already constructed CLI object
     */
    constructor(env, apiController, credential, cli){
        this.env = env
        this.apiController = apiController
        this.credential = credential
        this.cli = cli

        // Splash screen elements
        this.name = "mediumroast.io Interaction Wizard"
        this.version = "version 1.0.0"
        this.description = "Prompt based interaction object creation for the mediumroast.io."

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "interaction"
        this.wutils = new WizardUtils(this.objectType) // Utilities from common wizard
        this.cutils = new Utilities(this.objectType)
    }

    async _getFile(targetBucket='usercontent') {
        const filePrototype = {
            file_name: {consoleString: "file name with path (e.g., /dir/sub_dir/file_name)", value:this.defaultValue}
        }
        let myFile = await this.wutils.doManual(filePrototype)
        const [success, message, result] = this.cutils.checkFilesystemObject(myFile.file_name)
        // Try again if we don't actually see the file exists
        if(!success) {
            console.log(chalk.red.bold('\t-> The file wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
            myFile = await this._getFile() 
        } 
        console.log(chalk.blue.bold(`Uploading ${myFile} to S3...`))
        const [fileName, uploadResults] = await this.cutils.s3UploadObjs([myFile.file_name], this.env, targetBucket)
        return this.env.s3Server + `/${targetBucket}/${fileName}`
    }

    /**
     * @function wizard
     * @description Invoke the text based wizard process to add an interaction to the mediumroast.io application
     * @returns {List} - a list containing the result of the interaction with the mediumroast.io backend
     */
    async wizard() {
        // Unless we suppress this print out the splash screen.
        if (this.env.splash) {
            this.cli.splashScreen(
                this.name,
                this.version,
                this.description
            )
        }

        // Set the prototype object which can be used for creating a real object.
        // Since the backend expects certain attributes that may not be human readable, the 
        // prototype below contains strings that are easier to read.  Additionally, should 
        // we wish to set some defaults for each one it is also feasible within this 
        // prototype object to do so.
        let interactionPrototype = {
            name: {consoleString: "name", value:this.defaultValue},
            interaction_type: {consoleString: "interaction type (e.g. whitepaper, interview, etc.)", value:this.defaultValue},
            street_address: {consoleString: "street address (i.e., where interaction takes place)", value:this.defaultValue},
            city: {consoleString: "city (i.e., where interaction takes place)", value:this.defaultValue},
            state_province: {consoleString: "state/province (i.e., where interaction takes place)", value:this.defaultValue},
            zip_postal: {consoleString: "zip or postal code", value:this.defaultValue},
            country: {consoleString: "country (i.e., where interaction takes place)", value:this.defaultValue},
            phone: {consoleString: "phone number", value:this.defaultValue},
            contact_name: {consoleString: "contact\'s name", value:this.defaultValue},
            contact_email: {consoleString: "contact\'s email address", value:this.defaultValue},
            contact_linkedin: {consoleString: "contact\'s LinkedIn URL", value:this.defaultValue},
            contact_twitter: {consoleString: "contact\'s Twitter handle", value:this.defaultValue},
        }

        // Define an empty interaction object
        let myInteraction = {}

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to create a new interaction, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting interaction object creation.'))
            process.exit()
        }

        // Perform interaction setup
        console.log(chalk.blue.bold('Starting interaction creation process...'))
        myInteraction = await this.wutils.doManual(interactionPrototype)

        // Choose if we want to run the setup or not, and it not exit the program
        const doFile = await this.wutils.operationOrNot('Is there an file for the interaction you\'d like to include?')
        if (doFile) {
            const myUrl = await this._getFile()
            myInteraction.url = myUrl
        }

        // TODO these items need to be either unique or added separately
        // name <-- should be derived from the file name
        // url <-- derive from the target bucket and file name, do not inform the user
        // groups <-- initially set to a default value, inform the user
        
        // TODO create a prompting function in commonWizard
        // linked_companies <-- prompt the user with the list of companies, which will be linked later
        // linked_studies <-- prompt the user with the list of studies
        console.log(chalk.blue.bold('Starting location attribute selections...'))
        
        // Set the region
        const tmpRegion = await this.wutils.doCheckbox(
                "Which region is this interaction associated to?",
                [
                    {name: 'Americas', checked: true}, 
                    {name: 'Europe Middle East, Africa'},
                    {name: 'Asia, Pacific, Japan'}
                ]
            )
        myInteraction.region = tmpRegion[0]

        // Set lat, long and address
        const myLocation = await this.wutils.getLatLong(myInteraction) // Based upon entered data discover the location(s)
        myInteraction.latitude = myLocation.latitude // Set to discovered value
        myInteraction.longitude = myLocation.longitude // Set to discovered value
        myInteraction.street_address = myLocation.formattedAddress // Set to discovered value


        console.log(chalk.blue.bold('Setting special attributes to known values...'))
        // Status
        myInteraction.status = 0
        // Abstract
        myInteraction.abstract = this.defaultValue
        // Description
        myInteraction.description = this.defaultValue
        // Public
        myInteraction.public = false
        // Topics
        myInteraction.topics = {}

        // return await this.apiController.createObj(myInteraction)
        return myInteraction
    }

}

export { AddInteraction }