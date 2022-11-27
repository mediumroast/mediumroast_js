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
import { Auth, Companies } from "../api/mrServer.js"
import inquirer from "inquirer"
import chalk from 'chalk'
import ora from "ora"
import path from "node:path"
import crypto from "node:crypto"
import WizardUtils from "./commonWizard.js"
import { Utilities } from "../helpers.js"

class AddInteraction {
    /**
     * A class which encodes the steps needed to create an interaction in the mediumroast.io application. There are two
     * modes of the automated case and the manual case.  For the automated case, the method wizard() will call
     * to the mediumroast.io backend to discover companies which will provide information that can be automatically
     * filled in.  It is generally suggested for the user to run the automated case to minimze the burden of
     * adding the attributes.  However, in some cases running a manual process isn't avoidable, this could be
     * because the interaction name is incorrrect or the company isn't in the backend yet.  As a result the user
     * can choose to enable a fully manual process to add an interaction object.  In this mode the default value
     * for each attribute is 'Unknown'.
     * @constructor
     * @classdesc Construct the object to execute the company wizard
     * @param {Object} env - contains key items needed to interact with the mediumroast.io application
     * @param {Object} apiController - an object used to interact with the backend for interactions
     * @param {Object} companyController - an object used to interact with the backend for companies
     * @param {Object} credential - a credential needed to talk to a RESTful service which is the company_dns in this case
     * @param {Object} cli - the already constructed CLI object
     */
    constructor(env, apiControllers, credential, cli){
        this.env = env
        this.apiController = apiControllers.interaction
        this.studyCtl = apiControllers.study
        this.companyCtl = apiControllers.company
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
        this.cutils = new Utilities(this.objectType) // General package utilities

        // const myAuth = new Auth(
        //     env.restServer,
        //     env.apiKey,
        //     env.user,
        //     env.secret
        // )
        // console.log(myAuth)
        // const myCredential = myAuth.login()
        // this.companyCtl = new Companies(myCredential)
    }

    _makeChoices(myObjs) {
        let choices = []
        let objsById = {}
        for (const myObj in myObjs) {
            choices.push({name: myObjs[myObj].name + ` [Id: ${myObjs[myObj].id}]`})
            objsById[myObjs[myObj].id] = myObjs[myObj]
        }
        return [choices, objsById]
    }

    async _getCompaniesStudies() {
        
        // Predefine all variables 
        let state = 0
        let msg = {}

        // Success has 4 states
        // 0 - no objects were fetched
        // 1 - only company objects were fetched
        // 2 - only study objects were fetched
        // 3 - all objects fetched
        
        // Get all companies
        const companyResult = await this.companyCtl.getAll()
        
        if(!companyResult[0]){
            msg.status_code = 204
            msg.status_msg = "mediumroast.io did not return company content due to: " + msg
        } else {
            msg.status_code = 200
            msg.status_msg = "successfully fetched company objects"
            state = 1
        }

        // Get all studies
        const studyResult = await this.studyCtl.getAll()
        if(!studyResult[0]){
            if(msg.status_code === 200){
                msg.status_code = 206
                msg.status_msg = "successfully fetched company objects failed to fetch study objects"
            } else {
                msg.status_msg = "unable to fetch objects from mediumroast.io"
            }
        } else {
            if(msg.status_code > 200){
                msg.status_code = 206
                msg.status_msg = "successfully fetched study objects failed to fetch company objects"
                state = 2
            } else {
                msg.status_msg = "successfully fetched all objects"
                state = 3
            }
        }

        // Return the results to doAutomatic
        return [state, msg, {companies: companyResult[2], studies: studyResult[2]}]
    }

    async _discoverObj(myObjs, myType) {
        const [choices, objs] = this._makeChoices(myObjs)
        const objChoice = await this.wutils.doCheckbox(
            `Which ${myType} is this ${this.objectType} associated to?`,
            choices
        )
        const myObjId = parseInt(objChoice[0].split('Id:')[1].replace(']', ''))
        return objs[myObjId]
    }

    async _linkInteractionToCompany (myCompany, myInteraction) {
        // Hash the names
        const intHash = crypto.createHash('sha256', myInteraction.name).digest('hex')
        
        // Create and update the object link
        // TODO the linking isn't working correctly
        myCompany.linked_interactions[myInteraction.name] = intHash
        const [success, msg, result] = await this.companyCtl.updateObj(JSON.stringify({
            id: myCompany.id, linked_interactions: myCompany.linked_interactions
        }))
        console.log(msg)

        if(success) {
            return [
                true, 
                {status_code: 200, status_msg: "successfully linked interaction to company"},
                null
            ]
        } else {
            return [
                false,
                {status_code: 204, status_msg: "unable to link interaction to company"},
                null
            ]
        }
    }

    _linkObj(name) {
        // Hash the names
        // const intHash = this.crypt.createHash('sha256', prototype.name.value).digest('hex')
        const objHash = crypto.createHash('sha256', name).digest('hex')

        // Create the object Link
        let objLink = {} 
        objLink[name] = objHash
        return objLink
    }

