/**
 * Two classes to create sections and documents for interaction objects in mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactions.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import docx from 'docx'
import Utilities from './helpers.js'
import { CompanySection } from './companies.js'
import { InteractionDashboard } from './dashboard.js' 
import docxSettings from './settings.js'
import TextWidgets from './widgets/Text.js'
import TableWidgets from './widgets/Tables.js'

class BaseInteractionsReport {
    constructor(interactions, objectType, objectName, env) {

        // NOTE creation of a ZIP package is something we likely need some workspace for
        //      since the documents should be downloaded and then archived.  Therefore,
        //      the CLI is a likely place to do this for now.  Suspect for the web_ui
        //      we will need some server side logic to make this happen.

        this.interactions = interactions
        this.objectName = objectName
        this.objectType = objectType
        this.env = env
        this.util = new Utilities(env)
        this.textWidgets = new TextWidgets(env)
        this.tableWidgets = new TableWidgets(env)
        this.themeStyle = docxSettings[env.theme] // Set the theme for the report
        this.generalStyle = docxSettings.general // Pull in all of the general settings
        
        // Define specifics for table borders
        this.noneStyle = {
            style: this.generalStyle.noBorderStyle
        }
        this.borderStyle = {
            style: this.generalStyle.tableBorderStyle,
            size: this.generalStyle.tableBorderSize,
            color: this.themeStyle.tableBorderColor
        }
        this.bottomBorder = {
            left: this.noneStyle,
            right: this.noneStyle,
            top: this.noneStyle,
            bottom: this.borderStyle
        }
    }

    /**
     * @function protorequirementsTable
     * @todo Determine if the existing TableWidgets class can be used for this
     */
    protorequirementsTable(topics) {
        // If the length of the topics is zero, then return a simple message
        if (Object.keys(topics).length === 0) {
            return this.textWidgets.makeParagraph('No proto-requirements were discovered or are associated to this interaction.')
        }

        let myRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [this.textWidgets.makeParagraph('Id', {bold: true, fontSize: this.generalStyle.tableFontSize})],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        },
                        width: {
                            size: 5,
                            type: docx.WidthType.PERCENTAGE
                        },
                    }),
                    new docx.TableCell({
                        children: [this.textWidgets.makeParagraph('Frequency', {bold: true, fontSize: this.generalStyle.tableFontSize})],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        },
                        width: {
                            size: 15,
                            type: docx.WidthType.PERCENTAGE
                        }
                    }),
                    new docx.TableCell({
                        children: [this.textWidgets.makeParagraph('Proto-requirement', {bold: true, fontSize: this.generalStyle.tableFontSize})],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        },
                        width: {
                            size: 80,
                            type: docx.WidthType.PERCENTAGE
                        },
                    })
                ]
            })
        ]
        for (const topic in topics) {
            myRows.push(
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [this.textWidgets.makeParagraph(
                                String(topic), 
                                {fontSize: this.generalStyle.tableFontSize})
                            ],
                            borders: this.bottomBorder,
                            margins: {
                                top: this.generalStyle.tableMargin
                            },
                            width: {
                                size: 5,
                                type: docx.WidthType.PERCENTAGE
                            },
                        }),
                        new docx.TableCell({
                            children: [this.textWidgets.makeParagraph(
                                String(topics[topic].frequency), 
                                {fontSize: this.generalStyle.tableFontSize})
                            ],
                            borders: this.bottomBorder,
                            margins: {
                                top: this.generalStyle.tableMargin
                            },
                            width: {
                                size: 15,
                                type: docx.WidthType.PERCENTAGE
                            },
                        }),
                        new docx.TableCell({
                            children: [this.textWidgets.makeParagraph(
                                String(topics[topic].label), 
                                {fontSize: this.generalStyle.tableFontSize})
                            ],
                            borders: this.bottomBorder,
                            margins: {
                                top: this.generalStyle.tableMargin
                            },
                            width: {
                                size: 80,
                                type: docx.WidthType.PERCENTAGE
                            },
                        })
                    ]
                })
            )
        }
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [5, 20, 75],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return myTable
    }
}


