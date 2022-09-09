// Import required modules
import docx from 'docx'
import boxPlot from 'box-plot'
import Utilities from './common.js'
import { InteractionSection } from './interactions.js'

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

    // Rank supplied topics and return an object that can be rendered
    rankComparisons (comparisons) {
        // Set up a blank object to help determine the top score
        let rankPicker = {}

        // Pluck out the similarity scores to feed them into the blox plot module
        const similarityScores = Object.values(comparisons).map(
            (myScore) => {
                return myScore.similarity
            }
        )
        const ranges = boxPlot(similarityScores)

        // Restructure the objects into the final object for return
        let finalComparisons = {}
        for (const comparison in comparisons) {
            // Rank the tag score using the ranges derived from box plots
            // if > Q3 then the ranking is High
            // if in between Q2 and Q3 then the ranking is Medium
            // if < Q3 then the ranking is Low
            let rank = null
            if (comparisons[comparison].similarity > ranges.upperQuartile) {
                rank = 'High'
            } else if (comparisons[comparison].similarity < ranges.lowerQuartile) {
                rank = 'Low'
            } else if (ranges.lowerQuartile <= comparisons[comparison].similarity <= ranges.upperQuartile) {
                rank = 'Medium'
            }

            // Populate the rank picker to determine the top score
            rankPicker[comparisons[comparison].similarity] = comparison
            
            // Build the final comparison object
            finalComparisons[comparison] = {
                // Normalize to two decimal places and turn into %
                score: String(Math.round(finalComparisons[comparison].similarity) * 100) + '%', 
                rank: rank,
                role: finalComparisons[comparison].role,
                name: finalComparisons[comparison].name
            }
            
        }
        return finalComparisons, rankPicker
    }

    makeComparison() {
        // Transform the comparisons into something that is usable for display
        const [comparisons, picks] = this.rankComparisons(this.company.comparisons)

        // Choose the company object with the top score
        const topChoice = picks[Math.max(Object.keys(picks))]
        const topCompany = comparisons[topChoice]
        const topCompanyName = comparisons[topCompany].name
        const topCompanyRole = comparisons[topCompany].role

        let myRows = [this.basicTopicRow('Company', 'Role', 'Score', 'Rank', true)]
        for (const comparison in comparisons) {
            myRows.push(
                this.basicTopicRow(
                    comparisons[comparison].name,
                    comparisons[comparison].role,
                    comparisons[comparison].similarity,
                    comparisons[comparison].rank,
                )
            )
        }
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [60, 20, 20],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return [
            this.makeParagraph(
                'The mediumroast.io has compared the content for all companies in the system to ' +
                this.company.name + '\'s content and discovered that the closest company is ' +
                topCompanyName + ' acting in the role of a ' + topCompanyRole + '.' +
                'Additional detail for other companies ' + this.company.name + ' was compared to are ' +
                'in the table below.'
            ),
            this.util.makeHeading2('Comparison Table'),
            myTable
        ]


    }
}

class CompanyStandalone {
    constructor(company, interactions, creator, authorCompany) {
        this.creator = creator
        this.authorCompany = authorCompany
        this.title = company.name + ' Company Report'
        this.interactions = interactions
        this.company = company
        this.description = 'A Company report summarizing ' + company.name + ' and including relevant company data.'
        this.introduction = 'The mediumroast.io system automatically generated this document.' +
            ' It includes key metadata for this Company object and relevant summaries and metadata from the associated interactions.' + 
            '  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.util = new Utilities()
        this.topics = this.util.rankTags(this.company.topics)
    }

    makeIntro () {
        const myIntro = [
            this.util.makeHeading1('Introduction'),
            this.util.makeParagraph(this.introduction)
        ]
        return myIntro
    }


    async makeDocx(fileName, isPackage) {
        // If fileName isn't specified create a default
        fileName = fileName ? fileName : process.env.HOME + '/Documents/' + this.company.name.replace(/ /g,"_") + '.docx'

        // Construct the company section
        const companySection = new CompanySection(this.company)

        // Construct the interactions section
        // const interactionsSection = new InteractionSection(this.interactions)

        // Set up the default options for the document
        const myDocument = [].concat(
            this.makeIntro(),
            [
                this.util.makeHeading1('Company Detail'), 
                companySection.makeFirmographics(),
                this.util.makeHeading1('Comparison')
            ],
                companySection.makeComparison(),
            [   this.util.makeHeading1('Topics'),
                this.util.topicTable(this.topics),
                // this.util.makeHeading1('Interaction Summaries'),
                //interactionSection.makeSummaries(),
                // this.util.pageBreak(),
                // this.util.makeHeading1('References')
                //interactionSection.makeReferences(isPackage),
            ])
    
        // Construct the document
        const myDoc = new docx.Document ({
            creator: this.creator,
            company: this.authorCompany,
            title: this.title,
            description: this.description,
            styles: {default: this.util.styling.default},
            numbering: this.util.styling.numbering,
            sections: [{
                properties: {},
                children: myDocument,
            }],
        })

        // Persist the document to storage
        return await this.util.writeReport(myDoc, fileName)
    }
}

export { CompanyStandalone, CompanySection }