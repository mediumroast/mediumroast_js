/**
 * Two classes to create sections and documents for company objects in mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file companies.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import docx from 'docx'
import boxPlot from 'box-plot'
import DOCXUtilities from './common.js'
import { InteractionSection } from './interactions.js'
import { CompanyDashbord } from './dashboard.js'

class CompanySection {
    /**
     * A high level class to create sections for a Company report using either 
     * Microsoft DOCX format or eventually HTML format.  Right now the only available 
     * implementation is for the DOCX format.  These sections are designed to be consumed
     * by a wrapping document which could be for any one of the mediumroast objects.
     * @constructor
     * @classdesc To operate this class the constructor should be passed a single company object.
     * @param {Object} company - The company object to generate the section(s) for
     */
    constructor(company) {
        this.company = company
        this.company.stock_symbol === 'Unknown' && this.company.cik === 'Unknown' ? 
            this.companyType = 'Private' :
            this.companyType = 'Public'
        this.util = new DOCXUtilities()
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

    /**
     * @function makeFirmographicsDOCX
     * @description Create a table containing key information for the company in question
     * @returns {Object} A docx table is return to the caller
     */
    makeFirmographicsDOCX() {
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
                this.util.basicRow('Region', this.company.region),
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
        for (const compare in comparisons) {
            // Rank the tag score using the ranges derived from box plots
            // if > Q3 then the ranking is High
            // if in between Q2 and Q3 then the ranking is Medium
            // if < Q3 then the ranking is Low
            let rank = null
            if (comparisons[compare].similarity >= ranges.upperQuartile) {
                rank = 'Closest'
            } else if (comparisons[compare].similarity <= ranges.lowerQuartile) {
                rank = 'Furthest'
            // NOTE: this should work, but for some reason it isn't, head scratcher
            // } else if (ranges.lowerQuartile < comparisons[compare].similarity < ranges.upperQuartile) {
            } else {
                rank = 'Nearby'
            }

            // Populate the rank picker to determine the top score
            rankPicker[comparisons[compare].similarity] = compare
            
            // Build the final comparison object
            finalComparisons[compare] = {
                // Normalize to two decimal places and turn into %
                score: String(comparisons[compare].similarity.toFixed(2) * 100) + '%', 
                rank: rank,
                role: comparisons[compare].role,
                name: comparisons[compare].name
            }
            
        }
        return [finalComparisons, rankPicker]
    }

    /**
     * @function makeComparisonDOCX
     * @description Generate the comparisons section for the document from the company in question
     * @param {Object} comparisons - the object containing the comparisons for the company in question
     * @returns {Array} An array containing an introduction to this section and the table with the comparisons
     * @todo Sort based upon rank from highest to lowest
     */
    makeComparisonDOCX(comparisons) {
        // Transform the comparisons into something that is usable for display
        const [myComparison, picks] = this.rankComparisons(comparisons)

        // Choose the company object with the top score
        const topChoice = picks[Object.keys(picks).sort().reverse()[0]]
        const topCompany = myComparison[(topChoice)]
        const topCompanyName = topCompany.name
        const topCompanyRole = topCompany.role

        let myRows = [this.util.basicComparisonRow('Company', 'Role', 'Rank', 'Percent Similar', true)]
        for (const comparison in myComparison) {
            myRows.push(
                this.util.basicComparisonRow(
                    myComparison[comparison].name,
                    myComparison[comparison].role,
                    myComparison[comparison].rank,
                    myComparison[comparison].score,
                )
            )
        }
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [25, 25, 25, 25],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return [
            this.util.makeParagraph(
                'The mediumroast.io has compared the content for all companies in the system to ' +
                this.company.name + '\'s content and discovered that the closest company is ' +
                topCompanyName + ' acting in the role of a ' + topCompanyRole + '. ' +
                'Additional detail for other companies ' + this.company.name + ' was compared to are ' +
                'in the table below.'
            ),
            this.util.makeHeading2('Comparison Table'),
            myTable
        ]
    }

    makeCompetiorsDOCX(competitors, isPackage){
        let competitivePages = []
        let totalReadingTime = null
        for (const myComp in competitors) {
            const competitor = competitors[myComp]
            const comp = new CompanySection(competitor.company)
            const interact = new InteractionSection(
                [competitor.mostSimilar.interaction, competitor.leastSimilar.interaction],
                competitor.company.name,
                'Company'
            )
            // Compute reading time
            totalReadingTime += parseInt(competitor.mostSimilar.interaction.reading_time) + parseInt(competitor.leastSimilar.interaction.reading_time)
            const firmographicsTable = comp.makeFirmographicsDOCX() 
            const myRows = [
                this.util.basicTopicRow('Name', 'Percent Similar', 'Category', true),
                this.util.basicTopicRow(
                    competitor.mostSimilar.name, 
                    competitor.mostSimilar.score, 
                    'Most Similar'),
                this.util.basicTopicRow(
                    competitor.leastSimilar.name, 
                    competitor.leastSimilar.score, 
                    'Least Similar'),
            ]
            const summaryTable = new docx.Table({
                columnWidths: [60, 20, 20],
                rows: myRows,
                width: {
                    size: 100,
                    type: docx.WidthType.PERCENTAGE
                }
            })
            competitivePages.push(
                this.util.makeHeadingBookmark2(`Firmographics for: ${competitor.company.name}`),
                firmographicsTable,
                this.util.makeHeadingBookmark2('Table for most/least similar interactions'),
                summaryTable,
                this.util.makeHeadingBookmark2('Interaction descriptions'),
                ...interact.makeDescriptionsDOCX(),
                this.util.makeHeadingBookmark2('Interaction summaries'),
                ...interact.makeReferencesDOCX(isPackage)
            )

        }

        return [
            this.util.pageBreak(),
            this.util.makeHeadingBookmark1('Competitive Content'),
            this.util.makeParagraph(
                'For the competitive companies compared, by the mediumroast.io, additional data is provided per competitor ' +
                'including firmographics, most/least similar interaction table, most/least similar interaction descriptions, ' +
                'and most/least similar interaction summaries.\r\r' +
                `Note that the total estimated reading time for all competitive most/least similar interactions is ${totalReadingTime} minutes.`
            ),
            ...competitivePages
        ]
    }
}