class InteractionSection extends BaseInteractionsReport {
    /**
     * A high level class to create  sections for an Interaction report using either 
     * Microsoft DOCX format or eventually HTML format.  Right now the only available 
     * implementation is for the DOCX format.  These sections are designed to be consumed
     * by a wrapping document which could be for any one of the mediumroast objects.
     * @constructor
     * @classdesc Construct the InteractionSection object 
     * @param {Array} interactions - a complete array of interactions ranging from 1:N
     * @param {String} objectName - the name of the object calling this class
     * @param {String} objectType - the type of object calling this class
     */
    constructor(interactions, objectName, objectType, env) {
        super(interactions, objectType, objectName, env)
    }

    /**
     * @function makeDescriptionsDOCX 
     * @description Make the descriptions for interactions in the DOCX format
     * @returns {Array} An array containing a section description and a table of interaction descriptions
     */
    makeDescriptionsDOCX () {
        // Set the number of interactions for use later
        const noInteractions = this.interactions.length

        // Create the header row for the descriptions
        let myRows = [this.tableWidgets.twoColumnRowBasic(['Name', 'Description'], {allColumnsBold: true})]
        
        // Loop over the interactions and pull out the interaction names and descriptions
        for (const interaction in this.interactions) {
            // const interactionBaseLink = String(`interaction_${this.interactions[interaction].file_hash}`).substring(0, 20)
            myRows.push(this.tableWidgets.twoColumnRowBasic(
                    [
                        this.interactions[interaction].name,
                        this.interactions[interaction].description
                    ],
                    // NOTE: This is the original code that was replaced by the line above
                    //       because the hyperlink was not working in the DOCX format.  If we can
                    //       figure out how to make the hyperlink work in the DOCX format, we can
                    //       switch back to this code in the future.
                    // 
                    //       Note that this works in a development environment, but not in the
                    //       production environment, and unsure why.  The hyperlink is not
                    //       visible in the production environment.
                    // [
                    //     this.textWidgets.makeInternalHyperLink(
                    //         this.interactions[interaction].name, interactionBaseLink
                    //     ), 
                    //     this.interactions[interaction].description
                    // ],
                    {firstColumnBold: false}
                )
            )
        }

        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [30, 70],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        // Return the results as an array
        return [
            this.textWidgets.makeParagraph(
                `This section contains descriptions for the ${noInteractions} interactions associated to the ${this.objectName} ${this.objectType}.  Additional detail is in the References section of this document.`
            ),
            myTable
        ]
    }

