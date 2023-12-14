#!/usr/bin/env node

/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactionCLIwizard.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */


// Import required modules
import chalk from 'chalk'
import crypto from "node:crypto"
import WizardUtils from "./commonWizard.js"
import { Utilities } from "../helpers.js"
import CLIOutput from "./output.js"
import GitHubFunctions from '../api/github.js'

import FilesystemOperators from "./filesystem.js"
import * as progress from 'cli-progress'

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
    constructor(env, controllers){
        this.env = env

        // Splash screen elements
        this.name = "mediumroast.io Interaction Wizard"
        this.version = "version 2.0.0"
        this.description = "Prompt based interaction object creation for the mediumroast.io."
        this.processName = "mrcli-interaction-wizard"

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "Interactions"
        this.wutils = new WizardUtils(this.objectType) // Utilities from common wizard
        this.cutils = new Utilities(this.objectType) // General package utilities
        this.output = new CLIOutput(this.env, this.objectType)
        this.fileSystem = new FilesystemOperators()
        this.progressBar = new progress.SingleBar(
            {format: '\tProgress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'}, 
            progress.Presets.rect
        )
        this.companyCtl = controllers.company
        this.interactionCtl = controllers.interaction
        this.studyCtl = controllers.study
        this.githubCtl = new GitHubFunctions(this.env.token, this.env.org, this.processName)
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

    async _getCompaniesStudies(companyCtl, studyCtl) {
        
        // Predefine all variables 
        let state = 0
        let msg = {}

        // Success has 4 states
        // 0 - no objects were fetched
        // 1 - only company objects were fetched
        // 2 - only study objects were fetched
        // 3 - all objects fetched
        
        // Get all companies
        const companyResult = await companyCtl.getAll()
        
        if(!companyResult[0]){
            msg.status_code = 204
            msg.status_msg = "mediumroast.io did not return company content due to: " + msg
        } else {
            msg.status_code = 200
            msg.status_msg = "successfully fetched company objects"
            state = 1
        }

        // Get all studies
        const studyResult = await studyCtl.getAll()
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

    // TODO this should be replaced with a generic linkObj function
    async _linkInteractionToCompany (myCompany, myInteraction, companyCtl) {
        // Hash the names
        const intHash = crypto.createHash('sha256', myInteraction.name).digest('hex')
        let myCurrentCompany = {}
        // Get the most recent copy of the company from the backend before we proceed
        const currentCompany = await companyCtl.findById(myCompany.id)
        if(currentCompany[0]) {
            myCurrentCompany = currentCompany[2][0]
        } else {
            return [
                false,
                {status_code: 204, status_msg: "unable to link interaction to company"},
                null
            ]
        }
        
        // Create and update the object link
        myCurrentCompany.linked_interactions[myInteraction.name] = intHash
        const linkStatus = await companyCtl.updateObj(
            {
                id: myCompany.id, 
                linked_interactions: myCurrentCompany.linked_interactions
            }
        )

        if(linkStatus[0]) {
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

    // TODO deprecate this function 
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
        // TODO removed interaction_type and name as they will come later on
        const whiteList = [
            'street_address', 
            'city',
            'state_province', 
            'zip_postal', 
            'country',
            'region',
            'phone', 
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
        const doSummary = await this.wutils.operationOrNot (`Would you like to do a summary review of attributes for your interaction(s)?`)
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

    async discoverObjects(prototype, companyCtl, studyCtl){
        let myCompany = {}
        let myStudy = {}
        let myInteraction = {}
        // First fetch key objects
        const [state, msg, myObjs] = await this._getCompaniesStudies(companyCtl, studyCtl)

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
                {status_code: 422, status_msg: "unable to perform the automatic process for interaction creation"},
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


    async uploadFile (fileName, branchName, sha, fileData) {
        let fileBits = fileName.split('/')
        const shortFilename = fileBits[fileBits.length - 1]

        const myObjectType = this.fileSystem.checkFilesystemObjectType(fileName)
        if(myObjectType[2].isFile()) {
            try{ 
                const writeResp = await this.githubCtl.writeBlob(this.objectType, shortFilename, fileData, branchName, sha)
                return [true, {status_code: 200, status_msg: `SUCCESS: uploaded file [${myName}] to GitHub`}, writeResp]
            } catch (err) {
                return [false, {status_code: 503, status_msg: `ERROR: unable to upload file [${myName}] to GitHub`}, err]
            }
        } else {
            return [false, {status_code: 503, status_msg: `WARNING: file [${myName}] is not of a type that can be uploaded`}, myObjectType[2]]
        }
        
    }


    async ingestInteractions(branchName, branchSha, fileName=null) {
        // Pre-define the final object
        let myFiles = []

        // Prompt the user to see if they want to perform multi-file ingestion
        const multiFile = await this.wutils.operationOrNot('Will you upload an entire directory?')

        // Execute multi-file ingestion
        if(multiFile) {
            // Prompt the user for the target directory
            const dirPrototype = {
                dirName: {consoleString: "target directory with path (typically, /parent_dir/company_name)", value:this.defaultValue}
            }
            let myDir = await this.wutils.doManual(dirPrototype)
            const [success, message, result] = this.fileSystem.checkFilesystemObject(myDir.dirName)

            // Try again if the check of the file system object fails
            if (!success) {
                console.log(chalk.red.bold('\t-> The file system object wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
                myFiles = await this.ingestInteractions() // TODO test this
            }

            
            // List all files in the directory and process them one at a time
            const allFiles = this.fileSystem.listAllFiles(myDir.dirName)
            // Start the progress bar
            this.progressBar.start(allFiles.length - 1, 0)
            // Iterate through each file in the directory
            for(const myIdx in allFiles[2]) {
                // Set the file name for easier readability
                const fileName = allFiles[2][myIdx]
                // Skip files that start with . including present and parent working directories 
                if(fileName.indexOf('.') === 0) { continue }
                // Read the blob and return contents base64 encoded
                const fileData = fileSystem.readBlobFile(`${myDir.dirName}/${fileName}`)
                // Upload the file to GitHub
                const myContents = await this.uploadFile(fileName, fileData[2], branchName, branchSha) 
                // Save the results
                myFiles.push(myContents[2])
                // Increment the progress bar
                this.progressBar.increment()
            }
        // Execute single file ingestion
        } else {
            // Prompt the user for the target file
            const filePrototype = {
                fileName: {consoleString: "target file with path (typically, /parent_dir/sub_dir/file_name.ext)", 
                value:this.defaultValue}
            }
            let myFile = await this.wutils.doManual(filePrototype)
            const [success, message, result] = this.fileSystem.checkFilesystemObject(myFile.fileName)
            
            // Try again if the check of the file system object fails
            if (!success) {
                console.log(chalk.red.bold('\t-> The file system object wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
                myFiles = await this.ingestInteractions(targetBucket) // TODO test this
            }

            // Upload the file
            const myContents = await this.uploadFile(fileName, fileData[2], branchName, branchSha)
            myFiles.push(myContents[2])
        }

        // An end separator
        // TODO do we need this?
        this.output.printLine()

        // Return the result of uploaded files
        return myFiles
    }

    async createInteraction(myInteraction, targetBucket) {
        let myFiles = []
        
        // Perform basic definitional work
        myCompany = await this.wutils.doManual(interactionPrototype)
        this.output.printLine()
        
        console.log(chalk.blue.bold('Setting location properties...'))
        // Set the region
        myInteraction.region = this.wutils.getRegion()

        // Set lat, long and address
        const myLocation = await this.wutils.getLatLong(myInteraction) // Based upon entered data discover the location(s)
        myInteraction.latitude = myLocation.latitude // Set to discovered value
        myInteraction.longitude = myLocation.longitude // Set to discovered value
        myInteraction.street_address = myLocation.formattedAddress // Set to discovered value
        this.output.printLine()

        console.log(chalk.blue.bold('Preparing to ingest interaction file.'))
        const filePrototype = {
            file_name: {
                consoleString: "file name with path (typically, /parent_dir/sub_dir/file_name.ext)", 
                value: this.defaultValue
            }
        }
        let myFile = await this.wutils.doManual(filePrototype)
        const [success, message, result] = this.fileSystem.checkFilesystemObject(myFile.file_name)
        // Try again if we don't actually see the file exists
        if(!success) {
            console.log(chalk.red.bold('\t-> The file system object wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
            myFiles = await this.createInteraction(myInteraction)
        } 
        const myContents = await this.uploadFile(myFile.file_name, targetBucket)
        myFiles.push(myContents[2])
        return myFiles
    }

    async _chooseInteractionType () {
        let interactionType = this.defaultValue
        const tmpType = await this.wutils.doCheckbox(
            "What kind of interaction is this?",
            [
                {name: 'General Notes'}, // Becomes general
                {name: 'Frequently Asked Questions'}, // Becomes faq
                {name: 'White Paper'}, // Becomes article
                {name: 'Case Study'}, // Becomes article
                {name: 'Public Company Filing'},
                {name: 'Patent'},
                {name: 'Press Release'}, // Becomes article
                {name: 'Blog Post'}, // Becomes social
                {name: 'Social Media Post(s)'}, // Becomes social
                {name: 'Product Document'}, // Becomes product/service
                {name: 'Service Document'}, // Becomes product/service
                {name: 'Transcript'},
                {name: 'Article'}, // Becomes article
                {name: 'About the company'}, // Becomes about company
                {name: 'Research Paper'}, // Becomes article
                {name: 'Other'},
            ]
        )
        // TODO we need to debug other
        if(tmpType[0] === 'Other') {
            const typePrototype = {
                type_name: {
                    consoleString: "type?", 
                    value: interactionType
                }
            }
            interactionType = await this.wutils.doManual(typePrototype)
        } else {
            interactionType = tmpType[0]
        }
        return interactionType
    }

    async _mergeResults(controller, interaction, files, company, companyCtl) {
        let interactionResults = {}

        for (const myFile in files) {
            process.stdout.write(chalk.blue.bold(`\tCreating interaction -> `))
            console.log(chalk.blue.underline(`${files[myFile].name.slice(0, 72)}...`))
            let myInteraction = interaction

            // Set the interaction_type property
            myInteraction.interaction_type = await this._chooseInteractionType()

            // Name
            myInteraction.name = files[myFile].name
            // URL
            myInteraction.url =  files[myFile].url
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
            console.log(chalk.blue(`\t\tSaving interaction...`))
            const [createSuccess, createMessage, createResults] = await controller.createObj(myInteraction)
            let linkResults = []
            if (createSuccess) {
                // TODO revist the linking of studies and companies, these are placeholders for now
                console.log(chalk.blue(`\t\tLinking interaction to company -> ${company.name}`))
                linkResults = await this._linkInteractionToCompany(company, myInteraction, companyCtl)
                // const [success, msg, intLinkStudy] = this._linkInteractionToStudy(myStudy, interaction) 
            }
            this.output.printLine()
            const linkSuccess = linkResults[0]
            if(createSuccess && linkSuccess) {
                interactionResults[myInteraction.name] = [
                    createSuccess,
                    {status_code: 200, status_msg: `successfully created and linked ${myInteraction.name}`},
                    null
                ]
            } else if(createSuccess && !linkSuccess) {
                interactionResults[myInteraction.name] = [
                    createSuccess,
                    {status_code: 503, status_msg: `successfully created but could not link ${myInteraction.name}`},
                    null
                ]
            } else if(!createSuccess && linkSuccess) {
                interactionResults[myInteraction.name] = [
                    createSuccess,
                    {status_code: 503, status_msg: `successfully linked but could not create ${myInteraction.name}`},
                    null
                ]
            } else {
                interactionResults[myInteraction.name] = [
                    createSuccess,
                    {status_code: 404, status_msg: `unable to create or link ${myInteraction.name}`},
                    null
                ]
            }
        }
        return [
            true,
            {status_code: 200, status_msg: `performed create and link operations on ${interactionResults.length}`},
            interactionResults
        ]
    }

    /**
     * @function wizard
     * @description Invoke the text based wizard process to add an interaction to the mediumroast.io application
     * @returns {List} - a list containing the result of the interaction with the mediumroast.io backend
     */
    async wizard() {
        // Unless we suppress this print out the splash screen.
        if (this.env.splash) {
            this.output.splashScreen(
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

        // TODO review with the current backend implementation
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

        // Define empty objects
        let myInteraction = {}
        let myCompany = {}
        let myStudy = {}
        let myFiles = []

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to create a new interaction, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting interaction object creation.'))
            process.exit()
        }

        // TODO the below can be moved to commonWizard

        // Checking to see if the server is ready for adding interactions
        process.stdout.write(chalk.blue.bold('Checking if the mediumroast appplication is ready to ingest interactions ... '))
        const companies = this.companyCtl.getAll()
        const studies = this.studyCtl.getAll()
        if(companies[2].length === 0 || studies[2].length === 0) {
            console.log(chalk.red.bold('Company and study objects not detected, try running [mrcli setup]'))
            process.exit(-1)
        } else {
            console.log(chalk.green.bold('Ready'))
        }
        
        // Perform automated Company and Study object discovery
        console.log(chalk.blue.bold('Discovering relevant mediumroast.io objects.'))
        const [autoSuccess, autoMsg, myObjs] = await this.discoverObjects(interactionPrototype, companyCtl, studyCtl)
        if(autoSuccess) {
            // Assign results if automatic discovery was successful
            myInteraction = myObjs.interaction
            myCompany = myObjs.company
            myStudy = myObjs.study
            // Get the individual files which will be transformed into interactions
            myFiles = await this.ingestInteractions(targetBucket)
        
        // Fallback to manual setup for creating the interaction since discovery failed
        } else {
            console.log(chalk.orange.bold('Object discovery failed, falling back to manual processing.'))
            const myObjs = await this.createInteraction(myInteraction)
            myInteraction = myObjs.interaction
            myCompany = myObjs.company
            myStudy = myObjs.study
            myFiles = myObjs.files
        }

        // Merge the file names with the interaction prototype to create the interactions
        return await this._mergeResults(interactionCtl, myInteraction, myFiles, myCompany, companyCtl)
    }

}

export default AddInteraction