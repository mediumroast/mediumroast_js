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
import WizardUtils from "./commonWizard.js"
import { Utilities } from "../helpers.js"
import CLIOutput from "./output.js"
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
        this.userCtl = controllers.user
        this.githubCtl = controllers.github

        // NOTE: These follow the APA style guide for references. These will be used to dynamically create
        //       the interaction_type attribute for the interaction object.
        this.interationTypes = this.fileSystem.readJSONFile('./src/cli/interactionTypes.json')
    }


    async getCompany(companies) {
        let companyChoices = []
        for(const company in companies) {
            companyChoices.push({name: companies[company].name})
        }
        // Define the company type
        const companyChoice = await this.wutils.doList(
            "Which company are these interaction(s) associated to?", companyChoices
        )
        return companyChoice
    }

    async uploadFile (fileName, fileData, branchName, sha) {
        let fileBits = fileName.split('/')
        const shortFilename = fileBits[fileBits.length - 1]

        const myObjectType = this.fileSystem.checkFilesystemObjectType(fileName)
        if(myObjectType[2].isFile()) {
            try{ 
                const writeResp = await this.githubCtl.writeBlob(this.objectType, fileName, fileData, branchName, sha)
                return [true, {status_code: 200, status_msg: `SUCCESS: uploaded file [${fileName}] to GitHub`}, writeResp]
            } catch (err) {
                return [false, {status_code: 503, status_msg: `ERROR: unable to upload file [${fileName}] to GitHub`}, err]
            }
        } else {
            return [false, {status_code: 503, status_msg: `WARNING: file [${fileName}] is not of a type that can be uploaded`}, myObjectType[2]]
        }
        
    }

    async getValidPath() {
        const pathPrototype = {
            path: {consoleString: 'full path to the file or directory (e.g., /dir/subdir or /dir/file.ext)', value:this.defaultValue}
        }
        let myPath = await this.wutils.doManual(pathPrototype)
        const [success, message, result] = this.fileSystem.checkFilesystemObject(myPath.path)
        if(!success) {
            console.log(chalk.red.bold('\t-> The file system object wasn\'t detected, perhaps the path/file name isn\'t correct? Trying again...'))
            myPath = await this.getValidPath()
        }
        console.log(myPath.path)
        return myPath.path
    }

    async ingestInteractions(branchName, branchSha) {
        // Pre-define the final object
        let myFiles = []

        // Get a valid path
        const myPath = await this.getValidPath()

        // Check to see if this is a file or a directory using the file system object
        const myObjectType = this.fileSystem.checkFilesystemObjectType(myPath)
        if(myObjectType[2].isFile()) {
            // Set up the progress bar
            this.progressBar.start(1, 0)
            // Read the blob and return contents base64 encoded
            const fileData = fileSystem.readBlobFile(myPath)
            // Upload the file to GitHub
            const myContents = await this.uploadFile(myPath, fileData[2], branchName, branchSha)
            // Save the results
            myFiles.push(myContents[2])
            // Increment the progress bar
            this.progressBar.increment()
        } else {
            // List all files in the directory and process them one at a time
            const allFiles = this.fileSystem.listAllFiles(myPath)
            // Start the progress bar
            this.progressBar.start(allFiles[2].length, 0)
            // Iterate through each file in the directory
            for(const myIdx in allFiles[2]) {
                // Set the file name for easier readability
                const fileName = allFiles[2][myIdx]
                // Skip files that start with . including present and parent working directories
                if(fileName.indexOf('.') === 0) { continue }
                // Read the blob and return contents base64 encoded
                const fileData = this.fileSystem.readBlobFile(`${myPath}/${fileName}`)
                // Upload the file to GitHub
                const myContents = await this.uploadFile(`${myPath}/${fileName}`, fileData[2], branchName, branchSha)
                // Remove the extesion from the file name and save the file name to the myFiles array
                const fullFileName = fileName
                const fileBits = fileName.split('.')
                const shortFilename = fileBits[fileBits.length - 1]
                fileName = fileName.replace(`.${shortFilename}`, '')
                // We need to same the object name and the actual file name for later retrieval
                myFiles.push({interactionName: fileName, fileName: fullFileName})
                // Increment the progress bar
                this.progressBar.increment()
            }
            // Stop the progress bar
            this.progressBar.stop()

            // Return the result of uploaded files
            return myFiles
        }
    }

    async getInteractionType () {
        let interactionType = this.defaultValue
        const tmpType = await this.wutils.doList(
            "What kind of interaction is this?",
            [
                { name: 'Book' },
                { name: 'Journal Article' },
                { name: 'Webpage' },
                { name: 'Conference Proceedings' },
                { name: 'Report' },
                { name: 'Thesis/Dissertation' },
                { name: 'Magazine Article' },
                { name: 'Newspaper Article' },
                { name: 'Online Forum or Discussion Board Post' },
                { name: 'Blog Post' },
                { name: 'Social Media Post' },
                { name: 'Legal Material' },
                { name: 'Government Report' },
                { name: 'Patent' },
                { name: 'General Notes' }, // Becomes general
                { name: 'Frequently Asked Questions' }, // Becomes faq
                { name: 'White Paper' }, // Becomes article
                { name: 'Case Study' }, // Becomes article
                { name: 'Public Company Filing' },
                { name: 'Press Release' }, // Becomes article
                { name: 'Product/Service Document' }, // Becomes product/service
                { name: 'Transcript' },
                { name: 'About the company' }, // Becomes about company
            ]
        )
        interactionType = tmpType[0]
        return {interaction: interactionType, interactionDetail: this.interationTypes[interactionType]}
    }

    async discoverCompany() {
        // Checking to see if the server is ready for adding interactions
        process.stdout.write(chalk.blue.bold('Checking if the mediumroast.io app is ready to add interactions ... '))
        const companiesResp = await this.companyCtl.getAll()
        if(!companiesResp[0]) {
            console.log(chalk.red.bold('No companies detected, run [mrcli setup] to add a company'))
            process.exit(-1)
        } else {
            console.log(chalk.green.bold('Ok'))
        }

        // Convert companies[2] into an object that is keyed by the company name
        const companiesArray = companiesResp[2].mrJson

        const companiesObjects = companiesArray.reduce((obj, item) => {
            obj[item.name] = item
            return obj
        }, {})

        // Call getCompany to get the company object of interest
        const companyChoice = await this.getCompany(companiesObjects)

        // Get the company object
        return companiesObjects[companyChoice]
    }

    // TODO: This needs to be updated in the following ways:
    // 1. Pass in the interation prototype object
    // 2. Pass in the files list
    // 3. Pass in previously read interactions
    // Additionally, we will want to prompt for the interaction type and then use that to
    // determine the interactionDetail prototype object. We will then prompt for each of the
    // attributes in the interactionDetail object using doManual.
    async _mergeResults(controller, interaction, files, company, companyCtl) {
        let interactionResults = {}

        for (const myFile in files) {
            process.stdout.write(chalk.blue.bold(`\tCreating interaction -> `))
            console.log(chalk.blue.underline(`${files[myFile].name.slice(0, 72)}...`))
            let myInteraction = interaction

            // Set the interaction_type property
            myInteraction.interaction_type = await this.getInteractionType()

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

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to create a new interaction, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting interaction object creation.'))
            process.exit()
        }

        // Capture the current user
        const myUserResp = await this.userCtl.getMyself()
        const myUser = myUserResp[2]

        // Capture the current company
        const myCompany = await this.discoverCompany()

        // Set the prototype object which can be used for creating a real object.
        // Since the backend expects certain attributes that may not be human readable, the 
        // prototype below contains strings that are easier to read.  Additionally, should 
        // we wish to set some defaults for each one it is also feasible within this 
        // prototype object to do so.
        let properties = [
            "organization_id", //  int
            "name", //  assigned from the file system
            "interaction_type", //  Assigned by user choice

            "stored_url", //  character varying, assigned programatically by this wizard and the location in GitHub

        ]

        

        // Capture the current data and converto to an ISO string
        const myDate = new Date()
        const myDateString = myDate.toISOString()

        // NOTE: Define the interaction prototype to be used for establishing default values. Notes are provided for
        // each attribute to help the user understand what the attribute is for. Only those attributes that are
        // either 'Unknown' or have a derived default value are included in the prototype. Where the user assigns
        // the attribute is excluded from the prototype. The prototype is used to create the interaction object and
        // then the user is prompted to assign the attributes that are not derived or unknown. The prototype and
        // the user assigned attributes are then merged to create the final interaction object.
        let interactionPrototype = {
            tags: {consoleString: "", value: {}}, // Empty, but assigned by caffeine
            topics: {consoleString: "", value: {}}, // Empty, but assigned by caffeine
            status: {consoleString: "", value: 0}, // Set to zero, changed by caffeine
            organization: {consoleString: "", value: this.env.gitHubOrg}, // Set the organization to the GitHub organization
            content_type: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            file_size: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            reading_time: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            word_count: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            page_count: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine 
            description: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            abstract: {consoleString: "", value: this.defaultValue}, // Unknown assigned by caffeine
            creator: {consoleString: "", value: myUser.login}, // Set the creator to the GitHub user
            creator_id: {consoleString: "", value: myUser.id}, // Set the creator to the GitHub user
            creator_name: {consoleString: "", value: myUser.name}, // Set the creator to the GitHub user
            linked_companies: {consoleString: "", value: this.companyCtl.linkObj([myCompany])}, // Assigned to the user selected company
            linked_studies: {consoleString: "", value: {}}, // Blank for now
            street_address: {consoleString: "", value: myCompany.street_address}, // Set to the company street address
            zip_postal: {consoleString: "", value: myCompany.zip_postal}, // Set to the company zip code
            city: {consoleString: "", value: myCompany.city}, // Set to the company city
            state_province: {consoleString: "", value: myCompany.state_province}, // Set to the company state
            country: {consoleString: "", value: myCompany.country}, // Set to the company country
            latitude: {consoleString: "", value: myCompany.latitude}, // Set to the company latitude
            longitude: {consoleString: "", value: myCompany.longitude}, // Set to the company longitude
            region: {consoleString: "", value: myCompany.region}, // Set to the company region
            public: {consoleString: "", value: true}, // Set to true
            groups: {consoleString: "", value: `${this.env.gitHubOrg}:${myUser.login}`}, // Set to the organization and user, reserved for future use
            creation_date: {consoleString: "", value: myDateString}, // Set to the current date
            modification_date: {consoleString: "", value: myDateString}, // Set to the current date
        }

        // Catch the container for update
        // const lockExists = await this.githubCtl.checkForLock('Interactions')
        const caught = await this.githubCtl.catchContainer(this.objectType)

        // Prompt the user to ingest one or more files
        const files = await this.ingestInteractions(caught[2].branchName, caught[2].branchSha)

        // Merge the file names with the interaction prototype to create the interactions
        // return await this._mergeResults(interactionCtl, myInteraction, myFiles, myCompany, companyCtl)

        // Release the container
        const released = await this.githubCtl.releaseContainer(caught[2])
        return released
    }

}

export default AddInteraction