#!/usr/bin/env node

import inquirer from "inquirer"
import axios from "axios"
import program from 'commander'
import logo from 'asciiart-logo'
import chalk from 'chalk'
import ora from "ora"

// TODO move this to cli/common.js
// If not suppressed print the splash screen to the console
function splashScreen (simple=false) {
    const logoConfig = {
        name: "mediumroast.io Company Wizard",
        // font: 'Speed',
        lineChars: 10,
        padding: 3,
        margin: 3,
        borderColor: 'bold-gray',
        logoColor: 'bold-orange',
        textColor: 'orange',
    }
    // Print out the splash screen
    console.log(
        logo(logoConfig)
        .emptyLine()
        .right('version 1.0.0')
        .emptyLine()
        .center(
            "Prompt based company object creation for the mediumroast.io."
        )
        .render()
    )
}

// TODO is there someway to use api/scaffold.js?
async function getObj(company) {
    const myURL = "http://cherokee.from-ca.com:16868/V2.0/company/merged/firmographics/" + encodeURI(company)
    const myHeaders = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }

    try {
        const resp = await axios.get(myURL, myHeaders)
        return [true, {status_code: resp.status, status_msg: resp.statusText}, resp.data]
    } catch (err) {
        // console.error(err)
        return [false, err, null]
    }
}

// TODO Move this cli option to cli/common.js
 function parseCLIArgs() {
    // Define commandline options
    program
        .name('spinner')
        .version('0.0.1')
        .description('Fetches company info')

    program
        // System command line switches
        .requiredOption(
            '-s --splash <yes | no>',
            'Whether or not to include the splash screen at startup.',
            'yes',
            'no'
        )
    program.parse(process.argv)
    return program.opts()
}

async function getCompany () {
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
                myCompany = await getObj(await answer.company)
            })
    mySpinner.stop()
    return myCompany
}

/**
 * 
 * @param {*} myStep 
 * @returns 
 */
