/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file userWizard.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import inquirer from "inquirer"
import chalk from 'chalk'
import WizardUtils from "./commonWizard.js"
import CLIOutput from "./output.js"


class AddUser {
    constructor(env, apiController){
        this.env = env
        this.apiController = apiController

        // Splash screen elements
        this.name = "mediumroast.io user wizard"
        this.version = "version 1.0.0"
        this.description = "Prompt based user object creation for the mediumroast.io."

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "Users"
        this.wutils = new WizardUtils(this.objectType) // Utilities from common wizard
        this.cutils = new Utilities(this.objectType) // General package utilities
        this.output = new CLIOutput(this.env, this.objectType)
    }

    async _createUser (prototype) {
        let myUserObj = await this.wutils.doManual(
            prototype, // Object that we should send to doManual
            [           // Set of attributes to prompt for
                'first_name', 
                'last_name', 
                'email', 
                'phone', 
                'linkedin',
                'twitter'
            ],
            true, // Should we prompt only for the whitelisted attributtes
            true // Use an alternative message than the default supplied
        )

        return myUserObj
    }

    async _contactPrompt(prototype) {
        const myMessage = `${prototype.altMessage} ${prototype.consoleString}`
        const myContact = await inquirer.prompt({name: 'canContact',message: myMessage, type: 'confirm'})
        return myContact.canContact
    }

    /**
     * @async
     * @description Invoke the text based wizard process to add a user to the mediumroast.io application
     * @param {String} companyName - the name of the owning company this user belongs to
     * @param {Boolean} firstUser - if this is the first time the user is created or not
     * @returns {List} - a list containing the result of the interaction with the mediumroast.io backend
     */
    async wizard(companyName, firstUser=false, createObj=true) {
        // Unless we suppress this print out the splash screen.
        if (this.env.splash) {
            this.output.splashScreen(
                this.name,
                this.version,
                this.description
            )
        }

        let userPrototype = {
            first_name: {consoleString: "first name", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            last_name: {consoleString: "last name", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            email: {consoleString: "email address", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            phone: {consoleString: "phone number, including country code", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            linkedin: {consoleString: "LinkedIn handle", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            twitter: {consoleString: "Twitter handle", value: this.defaultValue, altMessage: 'What\'s your'}, // Prompt
            can_contact: {consoleString: "contact you from time to time", value: false, altMessage: 'Can we'}, // Special prompt
            roles: {consoleString: "roles", value: 'admin'}, // Do not prompt
            new_user: {consoleString: "new user", value: true} // Do not prompt
        }

        // Define the target user object
        let myUser = {}

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to add new user, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting user creation.'))
            process.exit()
        }

        // Perform user creation setup
        console.log(chalk.blue.bold('Starting user creation...'))
        myUser = await this._createUser(userPrototype)
        this.cutils.printLine()

        // Assign special values to the user
        console.log(chalk.blue.bold('Setting special properties to known values...'))
        firstUser ?
            myUser.roles = `admin`: // If this is the first user they'll be the administrator
            myUser.roles = `user` // Otherwise they aren't 
        myUser.new_user = this.userPrototype.new_user.value
        myUser.company = companyName
        myUser.can_contact = await this._contactPrompt(userPrototype.can_contact) // TODO check the value
        this.cutils.printLine()
        
        if (createObj) {
            console.log(chalk.blue.bold(`Saving details for ${myUser.first_name} to mediumroast.io...`))
            return await this.apiController.createObj(myUser)
        } else {
            return myUser
        }
    }

}

export default AddUser