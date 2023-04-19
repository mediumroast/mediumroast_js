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
import FilesystemOperators from '../cli/filesystem.js'
import { Utilities as CLIUtilities } from '../cli/common.js' 
import { getMostSimilarCompany } from './tools.js'

class CompanySection {
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
    constructor(company, baseDir) {
        this.company = company
        this.company.stock_symbol === 'Unknown' && this.company.cik === 'Unknown' ? 
            this.companyType = 'Private' :
            this.companyType = 'Public'
        this.util = new DOCXUtilities()
        this.baseDir = baseDir
        this.baseName = company.name.replace(/ /g,"_")
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
    rankComparisons (comparisons, competitors) {
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
        const [myComparison, picks] = this.rankComparisons(comparisons, competitors)

        // Choose the company object with the top score
        const topChoice = picks[Object.keys(picks).sort()[0]]
        const topCompany = myComparison[(topChoice)]
        const topCompanyName = topCompany.name
        const topCompanyRole = topCompany.role

        let myRows = [this.util.basicComparisonRow('Company', 'Role', 'Similarity Distance', true)]
        for (const comparison in myComparison) {
            myRows.push(
                this.util.basicComparisonRow(
                    myComparison[comparison].name,
                    myComparison[comparison].role,
                    `${String.fromCharCode(0x2588).repeat(myComparison[comparison].score)}    (${myComparison[comparison].rank})`,
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
            this.util.makeParagraph(
                `According to findings from mediumroast.io, the closest company to ${this.company.name} in terms of ` +
                `content similarity is ${topCompanyName} who appears to be a ${topCompanyRole} of ${this.company.name}. ` +
                `Additional information on ` +
                `${this.company.name}'s comparison with other companies is available in the accompanying table.`
            ),
            this.util.makeHeading2('Comparison Table'),
            myTable
        ]
    }

    async makeCompetitorsDOCX(competitors, isPackage){
        const myUtils = new CLIUtilities()
        let competitivePages = []
        let totalReadingTime = null
        for (const myComp in competitors) {
            // Filter in the competitor
            const competitor = competitors[myComp]

            // Construct the object to create company related document sections
            const comp = new CompanySection(competitor.company)

            // Create a section for the most/least similar interactions
            const interact = new InteractionSection(
                [
                    competitor.mostSimilar.interaction, 
                    competitor.leastSimilar.interaction
                ],
                competitor.company.name,
                'Company'
            )
            
            // Download the company logo
            // NOTE Since SVG formats aren't yet supported in the Javascript docx module we won't 
            //      use the logos in the document for now.  When SVG support is available this feature
            //      can be enabled.
            // await myUtils.getLogo(competitor.company, this.baseDir + '/images')

            // Compute reading time
            totalReadingTime += 
                parseInt(competitor.mostSimilar.interaction.reading_time) + 
                parseInt(competitor.leastSimilar.interaction.reading_time)

            // Create the company firmographics table
            const firmographicsTable = comp.makeFirmographicsDOCX() 

            // Assemble the rows and table
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

            // Construct this competitive pages
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

        // Return the document fragment
        return [
            this.util.pageBreak(),
            this.util.makeHeadingBookmark1('Competitive Content'),
            this.util.makeParagraph(
                `For compared companies additional data is provided including firmographics, most/least similar interaction table, most/least similar interaction descriptions, and most/least similar interaction summaries.\r\rTotal estimated reading time for all source most/least similar interactions is ${totalReadingTime} minutes.`
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
     * @param {String} author - the company of the report author
     * @todo Rename this class as report and rename the file as companyDocx.js
     * @todo Adapt to settings.js for consistent application of settings, follow dashboard.js
     */
    constructor(company, interactions, competitors, env, creator, author) {
        this.objectType = 'Company'
        this.env = env
        this.creator = creator
        this.author = author
        this.title = company.name + ' Company Report'
        this.baseName = company.name.replace(/ /g,"_")
        this.baseDir = this.env.workDir + '/' + this.baseName
        this.interactions = interactions
        this.competitors = competitors
        this.company = company
        this.description = 'A Company report summarizing ' + company.name + ' and including relevant company data.'
        /*
        ChatGPT summary
        The mediumroast.io system has meticulously crafted this report to provide you with a comprehensive overview of the Company object and its associated interactions. This document features a robust collection of key metadata that provides valuable insights into the company's operations. Furthermore, to enhance the user experience, if this report is part of a package, the hyperlinks within it are designed to be active, linking to various documents within the local folder with just one click after the package is opened. This makes exploring the details of the company a breeze!
        */
        this.introduction = 'The mediumroast.io system automatically generated this document.' +
            ' It includes key metadata for this Company object and relevant summaries and metadata from the associated interactions.' + 
            '  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.util = new DOCXUtilities()
        this.fileSystem = new FilesystemOperators()
        // this.topics = this.util.rankTags(this.company.topics)
        this.comparison = company.comparison,
        this.noInteractions = String(Object.keys(this.company.linked_interactions).length)
    }

    // 
    // Local functions
    // 

    // Basic operations to prepare for report and package creation
    _initialize() {
        // 
        const subdirs = ['interactions', 'images']
        for(const myDir in subdirs) {
            this.fileSystem.safeMakedir(this.baseDir + '/' + subdirs[myDir])
        }
    }

    // 
    // External functions
    // 

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
        this._initialize()

        // TODO when we remove fileName we can uncomment the item below
        // const fileName = process.env.HOME + '/Documents/' + this.baseName + '.docx'
        fileName = process.env.HOME + '/Documents/' + this.baseName + '.docx'

        // Download the logo
        // NOTE Since SVG formats aren't yet supported in the Javascript docx module we won't 
        //      use the logos in the document for now.  When SVG support is available this feature
        //      can be enabled.
        // const myUtils = new CLIUtilities()
        // const logoFilename = await myUtils.getLogo(this.company, this.baseDir + '/images')

        // Capture the current date
        const date = new Date();
        const preparedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
        
        // Construct the company section
        const companySection = new CompanySection(this.company, this.baseDir)
        const interactionSection = new InteractionSection(
            this.interactions, 
            this.company.name,
            this.objectType
        )
        const myDash = new CompanyDashbord(this.env)

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
            companySection.makeComparisonDOCX(this.comparison, this.competitors),
            [   this.util.makeHeading1('Topics'),
                this.util.makeParagraph(
                    'The following topics were automatically generated from all ' +
                    this.noInteractions + ' interactions associated to this company.'
                ),
                // this.util.makeHeading2('Topics Table'),
                // this.util.topicTable(this.topics),
                this.util.makeHeadingBookmark1('Interaction Summaries', 'interaction_summaries')
            ],
            ...interactionSection.makeDescriptionsDOCX(),
            await companySection.makeCompetitorsDOCX(this.competitors, isPackage),
            [   this.util.pageBreak(),
                this.util.makeHeading1('References')
            ],
            ...interactionSection.makeReferencesDOCX(isPackage)
            )
    
        // Construct the document
        const myDoc = new docx.Document ({
            creator: this.creator,
            company: this.author,
            title: this.title,
            description: this.description,
            background: {
                color: "0F0D0E",
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
                        default: this.util.makeHeader(this.company.name, 'Company comparison dashboard prepared for: ', true)
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makeFooter('Authored by: mediumroast.io', 'Prepared on: ' + preparedDate, true)]
                        })
                    },
                    children: [
                        await myDash.makeDashboard(
                            this.company, 
                            this.competitors, 
                            this.baseDir
                        )
                    ],
                },
                {
                    properties: {},
                    headers: {
                        default: this.util.makeHeader(this.company.name, 'Company comparison detail prepared for: ')
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.util.makeFooter('Authored by: mediumroast.io', 'Prepared on: ' + preparedDate)]
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