class CompanyStandalone {
    /**
     * A high level class to create a complete document for a Company report using either 
     * Microsoft DOCX format or eventually HTML format.  Right now the only available 
     * implementation is for the DOCX format. 
     * @constructor
     * @classdesc Create a full and standlaone report document for a company
     * @param {Object} company - the company object to be reported on
     * @param {Array} interactions - the interactions associated to the company
     * @param {String} creator - the author of the report
     * @param {Object} competitors - the associated competitors for this company
     * @param {String} authorCompany - the company of the report author
     */
    constructor(company, interactions, competitors, creator, authorCompany) {
        this.objectType = 'Company'
        this.creator = creator
        this.authorCompany = authorCompany
        this.title = company.name + ' Company Report'
        this.interactions = interactions
        this.competitors = competitors
        this.company = company
        this.description = 'A Company report summarizing ' + company.name + ' and including relevant company data.'
        this.introduction = 'The mediumroast.io system automatically generated this document.' +
            ' It includes key metadata for this Company object and relevant summaries and metadata from the associated interactions.' + 
            '  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.util = new DOCXUtilities()
        this.topics = this.util.rankTags(this.company.topics)
        this.comparison = company.comparison,
        this.noInteractions = String(Object.keys(this.company.linked_interactions).length)
    }

    /**
     * @async
     * @function makeDocx
     * @description Generate and save a DOCX report for a Company object
     * @param {String} fileName - Full path to the file name, if no file name is supplied a default is assumed
     * @param {Boolean} isPackage - When set to true links are set up for connecting to interaction documents
     * @returns {Array} The result of the writeReport function that is an Array
     */
    async makeDOCX(fileName, isPackage) {
        // If fileName isn't specified create a default
        fileName = fileName ? fileName : process.env.HOME + '/Documents/' + this.company.name.replace(/ /g,"_") + '.docx'

        // Construct the company section
        const companySection = new CompanySection(this.company)
        const interactionSection = new InteractionSection(
            this.interactions, 
            this.company.name,
            this.objectType
        )
        const env = {}
        const myDash = new CompanyDashbord(env)

        // Construct the interactions section
        // const interactionsSection = new InteractionSection(this.interactions)

        // Set up the default options for the document
        const myDocument = [].concat(
            this.util.makeIntro(this.introduction),
            [
                this.util.makeHeading1('Company Detail'), 
                companySection.makeFirmographicsDOCX(),
                this.util.makeHeading1('Comparison')
            ],
            companySection.makeComparisonDOCX(this.comparison),
            [   this.util.makeHeading1('Topics'),
                this.util.makeParagraph(
                    'The following topics were automatically generated from all ' +
                    this.noInteractions + ' interactions associated to this company.'
                ),
                this.util.makeHeading2('Topics Table'),
                this.util.topicTable(this.topics),
                this.util.makeHeadingBookmark1('Interaction Summaries', 'interaction_summaries')
            ],
            ...interactionSection.makeDescriptionsDOCX(),
            companySection.makeCompetiorsDOCX(this.competitors, isPackage),
            [   this.util.pageBreak(),
                this.util.makeHeading1('References')
            ],
            ...interactionSection.makeReferencesDOCX(isPackage)
            )
    
        // Construct the document
        const myDoc = new docx.Document ({
            creator: this.creator,
            company: this.authorCompany,
            title: this.title,
            description: this.description,
            background: {
                color: '0F0D0E',
            },
            styles: {default: this.util.styling.default},
            numbering: this.util.styling.numbering,
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                orientation: docx.PageOrientation.LANDSCAPE,
                            },
                        },
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makePageNumber()]
                        })
                    },
                    children: [myDash.makeDashboard({}, {})],
                },
                {
                    properties: {},
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makePageNumber()]
                        })
                    },
                    children: myDocument,
                }
            ],
        })

        // Persist the document to storage
        return await this.util.writeReport(myDoc, fileName)
    }
}

export { CompanyStandalone, CompanySection }