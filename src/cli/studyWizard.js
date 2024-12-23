/**
 * A class used to build CLIs for constructing Study objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file studyCLIwizard.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */


// Import required modules
import chalk from 'chalk'
import ora from "ora"
import WizardUtils from "./commonWizard.js"
import CLIOutput from "./output.js"
import CLIUtilities from './common.js'

class AddStudy {
    constructor(env, controllers, objects) {
        // Set the environment
        this.env = env

        // Construct commmon utilities
        this.cliUtils = new CLIUtilities()
        this.wutils = new WizardUtils(this.objectType)
        this.output = new CLIOutput(this.env, this.objectType)

        // Splash screen elements
        this.name = "Mediumroast for GitHub"
        this.version = `Version ${this.cliUtils.getVersionFromPackageJson()}`
        this.description = "Command line Study wizard"
        this.processName = "mrcli-study-wizard"

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "Studies"
        
        // Set the controllers
        this.companyCtl = controllers.company
        this.interactionCtl = controllers.interaction
        this.userCtl = controllers.user
        this.studyCtl = controllers.study
        this.githubCtl = controllers.github

        // Set the objects
        this.companies = objects.companies
        this.interactions = objects.interactions
        this.studies = objects.studies
        this.users = objects.users
    }

    _getFoundationDesc(myCompany) {
        return `This Foundation Study for ${myCompany.name} is automatically created by Mediumroast for GitHub to provide an out of the box analysis. It analyzes all companies in the ${myCompany.name} discovery repository to surface interesting competitive insights, proto-requirements, Interactions, and Companies.  Once surfaced the intention of the Foundation Study is to guide the user on important things to act upon.`
    }

    _setCompanies(companies) {
        const allCompanies = companies.map(company => company.name);
        const allCompaniesString = allCompanies.join(" ");
        const allCompaniesHash = crypto.createHash('sha256').update(allCompaniesString).digest('hex');
        
        const timestamp = (new Date()).toISOString();
        const timeStampKey = Date.now() / 1000;
    
        return {
            [timeStampKey]: {
                hash: allCompaniesHash,
                included_companies: allCompanies
            }
        };
    }

    _getStudyPrototype(myUser, myCompany, myDateString, studyName="Foundation", isFoundation=true) {
        return {
            name: {consoleString: "", value: studyName}, // Assigned by the user
            sourceTopics: {consoleString: "", value: {}}, // Empty, assigned by caffeine
            processTopics: {consoleString: "", value: {}}, // Empty, assigned by caffeine
            companies: {consoleString: "", value: _this._setCompanies(this.companies)}, // TODO: Need to assign the companies and create the hash
            status: {consoleString: "", value: 0}, // Set to zero, changed by caffeine
            project: {consoleString: "", value: this.defaultValue}, // Default value, assigned by caffeine
            syncStatus: {consoleString: "", value: this.defaultValue}, // Default value, changed by future project sync service
            organization: {consoleString: "", value: this.env.gitHubOrg}, // Set the organization to the GitHub organization
            description: {
                consoleString: "", 
                value: isFoundation ? this._getFoundationDesc(myCompany[0]) : this.defaultValue
            }, // Assign the foundation description unless isFoundation is false
            creator: {consoleString: "", value: myUser.login}, // Set the creator to the GitHub user
            creator_id: {consoleString: "", value: myUser.id}, // Set the creator to the GitHub user
            creator_name: {consoleString: "", value: myUser.name}, // Set the creator to the GitHub user
            public: {consoleString: "", value: true}, // Set to true
            groups: {consoleString: "", value: `${this.env.gitHubOrg}:${myUser.login}`}, // Set to the organization and user, reserved for future use
            creation_date: {consoleString: "", value: myDateString}, // Set to the current date
            modification_date: {consoleString: "", value: myDateString}, // Set to the current date
        }
    }

    async _createStudyObject(studyPrototype) {
        // Loop through each study object
        let myStudies = []
        let myStudy = {}
        for(const attribute in studyPrototype) {
            myStudy[attribute] = studyPrototype[attribute].value
        }
        
        // Add the study to the list of studies
        myStudies.push(myStudy)
        this.output.printLine()
        return myStudies
    }

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
        const processString = "It appears you'd like to initialize the Foundation Study, right?"
        const exitString = "\tOk, exiting study management."
        const doSetup = await this.wutils.operationOrNot(processString)
        if (!doSetup) {
            console.log(chalk.red.bold(exitString))
            process.exit()
        }

        // Capture the current user
        const myUserResp = await this.userCtl.getMyself()
        const myUser = myUserResp[2]

        // Capture the owning company
        const myCompany = this.cliUtils.getOwningCompany(this.companies)

        // Capture the current date and convert to to an ISO string
        const myDate = new Date()
        const myDateString = myDate.toISOString()
        let studyPrototype = this._getStudyPrototype(myUser, myCompany, myDateString)
        // Create the study object
        let myStudies = await this._createStudyObject(
            studyPrototype, 
            this.studyCtl
        )
        
        // Capture study name
        const studyName = myStudies[0].name

        // Check to see if the study already exists
        const foundStudy = this.cliUtils.getObject(studyName, this.studies)
        if (foundStudy.length > 0) {
            return [false, {status_code: 409, status_msg: `Study [${studyName}] already exists`}, null]
        }

        // Catch the container for updates
        let mySpinner = new ora('Preparing the repository to add studies ...')
        mySpinner.start()
        let repoMetadata = {
            containers: {
                'Studies': {},
            }, 
            branch: {}
        }

        const caught = await this.githubCtl.catchContainer(repoMetadata)
        // Check to see if caught was successful and return an error if not
        if(!caught[0]) {
            return caught
        }
        mySpinner.stop()

        // Write the new studies
        mySpinner = new ora(`Attempting to write study [${studyName}] ...`)
        mySpinner.start()

        // Append the new interactions to the existing interactions
        myStudies = [...myStudies, ...caught[2].containers.Studies.objects]
        
        // Write the new study to the backend
        const createdStudies = await this.githubCtl.writeObject(
            this.objectType, 
            myStudies,
            caught[2].branch.name,
            caught[2].containers.Studies.objectSha
        )
        // Check to see if createdStudies was successful and return an error if not
        if(!createdStudies[0]) {
            return createdStudies
        }

        // Release the container
        mySpinner.text = (`Successfully wrote study [${studyName}], attempting to release the repository ...`)
        const released = await this.githubCtl.releaseContainer(caught[2])
        mySpinner.stop()
        // Return the result of the write including the interaction count and duplicate count
        return [true, {status_code: 200, status_msg: `created study [${studyName}]`}, createdStudies[2]]
    }

}

export default AddStudy