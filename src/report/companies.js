// Import required modules
import docx from 'docx'
import Utilities from './common.js'

class Section {
    constructor(company) {
        this.company = company
        this.company.stock_symbol === 'Unknown' && this.company.cik === 'Unknown' ? 
            this.companyType = 'Private' :
            this.companyType = 'Public'
    }

    // Define the CIK and link it to an EDGAR search if available
    cikRow () {
        if (this.company.cik === 'Unknown') {
            return this.basicRow('CIK', this.company.cik)
        } else {
            const baseURL = 'https://www.sec.gov/edgar/search/#/ciks='
            return this.urlRow('CIK', this.company.cik, baseURL + this.company.cik)
        }
    }

    // Define the CIK and link it to an EDGAR search if available
    stockSymbolRow () {
        if (this.company.stockSymbol === 'Unknown') {
            return this.basicRow('Stock Symbol', this.company.stock_symbol)
        } else {
            const baseURL = 'https://www.bing.com/search?q='
            return this.urlRow('Stock Symbol', this.company.stock_symbol, baseURL + this.company.stock_symbol)
        }
    }
}