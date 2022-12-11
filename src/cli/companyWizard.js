/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file companyCLIwizard.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */


// Import required modules
import inquirer from "inquirer"
import chalk from 'chalk'
import ora from "ora"
import mrRest from "../api/scaffold.js"
import WizardUtils from "./commonWizard.js"
import { Utilities } from "../helpers.js"
import CLIOutput from "./output.js"

class AddCompany {
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
     * @param {String} companyDNSUrl - the url to the company DNS service
     * @todo replace the company_DNS url with the proper item in the config file
     */
    constructor(env, apiController, companyDNSUrl=null){
        this.env = env
        this.apiController = apiController
        this.endpoint = "/V2.0/company/merged/firmographics/"
        this.env.companyDNS ? this.companyDNS = this.env.companyDNS : this.companyDNS = companyDNSUrl
        this.cred = {
            apiKey: "Not Applicable",
            restServer: this.companyDNS,
            user: "Not Applicable",
            secret: "Not Applicable"
        }
        this.rest = new mrRest(this.cred)

        // Splash screen elements
        this.name = "mediumroast.io Company Wizard"
        this.version = "version 1.0.0"
        this.description = "Prompt based company object creation for the mediumroast.io."

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "Companies"
        this.wutils = new WizardUtils(this.objectType) // Utilities from common wizard
        this.cutils = new Utilities(this.objectType) // General package utilities
        this.output = new CLIOutput(this.env, this.objectType)
    }


    async  getCompany () {
        let myCompany = {}
        const mySpinner = new ora('Attempting to fetch data from company_dns...')
        await inquirer
                .prompt([
                    {
                        name: 'company',
                        type: 'input',
                        message: 'What\'s the name of the company you\'d like to add?'
                    }
                ])
                .then(async (answer) => { 
                    mySpinner.start()
                    const companyAnswer = await answer.company
                    myCompany = await this.rest.getObj(this.endpoint + companyAnswer)
                })
        mySpinner.stop()
        return myCompany
    }

    _joinIndustry(industry) {
        if(industry.length > 1) {
            return industry.join('|')
        } else if (industry === 'Unknown') {
            return 'Unknown'
        } else {
            return industry[0]
        }
    }

    _getFormUrls(forms){
        let tenQ = 'Unknown'
        let tenK = 'Unknown'
        const sortedForms = Object.keys(forms).sort().reverse()
        for (const form in sortedForms) {
            const formType = forms[sortedForms[form]].formType
            if (formType.search(/10-Q/g)) {
                tenQ = forms[sortedForms[form]].filingIndex
                if(tenK !== 'Unknown') {break}
            } else if (formType.search(/10-K/g)) {
                tenK = forms[sortedForms[form]].filingIndex
                if(tenQ !== 'Unknown') {break}
            } else {
                continue
            }
        }
        return [tenK, tenQ]
    }


