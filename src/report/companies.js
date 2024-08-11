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
import { Utilities as CLIUtilities } from '../cli/common.js' 
import { getMostSimilarCompany } from './tools.js'
import TextWidgets from './widgets/Text.js'
import TableWidgets from './widgets/Tables.js'
import { read } from 'xlsx'

class BaseCompanyReport {
    constructor(company, env) {
        this.company = company
        this.env = env
        this.company.stock_symbol === 'Unknown' && this.company.cik === 'Unknown' ? 
            this.companyType = 'Private' :
            this.companyType = 'Public'
        this.util = new DOCXUtilities(env)
        this.baseDir = this.env.outputDir
        this.workDir = this.env.workDir
        this.baseName = company.name.replace(/ /g,"_")
        this.textWidgets = new TextWidgets(env)
        this.tableWidgets = new TableWidgets(env)
    }

}

class CompanySection extends BaseCompanyReport {
    /**
     * A high level class to create sections for a Company report using either 
     * Microsoft DOCX format or eventually HTML format.  Right now the only available 
     * implementation is for the DOCX format.  These sections are designed to be consumed
     * by a wrapping document which could be for any one of the mediumroast objects.
     * @constructor
     * @classdesc To operate this class the constructor should be passed a single company object.
     * @param {Object} company - The company object to generate the section(s) for
     * @todo Since the ingestion function detects the companyType this property is deprecated and should be removed
     * @todo separate this class into a separate file
     */
    constructor(company, env) {
        super(company, env)
    }

    // Create a URL on Google maps to search for the address
    _addressRow() {
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
        return this.tableWidgets.twoColumnRowWithHyperlink(['Location', addressString, addressUrl])
    }

    _genericUrlRow(label, urlText, url) {
        if (urlText === 'Unknown') {
            return this.tableWidgets.twoColumnRowBasic([label, urlText])
        } else {
            return this.tableWidgets.twoColumnRowWithHyperlink([label, urlText, url])
        }
    }

