/**
 * A class used to build CLIs for accessing and reporting on mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file companyCLIwizard.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.1.0
 */


// Import required modules
import inquirer from "inquirer"
import chalk from 'chalk'
import ora from "ora"
import mrRest from "../api/scaffold.js"
import WizardUtils from "./commonWizard.js"
import { Utilities } from "../helpers.js"
import CLIOutput from "./output.js"
import crypto from "node:crypto"
import axios from "axios"

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
     * @param {String} companyDNSUrl - the url to the company DNS service
     * @todo replace the company_DNS url with the proper item in the config file
     */
    constructor(env, apiController, companyDNSUrl=null, companyLogoUrl=null, nominatimUrl=null){
        this.env = env
        this.apiController = apiController
        this.endpoint = "/V2.0/company/merged/firmographics/"
        this.sicEndpoint = "/V2.0/sic/description/"
        
        
        this.env.DEFAULT.company_dns ? this.companyDNS = this.env.DEFAULT.company_dns : this.companyDNS = companyDNSUrl
        this.companyDNSCred = {
            apiKey: "Not Applicable",
            restServer: this.companyDNS,
            user: "Not Applicable",
            secret: "Not Applicable"
        }
        this.companyDNSRest = new mrRest(this.companyDNSCred)

        this.env.DEFAULT.company_logos ? this.companyLogos = this.env.DEFAULT.company_logos : this.companyDNS = companyLogoUrl
        this.companyLogosCred = {
            apiKey: "Not Applicable",
            restServer: this.companyLogos,
            user: "Not Applicable",
            secret: "Not Applicable"
        }
        this.companyLogosRest = new mrRest(this.companyLogosCred)

        this.env.DEFAULT.nominatim ? this.nominatim = this.env.DEFAULT.nominatim : this.nominatim = nominatimUrl
        this.nominatimCred = this.companyDNSCred = {
            apiKey: "Not Applicable",
            restServer: this.nominatim,
            user: "Not Applicable",
            secret: "Not Applicable"
        }
        this.nominatiumRest = new mrRest(this.nominatimCred)

        // Splash screen elements
        this.name = "mediumroast.io Company Wizard"
        this.version = "version 1.1.0"
        this.description = "Prompt based company object creation for the mediumroast.io."

        // Class globals
        this.defaultValue = "Unknown"
        this.objectType = "Companies"
        this.wutils = new WizardUtils(this.objectType) // Utilities from common wizard
        this.cutils = new Utilities(this.objectType) // General package utilities
        this.output = new CLIOutput(this.env, this.objectType)
    }

    // TODO we will deprecate this operation in favor of linking in the backend
    _linkObj(name) {
        // Hash the names
        // const intHash = this.crypt.createHash('sha256', prototype.name.value).digest('hex')
        const objHash = crypto.createHash('sha256', name).digest('hex')

        // Create the object Link
        let objLink = {} 
        objLink[name] = objHash
        return objLink
    }

    async  getCompany (companyName) {
        let myCompany = {}
        const mySpinner = new ora('Fetching data from the company_dns...')
        const myURL = this.endpoint + companyName
        mySpinner.start()
            myCompany = await this.companyDNSRest.getObj(myURL)
        mySpinner.stop()
        return myCompany
    }

    async getIndustries() {
        let sics = null
        let sicResult = null
        let myInustries = null

        // Obtain the sic search string
        const SICPrototype = {sicDescription: {consoleString: "industry search string", value: null, altMessage: 'What\'s your'}}
        let industryDescription = await this.wutils.doManual(SICPrototype, [], false, true)
        
        // Check to see if the user put in a search string, if not then call again
        if (! industryDescription.sicDescription) {
            sicResult = await this.getIndustries()
        }

        // In the case where this is not already set get the details
        if (! sicResult) {
            let sicNames
            const myURL = this.sicEndpoint + encodeURIComponent(industryDescription.sicDescription)
            myInustries = await this.companyDNSRest.getObj(myURL)
            if(myInustries[0]) {
                sics = myInustries[2].data.sics
                sicNames = Object.keys(sics)
            } else {
                console.log(chalk.blue.bold('No matching industry found, trying again.'))
                sicResult = await this.getIndustries()
            }
            
            const sicChoices = sicNames.map(
                (choice) => {
                    const item = {name: choice}
                    return item
                }
            )
            const mySic = await this.wutils.doList('Please choose the most appropriate industry', sicChoices)
            sics[mySic].description = mySic
            sicResult = sics[mySic]
        }
        return sicResult
    }

    async getLogo (companyWebsite) {
        const myLogos = await this.companyLogosRest.getObj(companyWebsite)
        return myLogos[2].icons[0].url
    }

    async getLatLong(address) {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${address}&format=json`)
        if (response.data && response.data[0]) {
            return [true, {status_code: 200, status_msg: `SUCCESS: found coordinates for ${address}`}, [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)]]
        } else {
            return [false, {status_code: 404, status_msg: `FAILED: could not find coordinates for ${address}`}, null]
        }
    }

    // TODO Industry data in company_dns is cleaner now than before, so this is likely unnecessary
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

    _getExternalUrls(companyName) {
        const escapedName = encodeURIComponent(companyName)
        const news = `https://news.google.com/search?q=${escapedName}`
        const patents = `https://patents.google.com/?assignee=${escapedName}`
        return{newsUrl: news, patentsUrl: patents}
    }

    _setPublicCompany(publicCompanyObj, prototype) {
        // Transform the company_dns  object into a company object suitable for mediumroast
        const myCompany = publicCompanyObj[2].data
        
        // Company name
        'name' in myCompany ? prototype.name.value = myCompany.name : prototype.name.value = prototype.name.value

        // Company role
        'role' in myCompany ? prototype.role.value = myCompany.role : prototype.role.value = prototype.role.value

        // Company industry
        // TODO given the changes in the company_dns this is no longer right need to review this
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
        'country' in myCompany ? prototype.region.value = myCompany.region : prototype.region.value = prototype.region.value

        // Company region
        'region' in myCompany ? prototype.country.value = myCompany.country : prototype.country.value = prototype.country.value

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
        
        // Company industry description
        'industry' in myCompany ? prototype.industry.value = myCompany.industry : prototype.industry.value = prototype.industry.value

        // Company industry code
        'industry_code' in myCompany ? prototype.industry_code.value = myCompany.industry_code : 
            prototype.industry_code.value = prototype.industry_code.value

        // Company industry group description
        'industry_group_description' in myCompany ? prototype.industry_group_description.value = myCompany.industry_group_description : 
            prototype.industry_group_description.value = prototype.industry_group_description.value

        // Company industry group code
        'major_group_code' in myCompany ? prototype.industry_group_code.value = myCompany.industry_group_code : 
            prototype.industry_group_code.value = prototype.industry_group_code.value

        // Company major group description
        'major_group_description' in myCompany ? prototype.major_group_description.value = myCompany.major_group_description : 
            prototype.major_group_description.value = prototype.major_group_description.value

        // Company major group code
        'major_group_code' in myCompany ? prototype.major_group_code.value = myCompany.major_group_code : 
            prototype.major_group_code.value = prototype.major_group_code.value
        
        // Company type
        'type' in myCompany ? prototype.company_type.value = myCompany.type : 
            prototype.company_type.value = prototype.company_type.value
        // Company type
        'company_type' in myCompany ? prototype.company_type.value = myCompany.company_type : 
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

        return prototype
    }

    _setGeneralCompany(generalCompanyObj, prototype, isPublic) {
        // Transform the company_dns  object into a company object suitable for mediumroast
        const myCompany = generalCompanyObj
        
        // Company name
        'name' in myCompany ? prototype.name.value = myCompany.name : prototype.name.value = prototype.name.value

        // Company website
        'url' in myCompany ? prototype.url.value = myCompany.url : prototype.url.value = prototype.url.value

        // Company type
        'company_type' in myCompany ? prototype.company_type.value = myCompany.company_type : prototype.company_type.value = prototype.company_type.value

        // Company role
        'role' in myCompany ? prototype.role.value = myCompany.role : prototype.role.value = prototype.role.value

        // Company address
        'address' in myCompany ? prototype.street_address.value = myCompany.address : prototype.street_address.value = prototype.street_address.value
        'street_address' in myCompany ? prototype.street_address.value = myCompany.street_address : prototype.street_address.value = prototype.street_address.value

        // Company city
        'city' in myCompany ? prototype.city.value = myCompany.city : prototype.city.value = prototype.city.value

        // Company state/province
        'state_province' in myCompany ? prototype.state_province.value = myCompany.state_province : 
            prototype.state_province.value = prototype.state_province.value

        // Company state/province
        'zip_postal' in myCompany ? prototype.zip_postal.value = myCompany.zip_postal : 
            prototype.zip_postal.value = prototype.zip_postal.value

        // Company country
        'country' in myCompany ? prototype.country.value = myCompany.country : prototype.country.value = prototype.country.value

        // Company region
        'region' in myCompany ? prototype.region.value = myCompany.region : prototype.region.value = prototype.region.value

        // Company phone
        'phone' in myCompany ? prototype.phone.value = myCompany.phone : prototype.phone.value = prototype.phone.value

        // Company description
        'description' in myCompany ? prototype.description.value = myCompany.description : prototype.description.value = prototype.description.value
        // TODO clean description of any quotes either single or double
        prototype.description.value = prototype.description.value.replace(/["']/g, '')
        
        // Company longitude coordinate
        'longitude' in myCompany ? prototype.longitude.value = myCompany.longitude : 
            prototype.longitude.value = prototype.longitude.value
        
        // Company latitude
        'latitude' in myCompany ? prototype.latitude.value = myCompany.latitude : prototype.latitude.value = prototype.latitude.value

        // Company wikipedia url
        'wikipedia_url' in myCompany ? prototype.wikipedia_url.value = myCompany.wikipedia_url : 
            prototype.wikipedia_url.value = prototype.wikipedia_url.value
        
        // Company industry description
        'industry' in myCompany ? prototype.industry.value = myCompany.industry : prototype.industry.value = prototype.industry.value

        // Company industry code
        'industry_code' in myCompany ? prototype.industry_code.value = myCompany.industry_code : 
            prototype.industry_code.value = prototype.industry_code.value

        // Company industry group description
        'industry_group_description' in myCompany ? prototype.industry_group_description.value = myCompany.industry_group_description : 
            prototype.industry_group_description.value = prototype.industry_group_description.value

        // Company industry group code
        'major_group_code' in myCompany ? prototype.industry_group_code.value = myCompany.industry_group_code : 
            prototype.industry_group_code.value = prototype.industry_group_code.value

        // Company major group description
        'major_group_description' in myCompany ? prototype.major_group_description.value = myCompany.major_group_description : 
            prototype.major_group_description.value = prototype.major_group_description.value

        // Company major group code
        'major_group_code' in myCompany ? prototype.major_group_code.value = myCompany.major_group_code : 
            prototype.major_group_code.value = prototype.major_group_code.value
        
        // Company type
        'company_type' in myCompany ? prototype.company_type.value = myCompany.company_type : 
            prototype.company_type.value = prototype.company_type.value

        // Google maps
        'google_maps_url' in myCompany ? prototype.google_maps_url.value = myCompany.google_maps_url : 
            prototype.google_maps_url.value = prototype.google_maps_url.value

        // Google news
        'google_news_url' in myCompany ? prototype.google_news_url.value = myCompany.google_news_url : 
            prototype.google_news_url.value = prototype.google_news_url.value

        // Google patents
        'google_patents_url' in myCompany ? prototype.google_patents_url.value = myCompany.google_patents_url : 
            prototype.google_patents_url.value = prototype.google_patents_url.value

        if(isPublic) {
            // Company firmographics url
            'firmographics_url' in myCompany ? prototype.firmographics_url.value = myCompany.firmographicsURL : 
            prototype.firmographics_url.value = prototype.firmographics_url.value
    
            // Company public filings url
            'filings_url' in myCompany ? prototype.filings_url.value = myCompany.filings_url : 
            prototype.filings_url.value = prototype.filings_url.value
    
            // Company stock tractions by individual and institutional owner
            'owner_transactions' in myCompany ? prototype.owner_transactions.value = myCompany.owner_transactions : 
            prototype.owner_transactions.value = prototype.owner_transactions.value

            // Google finance
            'google_finance_url' in myCompany ? prototype.google_finance_url.value = myCompany.google_finance_url : 
            prototype.google_finance_url.value = prototype.google_finance_url.value

            // Company 10-k and 10-q urls
            'recent10k_url' in myCompany ? prototype.recent10k_url.value = myCompany.recent10k_url : prototype.recent10k_url.value = prototype.recent10k_url.value
            'recent10q_url' in myCompany ? prototype.recent10q_url.value = myCompany.recent10q_url : prototype.recent10q_url.value = prototype.recent10q_url.value


            // Company CIK
            'cik' in myCompany ? prototype.cik.value = myCompany.cik : prototype.cik.value = prototype.cik.value

            // Company stock symbol/ticker
            'stock_symbol' in myCompany ? prototype.stock_symbol.value = myCompany.stock_symbol : prototype.stock_symbol.value = prototype.stock_symbol.value

            // Company stock exchange
            'stock_exchange' in myCompany ? prototype.stock_exchange.value = myCompany.stock_exchange : prototype.stock_exchange.value = prototype.stock_exchange.value

        }

        return prototype
    }


    async  doAutomatic(prototype, company){
        // Set up white lists which match to the prototype keys
        
        const publicCompanyWhiteList = [ 
            'name', 
            'description', 
            'url', 
            'phone', 
            'street_address', 
            'city',
            'state_province',
            'zip_postal',
            'country',  
        ]
        const generalCompanyWhiteList = [ 
            'name',
            'phone', 
            'url', 
            'description', 
            'street_address', 
            'city',
            'state_province',
            'zip_postal',
            'country',
            'wikipedia_url',
            'industry'   
        ]

        // switch to the right whitelist based upon company type
        // NOTE: Not using tenary because there could be a future need to branch for other types of companies
        let myWhiteList = generalCompanyWhiteList
        if (company.company_type === 'Public') {myWhiteList = publicCompanyWhiteList}

        // Attempt to search company_dns, but if there is no answer then ask if try again or do manual
        let myCompanyObj = await this.getCompany(company.name)
        let usedCompanyDNS = true
        
        // If we don't get a response from the company_dns we need to do a manual entry
        if (!myCompanyObj[0]){
            usedCompanyDNS = false
            console.log(chalk.blue.bold('No matching company found, starting manual company definition...'))
            if (company.company_type === 'Public') {
                // NOTE There's a problem here, the return from company_dns is not harmonized with the prototype.
                //      Therefore, when we sync the company object with the prototype with _setPublicCompany() it
                //      will potentially fail and/or imperfectly work. More thinking is needed here as we need to 
                //      handle a variety of cases where we don't get the inputs expected from company_dns.  One
                //      potential approach is to make use of _setGeneralCompany() to have a switch for public that
                //      essentially does the remainder of steps to sync. We'd then need to set a switch related to
                //      if company_dns worked or not.  This is likely the best case.
                // TODO Need a test case documented to show if this does or doesn't work, I think this is resolved.
                myCompanyObj = await this.wutils.doManual(prototype)
            } else {
                // Since this is not a confirmation we want to prompt for items that we only need inputs for
                myCompanyObj = await this.wutils.doManual(
                    prototype,
                    [ 
                        'phone', 
                        'url', 
                        'description', 
                        'street_address', 
                        'city',
                        'state_province',
                        'zip_postal',
                        'country',
                        'wikipedia_url'   
                    ],
                    true
                )
            }
            // Search for and set industry details
            const myIndustryChoice = await this.getIndustries()
            myCompanyObj.industry = myIndustryChoice.description
            myCompanyObj.industry_code = myIndustryChoice.code
            myCompanyObj.industry_group_description = myIndustryChoice.industry_group_desc
            myCompanyObj.industry_group_code = myIndustryChoice.industry_group
            myCompanyObj.major_group_description = myIndustryChoice.major_group_desc
            myCompanyObj.major_group_code = myIndustryChoice.major_group


            // Get Lat & Long and fill in the google maps url
            // TODO we should look for a see if the method in commonWizard can be rennovated to solve this problem
            // TODO if these are unknown then what will happen is that the address string will all be uknown therefore we need to see if we can 
            //      gracefully account for that. Note that the method in commonWizard does a little bit of that thinking. Otherwise when there are
            //      some unknown values in the mix the results will be not so good.
            const fullAddress = encodeURIComponent(`${myCompanyObj.street_address} ${myCompanyObj.city} ${myCompanyObj.state_province} ${myCompanyObj.zip_postal} ${myCompanyObj.country}`)
            const [status, msg, [lat, long]] = await this.getLatLong(fullAddress)
            myCompanyObj.latitude = lat
            myCompanyObj.longitude = long
            myCompanyObj.google_maps_url = `https://www.google.com/maps/place/${fullAddress}`

            // Set the external data links which are focused on google at this time
            myCompanyObj.google_finance_url = 'Unknown'
            const externalDataUrls = this._getExternalUrls(myCompanyObj.name)
            myCompanyObj.google_news_url = externalDataUrls.newsUrl
            myCompanyObj.google_patents_url = externalDataUrls.patentsUrl
            
            // Save role, region and type
            myCompanyObj.role = company.role
            myCompanyObj.region = company.region
            myCompanyObj.company_type = company.company_type
        } else {
            // Save role, region and type
            myCompanyObj.role = company.role
            myCompanyObj.region = company.region
        }
        
        // If this is a public company process differently
        if (company.company_type === 'Public') {
            // Should company_dns results be used then use _setPublicCompany, else use _setGeneralCompany
            usedCompanyDNS ?  
                prototype = this._setPublicCompany(myCompanyObj, prototype) :
                prototype = this._setGeneralCompany(myCompanyObj, prototype, true)
        } else {
            // This is for all non-public companies
            prototype = this._setGeneralCompany(myCompanyObj, prototype)
        }
        
            
        // After company_dns is successful then ask if we want a summary review or detailed review
        const doSummary = await this.wutils.operationOrNot(`Review summary for ${prototype.name.value} (note - No means detailed review)?`)
        if (doSummary) {
            myCompanyObj = await this.wutils.doManual(prototype, myWhiteList, true)
        } else {
            myCompanyObj = await this.wutils.doManual(prototype)
        }

        return myCompanyObj
    }

    /**
     * @async
     * @function wizard
     * @description Invoke the text based wizard process to add a company to the mediumroast.io application
     * @param {Boolean} isOwner - determines if this company should be the owning company or not
     * @param {Boolean} createObj - defines if this wizard should create the object or merely return it
     * @returns {List} - a list containing the result of the interaction with the mediumroast.io backend
     */
    async wizard(isOwner=false, createObj=true) {
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
            name: {consoleString: "name", value:this.env.DEFAULT.company},
            description: {consoleString: "description", value:this.defaultValue},
            role: {consoleString: "role (e.g. Owner, Competitor, Partner, etc.)", value:this.defaultValue},
            company_type: {consoleString: "company type (e.g. Public, Private, etc.)", value:this.defaultValue},
            industry: {consoleString: "industry description", value:this.defaultValue},
            industry_code: {consoleString: "industry code", value:this.defaultValue},
            industry_group_code: {consoleString: "industry group code", value:this.defaultValue},
            industry_group_description: {consoleString: "industry group description", value:this.defaultValue},
            major_group_code: {consoleString: "major group code", value:this.defaultValue},
            major_group_description: {consoleString: "major group description", value:this.defaultValue},
            url: {consoleString: "website", value:this.defaultValue},
            logo_url: {consoleString: "logo url", value:this.defaultValue},
            street_address: {consoleString: "street address", value:this.defaultValue},
            city: {consoleString: "city", value:this.defaultValue},
            state_province: {consoleString: "state or province", value:this.defaultValue},
            country: {consoleString: "country", value:this.defaultValue},
            zip_postal: {consoleString: "zip or postal code", value:this.defaultValue},
            region: {consoleString: "region", value:this.defaultValue},
            longitude: {consoleString: "longitude", value:this.defaultValue},
            latitude: {consoleString: "latitude", value:this.defaultValue},
            phone: {consoleString: "phone number", value:this.defaultValue},
            google_maps_url: {consoleString: "URL to locate the company on Google Maps", value:this.defaultValue},
            google_news_url: {consoleString: "URL to find news about the company on Google", value:this.defaultValue},
            google_finance_url: {consoleString: "URL to reveal financial insights on Google", value:this.defaultValue},
            google_patents_url: {consoleString: "URL to locate patent insights on Google", value:this.defaultValue},
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

        // Defining essential company attributes
        console.log(chalk.blue.bold('Defining key company attributes like name, type, role and region.'))
 
        // Pull in the name from the env
        let tmpCompany = await this.wutils.doManual(
            {name: {
                consoleString: "name is", 
                value:this.env.DEFAULT.company,
                altMessage: "Your company\'s"
            }},
            [],
            false,
            true
        )
        
        // Assign the company's name based upon what was supplied in the env and confirmed by the user
        myCompany.name = tmpCompany.name

        // Define the company type
        const tmpCompanyType = await this.wutils.doList(
            "What type of company is this?",
            [
                {name: 'Public'}, 
                {name: 'Private'}, 
                {name: 'Non Profit'}, 
                {name: 'Not for Profit'}
            ]
        )
        myCompany.company_type = tmpCompanyType
        console.log(chalk.blue.bold(`Set the company\'s type to [${myCompany.company_type}]`))

        // Set company role
        if (isOwner) {
            myCompany.role = 'Owner'
        // TODO harmonize with the web_ui
        } else {
            const tmpRole = await this.wutils.doList(
                "What role should we assign to this company?",
                [
                    {name: 'Competitor'}, 
                    {name: 'Current Partner'},
                    {name: 'Target Partner'},
                    {name: 'Target End User'},
                    {name: 'End User Customer'},
                    {name: 'Former Customer'}
                ]
            )
            myCompany.role = tmpRole
        }
        console.log(chalk.blue.bold(`Set the company\'s role to [${myCompany.role}]`))

        // Set the region
        myCompany.region = await this.wutils.getRegion()
        console.log(chalk.blue.bold(`Set the company\'s region to [${myCompany.region}]`))



        // NOTE: We will need to pass in the company name and type to help us determine what do to
        // If anything other than public we don't need to fill out the full set
        // General flow should be to try and discover the company attributes, and fallback to manual.
        // NOTE: We could consider adding new company firmographics to a central DB

        console.log(chalk.blue.bold(`Attempting to automatically discover company firmographics.`))
        myCompany = await this.doAutomatic(companyPrototype, myCompany)

        // Topics
        myCompany.topics = {}
        // Comparison
        myCompany.comparison = {}
        // Quality
        myCompany.quality = {}
        // Logo
        myCompany.url !== 'Unknown' ?
            myCompany.logo_url = await this.getLogo(myCompany.url):
            myCompany.logo_url = this.defaultValue
        console.log(chalk.green('Finished company definition.'))


        if (createObj) {
        console.log(chalk.blue.bold(`Saving company ${myCompany.name} to mediumroast.io...`))
            // NOTE: This is temporarily commented out
            this.cutils.printLine()
            return await this.apiController.createObj(myCompany)
            // TODO: Change return structure to the following when we understand what is being returned
            // return [true,{status_code: 200, status_msg: `Returning object for ${myCompany.name}`}, myCompany]
        } else {
            this.cutils.printLine()
            return [true,{status_code: 200, status_msg: `Returning object for ${myCompany.name}`}, myCompany]
        }
    }

}

export default AddCompany