    async _populateInteraction(prototype, myCompany={}, myLinks={}) {

        // Set the interaction to blank
        let myInteraction = {}

        // Define the white listed properties to prompt the user for
        // TODO verify the whitelist
        const whiteList = [
            'name',
            'street_address', 
            'city',
            'status_province', 
            'zip_postal', 
            'country',
            'region',
            'phone', 
            'interaction_type'
        ]
        
        // Study link
        'study' in myLinks ? 
            prototype['linked_studies'] = {value: myLinks.study, consoleString: "associated study or studies"} : 
            prototype['linked_studies'] = {value: {}, consoleString: "associated study or studies"}
        'company' in myLinks ?
            prototype['linked_companies'] = {value: myLinks.company, consoleString: "associated company or companies"} : 
            prototype['linked_companies'] = {value: {}, consoleString: "associated company or companies"}
        

        // Address
        'street_address' in myCompany ? 
            prototype.street_address.value = myCompany.street_address : 
            prototype.street_address.value = prototype.street_address.value
            
        // City
        'city' in myCompany ? 
            prototype.city.value = myCompany.city : 
            prototype.city.value = prototype.city.value

        // State/Province
        'state_province' in myCompany ? 
            prototype.state_province.value = myCompany.state_province : 
            prototype.state_province.value = prototype.state_province.value

        // State/Province
        'zip_postal' in myCompany ? 
            prototype.zip_postal.value = myCompany.zip_postal : 
            prototype.zip_postal.value = prototype.zip_postal.value

        // Country
        'country' in myCompany ? 
            prototype.country.value = myCompany.country : 
            prototype.country.value = prototype.country.value

        // Country
        'region' in myCompany ? 
            prototype.region.value = myCompany.region : 
            prototype.region.value = prototype.region.value

        // Phone
        'phone' in myCompany ? 
            prototype.phone.value = myCompany.phone : 
            prototype.phone.value = prototype.phone.value


        // After assignments is successful then ask if we want a summary review or detailed review
        const doSummary = await this.wutils.operationOrNot (`Would you like to do a summary review of attributes for ${prototype.name.value}?`)
        if (await doSummary) {
            const tmpInteraction = await this.wutils.doManual(
                prototype, 
                whiteList,
                true
            )
            myInteraction = await tmpInteraction
        } else {
            const tmpInteraction = await this.wutils.doManual(
                prototype,
                [],
                true
            )
            myInteraction = await tmpInteraction
        }

        // Geospatial coordinates
        'longitude' in myCompany ?
            myInteraction.longitude = myCompany.longitude :
            myInteraction.longitude = this.defaultValue

        'latitude' in myCompany ?
            myInteraction.latitude = myCompany.latitude :
            myInteraction.latitude = this.defaultValue

        return myInteraction
    }

    async doAutomatic(prototype){
        let myCompany = {}
        let myStudy = {}
        let myInteraction = {}
        // First fetch key objects
        const [state, msg, myObjs] = await this._getCompaniesStudies()

        // Able to fetch companies so we can at least enable this automated step
        if(state === 1){
            // Transform the returned data into choices and an object keyed by Ids
            myCompany = await this._discoverObj(myObjs.companies, 'company')
            const compLink = this._linkObj(myCompany.name)
            myInteraction = this._populateInteraction(prototype, myCompany, {company: compLink})
        // Able to fetch studies so we can at least enable this automated step
        } else if(state === 2){
            myStudy = await this._discoverObj(myObjs.studies, 'study')
            const studyLink = this._linkObj(myStudy.name)
            myInteraction = this._populateInteraction(prototype, {}, {study: studyLink})
        // All objects fetched
        } else if(state === 3) {
            myCompany = await this._discoverObj(myObjs.companies, 'company')
            const compLink = this._linkObj(myCompany.name)
            myStudy = await this._discoverObj(myObjs.studies, 'study')
            const studyLink = this._linkObj(myStudy.name)
            myInteraction = await this._populateInteraction(
                prototype, 
                myCompany, 
                {
                    study: studyLink,
                    company: compLink
                }
            )
             
        // Nothing was fetched do manual
        } else {
            // Return and perform manual
            return [
                false,
                {status_code: 422, status_msg: "unable to process the automatic process for interaction creation"},
                null
            ]
        }

        // Return after all processing
        return [
            true,
            {status_code: 200, status_msg: "generated and retrieved object definitions"},
            {
                interaction: myInteraction, 
                company: myCompany, 
                study: myStudy
            }
        ]

    }