    async  doAutomatic(prototype){
        let myCompanyObj = await this.getCompany()
        // Else attempt to search company_dns, but if there is no answer then ask if try again or manual
        if (!myCompanyObj[0]){
            const redo = await this.wutils.operationOrNot('There was no company matching your search. Would you like to try again?')
            if (redo) {
                myCompanyObj = await this.doAutomatic(prototype)
            } else {
                console.log(chalk.blue.bold('Starting manual company creation process...'))
                myCompanyObj = await this.wutils.doManual(prototype)
            }
        } else {
            const myCompany = myCompanyObj[2].data
            // Transform the company_dns  object into a company object suitable for mediumroast

            // Company name
            'name' in myCompany ? prototype.name.value = myCompany.name : prototype.name.value = prototype.name.value

            // Company industry
            let myIndustry = this.defaultValue
            'industry' in myCompany ? myIndustry = this._joinIndustry(myCompany.industry) : myIndustry = this.defaultValue
            prototype.industry.value = myIndustry

            // Company website
            'website' in myCompany ? prototype.url.value = myCompany.website[0] : prototype.url.value = prototype.url.value

            // Company address
            'address' in myCompany ? prototype.street_address.value = myCompany.address : prototype.street_address.value = prototype.street_address.value

            // Company city
            'city' in myCompany ? prototype.city.value = myCompany.city : prototype.city.value = prototype.city.value

            // Company state/province
            'stateProvince' in myCompany ? prototype.state_province.value = myCompany.stateProvince : 
                prototype.state_province.value = prototype.state_province.value

            // Company country
            'country' in myCompany ? prototype.country.value = myCompany.country : prototype.country.value = prototype.country.value

            // Company phone
            'phone' in myCompany ? prototype.phone.value = myCompany.phone : prototype.phone.value = prototype.phone.value

            // Company description
            'description' in myCompany ? prototype.description.value = myCompany.description : prototype.description.value = prototype.description.value
            // TODO clean description of any quotes either single or double
            prototype.description.value = prototype.description.value.replace(/["']/g, '')

            // Company CIK
            'cik' in myCompany ? prototype.cik.value = myCompany.cik : prototype.cik.value = prototype.cik.value

            // Company stock symbol/ticker
            const myTicker = myCompany.tickers[0] + ':' + myCompany.tickers[1] 
            'tickers' in myCompany ? prototype.stock_symbol.value = myTicker : 
                prototype.stock_symbol.value = prototype.stock_symbol.value

            // Company stock exchange
            'exchanges' in myCompany ? prototype.stock_exchange.value = myCompany.exchanges[0] : 
                prototype.stock_exchange.value = prototype.stock_exchange.value
            
            // Company zip/postal code
            'zipPostal' in myCompany ? prototype.zip_postal.value = myCompany.zipPostal : 
                prototype.zip_postal.value = prototype.zip_postal.value
            
            // Company longitude coordinate
            'longitude' in myCompany ? prototype.longitude.value = myCompany.longitude : 
                prototype.longitude.value = prototype.longitude.value
            
            // Company latitude
            'latitude' in myCompany ? prototype.latitude.value = myCompany.latitude : prototype.latitude.value = prototype.latitude.value
            
            // Company 10-k and 10-q urls
            let [tenKurl, tenQurl] = [null, null]
            'forms' in myCompany ?  [tenKurl, tenQurl] = this._getFormUrls(myCompany.forms) : [tenKurl, tenQurl] = [this.defaultValue, this.defaultValue]
            tenKurl !== this.defaultValue ? prototype.recent10k_url.value = tenKurl : prototype.recent10k_url.value = prototype.recent10k_url.value
            tenQurl !== this.defaultValue ? prototype.recent10q_url.value = tenQurl : prototype.recent10q_url.value = prototype.recent10q_url.value

            // Company wikipedia url
            'wikipediaURL' in myCompany ? prototype.wikipedia_url.value = myCompany.wikipediaURL : 
                prototype.wikipedia_url.value = prototype.wikipedia_url.value
            
            // Company Standard Industry Code
            'sic' in myCompany ? prototype.sic.value = myCompany.sic : prototype.sic.value = prototype.sic.value

            // Company SIC description
            'sicDescription' in myCompany ? prototype.sic_description.value = myCompany.sicDescription : 
                prototype.sic_description.value = prototype.sic_description.value
            
            // Company type
            'type' in myCompany ? prototype.company_type.value = myCompany.type : 
                prototype.company_type.value = prototype.company_type.value
            
            // Company firmographics url
            'firmographicsURL' in myCompany ? prototype.firmographics_url.value = myCompany.firmographicsURL : 
                prototype.firmographics_url.value = prototype.firmographics_url.value
            
            // Company public filings url
            'filingsURL' in myCompany ? prototype.filings_url.value = myCompany.filingsURL : 
                prototype.filings_url.value = prototype.filings_url.value
            
            // Company stock tractions by individual and institutional owner
            'transactionsByOwner' in myCompany ? prototype.owner_transactions.value = myCompany.transactionsByOwner : 
                prototype.owner_transactions.value = prototype.owner_transactions.value

            // Google maps
            'googleMaps' in myCompany ? prototype.google_maps_url.value = myCompany.googleMaps : 
                prototype.google_maps_url.value = prototype.google_maps_url.value

            // Google news
            'googleNews' in myCompany ? prototype.google_news_url.value = myCompany.googleNews : 
                prototype.google_news_url.value = prototype.google_news_url.value

            // Google finance
            'googleFinance' in myCompany ? prototype.google_finance_url.value = myCompany.googleFinance : 
                prototype.google_finance_url.value = prototype.google_finance_url.value

            // Google patents
            'googlePatents' in myCompany ? prototype.google_patents_url.value = myCompany.googlePatents : 
                prototype.google_patents_url.value = prototype.google_patents_url.value
            
            // After company_dns is successful then ask if we want a summary review or detailed review
            const doSummary = await this.wutils.operationOrNot(`Would you like to do a summary review of attributes for ${prototype.name.value}?`)
            if (doSummary) {
                myCompanyObj = await this.wutils.doManual(
                    prototype, 
                    [ 
                        'name', 
                        'phone', 
                        'website', 
                        'street_address', 
                        'country',
                        'logo_url',
                        'region',
                        'role', 
                        'city',
                        'company_type'
                    ],
                    true
                )
            } else {
                myCompanyObj = await this.wutils.doManual(prototype)
            }
        }
        return myCompanyObj
    }

    /**
     * @function wizard
     * @description Invoke the text based wizard process to add a company to the mediumroast.io application
     * @returns {List} - a list containing the result of the interaction with the mediumroast.io backend
     */
    async wizard(isOwner=false) {
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
        let companyPrototype = {
            name: {consoleString: "name", value:this.defaultValue},
            description: {consoleString: "description", value:this.defaultValue},
            company_type: {consoleString: "company type (e.g. Public, Private, etc.)", value:this.defaultValue},
            industry: {consoleString: "industry", value:this.defaultValue},
            sic: {consoleString: "Standard Industry Code", value:this.defaultValue},
            sic_description: {consoleString: "Standard Industry Code description", value:this.defaultValue},
            url: {consoleString: "website", value:this.defaultValue},
            logo_url: {consoleString: "logo url", value:this.defaultValue},
            street_address: {consoleString: "street address", value:this.defaultValue},
            city: {consoleString: "city", value:this.defaultValue},
            state_province: {consoleString: "state or province", value:this.defaultValue},
            country: {consoleString: "country", value:this.defaultValue},
            zip_postal: {consoleString: "zip or postal code", value:this.defaultValue},
            longitude: {consoleString: "longitude", value:this.defaultValue},
            latitude: {consoleString: "latitude", value:this.defaultValue},
            phone: {consoleString: "phone number", value:this.defaultValue},
            google_maps_url: {consoleString: "URL to locate the company on Google Maps", value:this.defaultValue},
            google_news_url: {consoleString: "URL to find news about the company on Google", value:this.defaultValue},
            google_finance_url: {consoleString: "URL to reveal financial insights on Google", value:this.defaultValue},
            google_patents_url: {consoleString: "URL to locate patent insights on Googles", value:this.defaultValue},
            cik: {consoleString: "SEC Central Index Key", value:this.defaultValue},
            stock_symbol: {consoleString: "stock ticker", value:this.defaultValue},
            stock_exchange: {consoleString: "stock exchange", value:this.defaultValue},
            recent10k_url: {consoleString: "recent form 10-K URL", value:this.defaultValue},
            recent10q_url: {consoleString: "recent form 10-Q URL", value:this.defaultValue},
            wikipedia_url: {consoleString: "wikipedia url", value:this.defaultValue},
            firmographics_url: {consoleString: "firmographics detail URL for public companies", value:this.defaultValue},
            filings_url: {consoleString: "filings URL for public companies", value:this.defaultValue},
            owner_transactions: {consoleString: "URL containing share ownership reports", value:this.defaultValue},
        }

        // Define an empty company object
        let myCompany = {}

        // Choose if we want to run the setup or not, and it not exit the program
        const doSetup = await this.wutils.operationOrNot('It appears you\'d like to create a new company, right?')
        if (!doSetup) {
            console.log(chalk.red.bold('\t-> Ok exiting company object creation.'))
            process.exit()
        }

        // Choose if we want manual or automatic
        const automatic = await this.wutils.operationOrNot('Would like to proceed with automatic company creation?')
        if (!automatic) {
            // Perform manual setup
            console.log(chalk.blue.bold('Starting manual company creation...'))
            myCompany = await this.wutils.doManual(companyPrototype)
        } else {
            // Perform auto setup
            console.log(chalk.blue.bold('Starting automatic company creation...'))
            myCompany = await this.doAutomatic(companyPrototype)
        }
        this.cutils.printLine()

        console.log(chalk.blue.bold('Starting location properties selections...'))
        
        // Set the region
        myCompany.region = await this.wutils.getRegion()
        this.cutils.printLine()

        // Set the role
        if (isOwner) {
            myCompany.role = 'Owner'
        } else {
            const tmpRole = await this.wutils.doCheckbox(
                "What role should we assign to this company?",
                [
                    {name: 'Competitor', checked: true}, 
                    {name: 'Current Partner'},
                    {name: 'Target Partner'},
                    {name: 'Target End User'},
                    {name: 'End User Customer'},
                ]
            )
            myCompany.role = tmpRole[0]
        }
        console.log(chalk.blue.bold(`Set the company\'s role to [${myCompany.role}]`))
        this.cutils.printLine()

        console.log(chalk.blue.bold('Setting special properties to known values...'))
        // Topics
        myCompany.topics = {}
        // Comparison
        myCompany.comparison = {}
        // linked_x
        myCompany.linked_interactions = {}
        // TODO you need to link to one or more studies
        myCompany.linked_studies = {}
        this.cutils.printLine()
        console.log(chalk.blue.bold(`Saving company ${myCompany.name} to mediumroast.io...`))
        let companyResp = await this.apiController.createObj(myCompany)
        companyResp[1].data = myCompany // This might be a little hacky, but it should work
        return companyResp
    }

}

export default AddCompany