async function operationOrNot(myStep) {
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
 * 
 * @param {*} prototype 
 * @returns 
 */
async function doManual(prototype, summary=false) {
    let myCompanyObj = {}
    for (const setting in prototype) {
        if (summary) {
            if (![
                'description', 
                'name', 
                'phone', 
                'website', 
                'street_address', 
                'country',
                'logo_url', 
                'city'].includes(setting)) {
                myCompanyObj[setting] = prototype[setting].value
                continue
            }
        }
        await inquirer
            .prompt([
                {
                    name: setting,
                    type: 'input',
                    message: 'What\'s the company\'s ' + prototype[setting].consoleString + '?',
                    default() {
                        return prototype[setting].value
                    }
                }
            ])
            .then(async (answer) => {
                myCompanyObj[setting] = await answer[setting]
            })
    }
    return myCompanyObj
}

function _joinIndustry(industry) {
    if(industry.length > 1) {
        return industry.join('|')
    } else if (industry === 'Unknown') {
        return 'Unknown'
    } else {
        return industry[0]
    }
}

function _getFormUrls(forms){
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

/**
 * 
 * @param {*} prototype 
 */
async function doAutomatic(prototype){
    const myDefault = 'Unknown'
    let myCompanyObj = await getCompany()
    // Else attempt to search company_dns, but if there is no answer then ask if try again or manual
    if (!myCompanyObj[0]){
        const redo = await operationOrNot('There was no company matching your search. Would you like to try again?')
        if (redo) {
            myCompanyObj = await doAutomatic(prototype)
        } else {
            console.log(chalk.blue.bold('Starting manual company creation process...'))
            myCompanyObj = await doManual(prototype)
        }
    } else {
        const myCompany = myCompanyObj[2].data
        // Transform the company_dns  object into a company object suitable for mediumroast

        // Company name
        'name' in myCompany ? prototype.name.value = myCompany.name : prototype.name.value = prototype.name.value

        // Company industry
        let myIndustry = myDefault
        'industry' in myCompany ? myIndustry = _joinIndustry(myCompany.industry) : myIndustry = myDefault
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

        // Company CIK
        'cik' in myCompany ? prototype.cik.value = myCompany.cik : prototype.cik.value = prototype.cik.value

        // Company stock symbol/ticker
        'tickers' in myCompany ? prototype.stock_symbol.value = myCompany.tickers[0] : 
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
        'forms' in myCompany ?  [tenKurl, tenQurl] = _getFormUrls(myCompany.forms) : [tenKurl, tenQurl] = [myDefault, myDefault]
        tenKurl !== myDefault ? prototype.recent10k_url.value = tenKurl : prototype.recent10k_url.value = prototype.recent10k_url.value
        tenQurl !== myDefault ? prototype.recent10q_url.value = tenQurl : prototype.recent10q_url.value = prototype.recent10q_url.value

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
        
        // After company_dns is successful then ask if we want a summary review or detailed review
        const doSummary = await operationOrNot(`Would you like to do a summary review of attributes for ${prototype.name.value}?`)
        if (doSummary) {
            myCompanyObj = await doManual(prototype, true)
        } else {
            myCompanyObj = await doManual(prototype)
        }

    }
    return myCompanyObj
}

// TODO move to CLI common.js
const myArgs = parseCLIArgs()
// Unless we suppress this print out the splash screen.
if (myArgs.splash === 'yes') {
    splashScreen()
}


// Set the prototype object which can be used for creating a real object.
// Since the backend expects certain attributes that may not be human readable, the 
// prototype below contains strings that are easier to read.  Additionally, should 
// we wish to set some defaults for each one it is also feasible within this 
// prototype object to do so.
const myDefault = 'Unknown'
let companyPrototype = {
    name: {consoleString: "name", value:myDefault},
    industry: {consoleString: "industry", value:myDefault},
    role: {consoleString: "role", value:myDefault},
    url: {consoleString: "website", value:myDefault},
    street_address: {consoleString: "street address", value:myDefault},
    city: {consoleString: "city", value:myDefault},
    state_province: {consoleString: "state or province", value:myDefault},
    country: {consoleString: "country", value:myDefault},
    region: {consoleString: "region", value:myDefault},
    phone: {consoleString: "phone number", value:myDefault},
    description: {consoleString: "description", value:myDefault},
    cik: {consoleString: "SEC Central Index Key", value:myDefault},
    stock_symbol: {consoleString: "stock ticker", value:myDefault},
    stock_exchange: {consoleString: "stock exchange", value:myDefault},
    recent10k_url: {consoleString: "recent form 10-K URL", value:myDefault},
    recent10q_url: {consoleString: "recent form 10-Q URL", value:myDefault},
    zip_postal: {consoleString: "zip or postal code", value:myDefault},
    longitude: {consoleString: "longitude", value:myDefault},
    latitude: {consoleString: "latitude", value:myDefault},
    logo_url: {consoleString: "logo url", value:myDefault},
    wikipedia_url: {consoleString: "wikipedia url", value:myDefault},
    sic: {consoleString: "Standard Industry Code", value:myDefault},
    sic_description: {consoleString: "Standard Industry Code description", value:myDefault},
    company_type: {consoleString: "company type (e.g. Public, Private, etc.)", value:myDefault},
    firmographics_url: {consoleString: "firmographics detail URL for public companies", value:myDefault},
    filings_url: {consoleString: "filings URL for public companies", value:myDefault},
    owner_transactions: {consoleString: "URL containing share ownership reports", value:myDefault},
}

// Define an empty company object
let myCompany = {}

// Choose if we want to run the setup or not, and it not exit the program
const doSetup = await operationOrNot('It appears you\'d like to create a new company, right?')
if (!doSetup) {
    console.log(chalk.red.bold('\t-> Ok exiting company object creation.'))
    process.exit()
}

// Choose if we want manual or automatic
const automatic = await operationOrNot('Would like to proceed with automatic company creation?')
if (!automatic) {
    // Perform manual setup
    console.log(chalk.blue.bold('Starting manual company creation process...'))
    myCompany = await doManual(companyPrototype)
} else {
    // Perform auto setup
    console.log(chalk.blue.bold('Starting automatic company creation process...'))
    myCompany = await doAutomatic(companyPrototype)
}



// Perform summary or detailed review
// Commit object
// Return company_id/success

// const results = await getCompany()

console.log(myCompany)