    async _getFile(targetBucket, protocol='s3') {
        const filePrototype = {
            file_name: {consoleString: "file name with path (e.g., /dir/sub_dir/file_name)", value:this.defaultValue}
        }
        let myFile = await this.wutils.doManual(filePrototype)
        const [success, message, result] = this.cutils.checkFilesystemObject(myFile.file_name)
        // Try again if we don't actually see the file exists
        if(!success) {
            console.log(chalk.red.bold('\t-> The file wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
            myFile = await this._getFile() // TODO this won't work...
        } 
        console.log(chalk.blue.bold(`Uploading [${myFile.file_name}] to S3...`))
        const [fileName, uploadResults] = await this.cutils.s3UploadObjs([myFile.file_name], this.env, targetBucket)
        let myUrl = this.env.s3Server + `/${targetBucket}/${fileName}`
        return [myUrl.replace('http', protocol), fileName]
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
            region: {consoleString: "region (i.e., where interaction takes place)", value:this.defaultValue},
            phone: {consoleString: "phone number", value:this.defaultValue},
            contact_name: {consoleString: "contact\'s name", value:this.defaultValue},
            contact_email: {consoleString: "contact\'s email address", value:this.defaultValue},
            contact_linkedin: {consoleString: "contact\'s LinkedIn URL", value:this.defaultValue},
            contact_twitter: {consoleString: "contact\'s Twitter handle", value:this.defaultValue},
        }

        // Define an empty interaction object
        let myInteraction = {}
        let myCompany = {}
        let myStudy = {}

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to create a new interaction, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting interaction object creation.'))
            process.exit()
        }

        // Choose if we want to run the setup or not, and it not exit the program
        console.log(chalk.blue.bold('Prompting for interaction file...'))
        // NOTE: Eventually we will have an approach were we will either add a file or merely link to a URL where the file 
        //          resides.
        // const doFile = await this.wutils.operationOrNot('Is there an file for the interaction you\'d like to include?')
        // if (doFile) {
        //     const myUrl = await this._getFile()
        //     myInteraction.url = myUrl
        // }
        // TODO set the bucket to a target...
        // TODO add a property in the config file to set the owner org, we map this to a bucket in minio this will clarify which bucket we should use
        const [myUrl, fileName] = await this._getFile(this.env.owningCompany)
        console.log('Filename:', fileName)
        
        interactionPrototype.name.value = fileName.split('.')[0] // Define the name from the file name in the default value
        this.cutils.printLine()

        // Choose if we want manual or automatic
        const automatic = await this.wutils.operationOrNot('Would like to proceed with automatic interaction creation?')

        // Perform automated processing
        let [myObjs, autoSuccess, autoMsg] = [{}, null, {}]
        if (automatic) {
            // Perform auto setup
            console.log(chalk.blue.bold('Starting automatic interaction creation...'))
            const [success, msg, objs] = await this.doAutomatic(interactionPrototype) // <-- LOOK HERE FOR PATH TO DIRECTORY
            myObjs = objs
            autoSuccess = success
            autoMsg = msg
            myInteraction = myObjs.interaction
            myCompany = myObjs.company
            myStudy = myObjs.study

        }
        
        // Perform manual processing if the user selected that or if auto fails
        if (!automatic && !autoSuccess) {
            // Perform manual setup
            console.log(chalk.blue.bold('Starting manual interaction creation...'))
            myCompany = await this.wutils.doManual(interactionPrototype)
            this.cutils.printLine()
            console.log(chalk.blue.bold('Starting location properties selections...'))
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
            this.cutils.printLine()
        }
        this.cutils.printLine()
        

        console.log(chalk.blue.bold('Setting special attributes to known values...'))
        // URL
        myInteraction.url = myUrl // Define the URL
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
        // Groups
        myInteraction.groups = `${this.env.user}:${this.env.user}`
        // Current time
        const myDate = new Date()
        myInteraction.creation_date = myDate.toISOString()
        myInteraction.modification_date = myDate.toISOString()
        myInteraction.date_time = myDate.toISOString()
        // Creator and Owner ID
        myInteraction.creator_id = 1 // we will need to change this to be determined from the environment
        myInteraction.owner_id = 1 // we will need to change this to be determined from the environment
        // File metadata
        myInteraction.content_type = this.defaultValue
        myInteraction.file_size = this.defaultValue
        myInteraction.reading_time = this.defaultValue
        myInteraction.word_count = this.defaultValue
        myInteraction.page_count = this.defaultValue
        this.cutils.printLine()
        
        console.log(chalk.blue.bold(`Saving interaction ${myInteraction.name} to mediumroast.io...`))
        const [createSuccess, createMessage, createResults] = await this.apiController.createObj(myInteraction)
        if (createSuccess) {
            // TODO revist the linking of studies and companies, these are placeholders for now
            // NOTE We could incrementally link things???
            const [success, msg, intLinkCompany] = await this._linkInteractionToCompany(myCompany, myInteraction)
            // const [success, msg, intLinkStudy] = this._linkInteractionToStudy(myStudy, prototype) 
            return [
                true, 
                {status_code: 200, status_msg: "successfully created and linked interaction"},
                null
            ]
        } else {
            return [
                false, 
                {status_code: 500, status_msg: "unable to create or link interaction"},
                null
            ]
        }
        
        // return myInteraction
    }

}

export { AddInteraction }