    /**
     * @function makeReferencesDOCX
     * @description Create the references for calling programs in the DOCX format
     * @param  {Boolean} isPackage - When set to true links are set up for connecting to interaction documents
     * @returns {Array} An array containing a section description and a table of interaction references
     */
    makeReferencesDOCX(isPackage, bookmark={}) {
        const {
            bookmarkName = 'Back to Interaction Descriptions',
            bookmarkLink ='interaction_descriptions'
        } = bookmark

        const descriptionsLink = this.textWidgets.makeInternalHyperLink(bookmarkName, bookmarkLink)

        // Create the array for the references starting with the introduction
        let references = []
        // Set the variable for the total reading time
        let totalReadingTime = null
        // Loop over all interactions
        for (const interaction in this.interactions) {
            // Calculate the aggregate reading time
            totalReadingTime += parseInt(this.interactions[interaction].reading_time)
            
            // Depending upon if this is a package or not create the metadata strip with/without document link
            let metadataRow
            let metadataStrip
            if(isPackage) { 
                // isPackage version of the strip
                // Create the link to the underlying interaction document
                // TODO consider making this a hyperlink to the interaction document in GitHub
                // creation_date is of this format 2024-05-24T12:29:22.053Z, create a substring of the date only
                const myDate = this.interactions[interaction].creation_date.substring(0, 10)
                let myObj = this.interactions[interaction].url.split('/').pop()
                // Replace spaces with underscores
                myObj = myObj.replace(/ /g, '_')
                // NOTE: Need to follow how this was done in tables with the two column that includes a hyperlink
                let interactionLink = this.textWidgets.makeExternalHyperLink(
                    'Document', 
                    `./interactions/${myObj}`
                )
                metadataRow = this.tableWidgets.threeColumnRowBasic(
                    [
                        `Created on: ${myDate}`,
                        `Est. reading time: ${this.interactions[interaction].reading_time} min`,
                        new docx.Paragraph({children:[interactionLink]})
                    ],
                    {firstColumnBold: false}
                )
                metadataStrip = new docx.Table({
                    columnWidths: [25, 25, 25, 25],
                    rows: [metadataRow],
                    width: {
                        size: 100,
                        type: docx.WidthType.PERCENTAGE
                    }
                })
            } else {
                // Non isPackage version of the strip
                metadataRow = this.tableWidgets.threeColumnRowBasic(
                    [
                        `Created on: ${this.interactions[interaction].creation_date}`,
                        `Est. reading time: ${this.interactions[interaction].reading_time} min`,
                        descriptionsLink
                    ],
                    {firstColumnBold: false}
                )
                metadataStrip = new docx.Table({
                    columnWidths: [50, 25, 25],
                    rows: [metadataRow],
                    width: {
                        size: 100,
                        type: docx.WidthType.PERCENTAGE
                    }
                })
            }
            

            // Create the tags table for the interaction
            const tagsTable = this.tableWidgets.tagsTable(this.interactions[interaction].tags)

            // Generate the proto-requirements table
            const protoRequirementsTable = this.protorequirementsTable(this.interactions[interaction].topics)
            
            // Push all of the content into the references array
            references.push(
                // Create the bookmark for the interaction
                this.textWidgets.makeHeadingBookmark2(
                    this.interactions[interaction].name, 
                    String(
                        'interaction_' +
                        String(this.interactions[interaction].file_hash)
                    ).substring(0, 20)
                ),
                // Create the abstract for the interaction
                this.textWidgets.makeParagraph(this.interactions[interaction].abstract),
                metadataStrip,
                this.textWidgets.makeHeading2('Tags'),
                tagsTable,
                this.textWidgets.makeHeading2('Proto-Requirements'),
                protoRequirementsTable
            )
        }

        references.splice(0,0,
            // Section intro
            this.textWidgets.makeParagraph(
                'The Mediumroast for GitHub automatically generated this section. ' +
                `It includes key metadata from each interaction associated to the company ${this.objectName}. ` +
                'If this report is produced as a package, then hyperlinks are present and will link to documents ' +
                'on the local system. ' +
                `Note the total estimated reading time for all interactions is ${totalReadingTime} minutes.`
            )
        )

        // Return the built up references
        return references
    }
}

class InteractionStandalone extends BaseInteractionsReport {
    /**
     * A high level class to create a complete document for an Interaction report using either 
     * Microsoft DOCX format or eventually HTML format.  Right now the only available 
     * implementation is for the DOCX format. 
     * @constructor
     * @classdesc Create a full and standlaone report document for an interaction
     * @param {Object} interaction - The interaction in question to process
     * @param {Object} company - The company associated to the interaction
     * @param {String} creator - A string defining the creator for this document
     * @param {String} authorCompany - A string containing the company who authored the document
     */
    constructor(interaction, company, env, allObjects, author='Mediumroast for GitHub') {
        super(interaction, 'Interaction', interaction[0].name, env)
        this.creator = author
        this.author = author
        this.authorCompany = author
        this.authoredBy = author
        this.title = `${interaction[0].name} Interaction Report`
        this.interaction = interaction[0]
        this.company = company[0]
        this.allObjects = allObjects
        this.description = `An Interaction report summarizing ${this.interaction.name}.`
        this.introduction = 'This document was automatically generated by Mediumroast for GitHub.' +
            ' It includes an abstract, tags and proto-requirement for this Interaction.' + 
            '  If this report is produced as a package, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.abstract = this.interaction.abstract
        this.tags = this.interaction.tags
        this.topics = this.interaction.topics
    }

