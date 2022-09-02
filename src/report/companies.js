// Import required modules
import docx from 'docx'
import Utilities from './common.js'

class CompanySection {
    constructor(company) {
        this.company = company
        this.company.stock_symbol === 'Unknown' && this.company.cik === 'Unknown' ? 
            this.companyType = 'Private' :
            this.companyType = 'Public'
        this.util = new Utilities()
    }

    // Create a URL on Google maps to search for the address
    addressRow() {
        // Define the address string
        const addressBits = [
            this.company.street_address, 
            this.company.city, 
            this.company.state_province, 
            this.company.zip_postal, 
            this.company.country
        ]
        // Define the base URL for address searching
        const addressBaseUrl = 'https://www.google.com/maps/place/'
        // Create the string to search with
        let addressSearch = ""
        for (const element in addressBits) {
            if (element === 'Unknown' || !element) {
                continue
            }
            let tmpString = addressBits[element]
            tmpString = tmpString.replace(' ', '+')
            addressSearch+='+' + tmpString
        }
        // Create the URL to use for searching Google for the address
        const addressUrl = addressBaseUrl + encodeURIComponent(addressSearch)
        // Create the string to use for the text part of a hyperlink
        const addressString = addressBits[0] + ', ' +
            addressBits[1] + ', ' + addressBits[2] + ' ' + addressBits[3] + ', ' +
            addressBits[4]
        // Return the created elements 
        return this.util.urlRow('Location', addressString, addressUrl)
    }

    // Create a URL to search for patents on Google patents
    patentRow() {
        const patentString = this.company.name + ' Patent Search'
        const patentUrl = 'https://patents.google.com/?assignee=' + this.company.name
        return this.util.urlRow('Patents', patentString, patentUrl)
    }

    // Create a URL to search for news on Google news
    newsRow() {
        const newsString = this.company.name + ' Company News'
        const newsUrl = 'https://news.google.com/search?q=' + this.company.name
        return this.util.urlRow('News', newsString, newsUrl)
    }

    // Define the CIK and link it to an EDGAR search if available
    cikRow() {
        if (this.company.cik === 'Unknown') {
            return this.util.basicRow('CIK', this.company.cik)
        } else {
            const baseURL = 'https://www.sec.gov/edgar/search/#/ciks='
            return this.util.urlRow('CIK', this.company.cik, baseURL + this.company.cik)
        }
    }

    // Define the CIK and link it to an EDGAR search if available
    stockSymbolRow() {
        if (this.company.stock_symbol === 'Unknown') {
            return this.util.basicRow('Stock Symbol', this.company.stock_symbol)
        } else {
            const baseURL = 'https://www.bing.com/search?q='
            return this.util.urlRow('Stock Symbol', this.company.stock_symbol, baseURL + this.company.stock_symbol)
        }
    }

    makeFirmographics() {
        const noInteractions = String(Object.keys(this.company.linked_interactions).length)
        const noStudies = String(Object.keys(this.company.linked_studies).length)
        const myTable = new docx.Table({
            columnWidths: [20, 80],
            rows: [
                this.util.basicRow('Name', this.company.name),
                this.util.basicRow('Description', this.company.description),
                this.util.urlRow('Website', this.company.url, this.company.url),
                this.util.basicRow('Role', this.company.role),
                this.util.basicRow('Industry', this.company.industry),
                this.patentRow(),
                this.newsRow(),
                this.addressRow(),
                this.util.basicRow('Region', this.util.regions[this.company.region]),
                this.util.basicRow('Phone', this.company.phone),
                this.util.basicRow('Type', this.companyType),
                this.stockSymbolRow(),
                this.cikRow(),
                this.util.basicRow('No. Interactions', noInteractions),
                this.util.basicRow('No. Studies', noStudies),
            ],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return myTable
    }
}

export { CompanySection }