    /**
     * @function makeFirmographicsDOCX
     * @description Create a table containing key information for the company in question
     * @returns {Object} A docx table is return to the caller
     */
    makeFirmographicsDOCX() {
        return new docx.Table({
            columnWidths: [20, 80],
            rows: [
                this.tableWidgets.twoColumnRowBasic(['Name', this.company.name]),
                this.tableWidgets.twoColumnRowBasic(['Description', this.company.description]),
                this._genericUrlRow('Website', this.company.url, this.company.url),
                this.tableWidgets.twoColumnRowBasic(['Role', this.company.role]),
                this._genericUrlRow('Patents', 'Patent Search', this.company.google_patents_url),
                this._genericUrlRow('News', 'Company News', this.company.google_news_url),
                this._addressRow(),
                this.tableWidgets.twoColumnRowBasic(['Region', this.company.region]),
                this.tableWidgets.twoColumnRowBasic(['Phone', this.company.phone]),
                this.tableWidgets.twoColumnRowBasic(['Type', this.companyType]),
                this._genericUrlRow(
                    'Stock Symbol', 
                    this.company.stock_symbol, 
                    `https://www.bing.com/search?q=${this.company.stock_symbol}`
                ),
                this._genericUrlRow(
                    'EDGAR CIK',
                    this.company.cik,
                    `https://www.sec.gov/edgar/search/#/ciks=${this.company.cik}`
                )
            ],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    // Rank supplied topics and return an object that can be rendered
    _rankComparisons (comparisons, competitors) {
        // Set up a blank object to help determine the top score
        let rankPicker = {}

        // Using the Euclidean distance find the closest company
        const rankedCompanies = getMostSimilarCompany(comparisons, competitors)
        
        // const ranges = boxPlot(similarityScores)
        const ranges = boxPlot(rankedCompanies.distances)

        // Restructure the objects into the final object for return
        let finalComparisons = {}
        for (const compare in comparisons) {
            // Rank the tag score using the ranges derived from box plots
            // if > Q3 then the ranking is Furthest
            // if in between Q2 and Q3 then the ranking is Nearby
            // if < Q3 then the ranking is Closest
            let rank = null
            if (rankedCompanies.companyMap[compare] >= ranges.upperQuartile) {
                rank = 'Furthest'
            } else if (rankedCompanies.companyMap[compare] <= ranges.lowerQuartile) {
                rank = 'Closest'
            // NOTE: this should work, but for some reason it isn't, head scratcher
            // } else if (ranges.lowerQuartile < comparisons[compare].similarity < ranges.upperQuartile) {
            } else {
                rank = 'Nearby'
            }

            // Populate the rank picker to determine the top score
            rankPicker[rankedCompanies.companyMap[compare]] = compare
            
            // Build the final comparison object
            finalComparisons[compare] = {
                // Normalize to two decimal places and turn into %
                score: Math.ceil(rankedCompanies.companyMap[compare] * 10), 
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
    makeComparisonDOCX(comparisons, competitors) {
        // Transform the comparisons into something that is usable for display
        const [myComparison, picks] = this._rankComparisons(comparisons, competitors)

        // Choose the company object with the top score
        const topChoice = picks[Object.keys(picks).sort()[0]]
        const topCompany = myComparison[(topChoice)]
        const topCompanyName = topCompany.name
        const topCompanyRole = topCompany.role

        let myRows = [this.tableWidgets.threeColumnRowBasic(['Company', 'Role', 'Similarity Distance'], {allColumnsBold: true})]
        for (const comparison in myComparison) {
            myRows.push(
                this.tableWidgets.threeColumnRowBasic(
                    [
                        myComparison[comparison].name,
                        myComparison[comparison].role,
                        `${String.fromCharCode(0x2588).repeat(myComparison[comparison].score)}    (${myComparison[comparison].rank})`,
                    ],
                    {firstColumnBold: false}
                )
            )
        }
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [40, 30, 30],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return [
            this.textWidgets.makeParagraph(
                `According to findings from Mediumroast for GitHub, the closest company to ${this.company.name} in terms of ` +
                `content similarity is ${topCompanyName} who appears to be a ${topCompanyRole} of ${this.company.name}. ` +
                `Additional information on ` +
                `${this.company.name}'s comparison with other companies is available in the accompanying table.`
            ),
            myTable
        ]
    }

    async makeCompetitorDOCX(similarCompany, interactions, similarity, isPackage){
        let competitivePage = []

        // Construct the object to create company related document sections
        const comp = new CompanySection(similarCompany, this.env)
        // Create the company firmographics table
        const firmographicsTable = comp.makeFirmographicsDOCX() 
        const tagsTable = this.tableWidgets.tagsTable(similarCompany.tags)
        
        // Create a section for the most/least similar interactions
        const mostSimIntName = similarity[similarCompany.name].most_similar.name
        const mostSimIntScore = Math.round(parseFloat(similarity[similarCompany.name].most_similar.score) * 100)
        const mostSimInt = interactions.filter(interaction => interaction.name === mostSimIntName)[0]
        const leastSimIntName = similarity[similarCompany.name].least_similar.name
        const leastSimIntScore = Math.round(parseFloat(similarity[similarCompany.name].least_similar.score) * 100)
        const leastSimInt = interactions.filter(interaction => interaction.name === leastSimIntName)[0]

        // Compute reading time
        const totalReadingTime = parseInt(mostSimInt.reading_time) + parseInt(leastSimInt.reading_time)

        // Build the most/least similar interactions tables
        const simTableRows = [
            this.tableWidgets.threeColumnRowBasic(['Interaction Name', 'Similarity Score', 'Type'], {allColumnsBold: true}),
            this.tableWidgets.threeColumnRowBasic([mostSimIntName, mostSimIntScore, 'Most Similar'], {firstColumnBold: false}),
            this.tableWidgets.threeColumnRowBasic([leastSimIntName, leastSimIntScore, 'Least Similar'], {firstColumnBold: false})
        ]
        const simTable = new docx.Table({
            columnWidths: [60, 20, 20],
            rows: simTableRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        // Create a section for the most/least similar interactions
        const interact = new InteractionSection(
            [mostSimInt, leastSimInt],
            similarCompany.name,
            'Company'
        )

        // Construct this competitive pages
        competitivePage.push(
            this.util.makeHeadingBookmark2(`Details for: ${similarCompany.name}`),
            firmographicsTable,
            this.util.makeHeadingBookmark2('Tags'),
            tagsTable,
            this.util.makeHeadingBookmark2('Table for most/least similar interactions'),
            simTable,
            this.util.makeHeadingBookmark2('Interaction abstracts'),
            // ...interact.makeReferencesDOCX(isPackage)
        )

        // Return the document fragment
        return {reading_time: totalReadingTime, doc: competitivePage}
    }
}


class CompanyStandalone extends BaseCompanyReport {
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
     * @param {String} author - the company of the report author
     * @todo Rename this class as report and rename the file as companyDocx.js
     * @todo Adapt to settings.js for consistent application of settings, follow dashboard.js
     */
    constructor(sourceData, env, author='Mediumroast for GitHub') {
        super(sourceData.company[0], env)
        this.sourceData = sourceData
        this.objectType = 'Company'
        this.creator = author
        this.author = author
        this.authoredBy = author
        this.title = `${this.company.name} Company Report`
        this.interactions = sourceData.allInteractions
        this.competitors = sourceData.competitors.all
        this.mostSimilar = sourceData.competitors.mostSimilar
        this.leastSimilar = sourceData.competitors.leastSimilar
        this.description = `A Company report for ${this.company.name} that includes firmographics, key information on competitors, and Interactions data.`
        this.introduction = `Mediumroast for GitHub automatically generated this document. It includes company firmographics, key information on competitors, and Interactions data for ${this.company.name}. If this report is produced as a package, then the hyperlinks are active and will link to documents on the local folder after the package is opened.`
        this.similarity = this.company.similarity,
        this.noInteractions = String(Object.keys(this.company.linked_interactions).length)
        this.totalInteractions = sourceData.totalInteractions
        this.totalCompanies = sourceData.totalCompanies
        this.averageInteractions = sourceData.averageInteractionsPerCompany
    }

    /**
     * @async
     * @function makeDocx
     * @description Generate and save a DOCX report for a Company object
     * @param {String} fileName - parameter is deprecated, but kept for compatibility
     * @param {Boolean} isPackage - When set to true links are set up for connecting to interaction documents
     * @returns {Array} The result of the writeReport function that is an Array
     * @todo remove the file name from mrcli-company and this module
     */
    async makeDOCX(fileName, isPackage) {
        // Initialize the working directories to create a package and/or download relevant images
        this.util.initDirectories()

        // Set the file name
        fileName = fileName ? fileName : `${this.env.outputDir}/${this.baseName}.docx`

        // Capture the current date
        const date = new Date();
        const preparedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })

        // Set up strings for headers and footers
        const preparedOn = `Prepared on: ${preparedDate}`
        const authoredBy = `Authored by: ${this.authoredBy}`
        const preparedFor = `${this.authoredBy} report for: `
        
        // Construct the companySection and interactionSection objects
        const companySection = new CompanySection(this.company, this.env)
        // const interactionSection = new InteractionSection(
        //     this.interactions, 
        //     this.company.name,
        //     this.objectType,
        //     this.env
        // )

        // Construct the dashboard object
        const myDash = new CompanyDashbord(this.env)

        // Build sections for most and least similar companies
        const mostSimilarReport = await companySection.makeCompetitorDOCX(this.mostSimilar, this.interactions, this.similarity, isPackage)

        const leastSimilarReport = await companySection.makeCompetitorDOCX(this.leastSimilar, this.interactions, this.similarity, isPackage)

        // Compute the total reading time for all source most/least similar interactions
        const totalReadingTime = mostSimilarReport.reading_time + leastSimilarReport.reading_time

        const mostLeastSimilarIntro = this.textWidgets.makeParagraph(
            `For the most and least similar companies, additional data is provided including firmographics, most/least similar interaction table, and most/least similar interaction abstracts.\n\nTotal estimated reading time for all interactions from most/least similar companies is ${totalReadingTime} minutes, but reading the abstracts will take less time.`
        )

        // Set up the default options for the document
        const myDocument = [].concat(
            this.util.makeIntro(this.introduction),
            // Generate the firmographics and tags sections for the Company being reported on
            [
                this.textWidgets.makeHeading1('Firmographics'), 
                companySection.makeFirmographicsDOCX(),
                this.textWidgets.makeHeading1('Tags'),
                this.tableWidgets.tagsTable(this.company.tags),
                this.textWidgets.makeHeading1('Competitive Similarity'),
            ],
            // Generate the comparisons section for the Company being reported on to characterize competitive similarity
            companySection.makeComparisonDOCX(this.similarity, this.competitors),
            [
                this.textWidgets.pageBreak(),
                this.textWidgets.makeHeadingBookmark1('Detail For Most/Least Similar Companies'),
                mostLeastSimilarIntro,
                ...mostSimilarReport.doc,
                ...leastSimilarReport.doc
            ],


            // [   this.util.makeHeading1('Topics'),
            //     this.util.makeParagraph(
            //         'The following topics were automatically generated from all ' +
            //         this.noInteractions + ' interactions associated to this company.'
            //     ),
            //     this.util.makeHeadingBookmark1('Interaction Summaries', 'interaction_summaries')
            // ],
            // ...interactionSection.makeDescriptionsDOCX(),
            // await companySection.makeCompetitorsDOCX(this.competitors, isPackage),
            // [   this.util.pageBreak(),
            //     this.util.makeHeading1('References')
            // ],
            // ...interactionSection.makeReferencesDOCX(isPackage)
            )

        // Construct the document
        const myDoc = new docx.Document ({
            creator: this.creator,
            company: this.author,
            title: this.title,
            description: this.description,
            background: {
                color: this.util.documentColor,
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
                    headers: {
                        default: this.util.makeHeader(this.company.name, preparedFor, {landscape: true})
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makeFooter(authoredBy, preparedOn, {landscape: true})]
                        })
                    },
                    children: [
                        await myDash.makeDashboard(
                            this.company, 
                            {mostSimilar: this.sourceData.competitors.mostSimilar, leastSimilar: this.sourceData.competitors.leastSimilar},
                            this.interactions,
                            this.noInteractions,
                            this.totalInteractions,
                            this.totalCompanies,
                            this.averageInteractions
                        )
                    ],
                },
                {
                    properties: {},
                    headers: {
                        default: this.util.makeHeader(this.company.name, preparedFor)
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makeFooter(authoredBy, preparedOn)]
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