    metadataTableDOCX (isPackage) {
        // Switch the name row if depending upon if this is a package or not
        const objWithPath = this.interaction.url.split('://').pop()
        const myObj = objWithPath.split('/').pop()
        let nameRow = null
        isPackage ?
            nameRow = this.util.urlRow('Interaction Name', this.interaction.name, './interactions/' + myObj) :
            nameRow = this.util.basicRow('Interaction Name', this.interaction.name)
        
        const myTable = new docx.Table({
            columnWidths: [20, 80],
            rows: [
                nameRow,
                this.util.basicRow('Description', this.interaction.description),
                this.util.basicRow('Creation Date', this.interaction.creation_date),
                this.util.basicRow('Region', this.util.regions[this.interaction.region]),
                this.util.basicRow('Type', this.interaction.interaction_type),
            ],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
        return myTable
    }

    /**
     * @async
     * @function makeDOCX
     * @description Create the DOCX document for a single interaction which includes a company section
     * @param  {String} fileName - Full path to the file name, if no file name is supplied a default is assumed
     * @param  {Boolean} isPackage - When set to true links are set up for connecting to interaction documents
     * @returns {Array} The result of the writeReport function that is an Array
     */
    async makeDOCX(fileName, isPackage) {
        // Initialize the working directories
        this.util.initReportWorkspace()

        // If fileName isn't specified create a default
        fileName = fileName ? fileName : `${this.env.outputDir}/${this.interaction.name.replace(/ /g,"_")}.docx`

        // Capture the current date
        const date = new Date();
        const preparedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })

        // Define header/footer content
        const preparedOn = `Prepared on: ${preparedDate}`
        const authoredBy = `Authored by: ${this.authoredBy}`
        const preparedFor = `${this.objectType}: `

        // Construct the dashboard section
        const myDash = new InteractionDashboard(this.env)

        // Set up the default options for the document
        const myDocument = [].concat(
            this.textWidgets.makeIntro(this.introduction),
            [
                this.textWidgets.makeHeading1('Abstract'),
                this.textWidgets.makeParagraph(this.abstract),
                this.textWidgets.makeHeading1('Tags'),
                this.tableWidgets.tagsTable(this.tags),
                this.textWidgets.makeHeading1('Proto-Requirements'),
                super.protorequirementsTable(this.topics),
            ])
    
        // Construct the document
        const myDoc = new docx.Document ({
            creator: this.creator,
            company: this.author,
            title: this.title,
            description: this.description,
            background: {
                color: this.textWidgets.themeSettings.documentColor,
            },
            styles: {default: this.textWidgets.styles.default},
            numbering: this.textWidgets.styles.numbering,
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
                        default: this.textWidgets.makeHeader(this.interaction.name, preparedFor, {landscape: true})
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.textWidgets.makeFooter(authoredBy, preparedOn, {landscape: true})]
                        })
                    },
                    children: [
                        await myDash.makeDashboard(
                            this.interaction, 
                            this.company,
                            isPackage
                        )
                    ],
                },
                {
                    properties: {},
                    headers: {
                        default: this.textWidgets.makeHeader(this.interaction.name, preparedFor)
                    },
                    footers: {
                        default: new docx.Footer({
                            children: [this.textWidgets.makeFooter(authoredBy, preparedOn)]
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

export { InteractionSection, InteractionStandalone }