/**
 * Two classes to create sections and documents for interaction objects in mediumroast.io
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file interactions.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import docx from 'docx'
import boxPlot from 'box-plot'
import Utilities from './common.js'
import { CompanySection } from './companies.js'


class InteractionSection {
    constructor(interactions, objectName, objectType, characterLimit = 1000) {

        // NOTE creation of a ZIP package is something we likely need some workspace for
        //      since the documents should be downloaded and then archived.  Therefore,
        //      the CLI is a likely place to do this for now.  Suspect for the web_ui
        //      we will need some server side logic to make this happen.

        this.interactions = interactions
        this.characterLimit = characterLimit
        this.objectName = objectName
        this.objectType = objectType
        this.fontSize = 10 // We need to pass this in from the config file
        this.util = new Utilities()
    }

    // Generate the descriptions for interactions
    makeDescriptions () {
        // TODO create bookmark with the right kind of heading
        const noInteractions = this.interactions.length
        let myRows = [this.util.descriptionRow('Id', 'Description', true)]
        
        // TODO ids should be hyperlinks to the actual interaction which is interaction_<id>
        for (const interaction in this.interactions) {
            myRows.push(this.util.descriptionRow(
                this.util.makeInternalHyperLink(
                    this.interactions[interaction].id, 'interaction_' + String(this.interactions[interaction].id)
                ), 
                this.interactions[interaction].description
                )
            )
        }

        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: [10, 90],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return [
            this.util.makeParagraph(
                'This section contains descriptions for the ' + noInteractions + ' interactions associated to the ' +
                this.objectName + ' ' + this.objectType + ' object.  Additional detail is in ' +
                'the References section of this document.'
            ),
            myTable
        ]
    }

    // Create the references for calling programs
    makeReferences(isPackage, independent=false) {
        // Link this back to the descriptions section
        const descriptionsLink = this.util.makeInternalHyperLink(
            'Back to Interaction Summaries', 
            'interaction_summaries'
        )

        // Create the array for the references with the introduction
        let references = [
            this.util.makeParagraph(
                'The mediumroast.io system has automatically generated this section.' +
                ' It includes key metadata from each interaction associated to the object ' + this.objectName +
                '.  If this report document is produced as a package, instead of standalone, then the' +
                ' hyperlinks are active and will link to documents on the local folder after the' +
                ' package is opened.'
            )
        ]

        for (const interaction in this.interactions) {
            // Create the link to the underlying interaction document
            const objWithPath = this.interactions[interaction].url.split('://').pop()
            const myObj = objWithPath.split('/').pop()
            let interactionLink = this.util.makeExternalHyperLink(
                'Interaction Document', 
                './interactions/' + myObj
            )
            
            // Depending upon if this is a package or not create the metadata strip with/without document link
            let metadataStrip = null
            if(isPackage) { 
                // Package version of the strip
                metadataStrip = new docx.Paragraph({
                    spacing: {
                        before: 100,
                    },
                    children: [
                        this.util.makeTextrun('[ '),
                        interactionLink,
                        this.util.makeTextrun(
                            ' | Creation Date: ' + 
                            this.interactions[interaction].creation_date + 
                            ' | '
                        ),
                        descriptionsLink,
                        this.util.makeTextrun(' ]'),
                    ]
                })
            } else {
                // Non package version of the strip
                metadataStrip = new docx.Paragraph({
                    spacing: {
                        before: 100,
                    },
                    children: [
                        this.util.makeTextrun('[ '),
                        this.util.makeTextrun(
                            'Creation Date: ' + 
                            this.interactions[interaction].creation_date + 
                            ' | '
                        ),
                        descriptionsLink,
                        this.util.makeTextrun(' ]'),
                    ]
                })
            }

            // Generate the topic table
            const topics = this.util.rankTags(this.interactions[interaction].topics)
            const topicTable = this.util.topicTable(topics)
            
            // Push all of the content into the references array
            references.push(
                // Create the bookmark for the interaction
                this.util.makeHeadingBookmark2(
                    this.interactions[interaction].name, 
                    String(
                        'interaction_' +
                        String(this.interactions[interaction].id)
                    ).substring(0, 40)
                ),
                // Create the abstract for the interaction
                this.util.makeParagraph(
                    this.interactions[interaction].abstract,
                    this.fontSize * 1.5
                ),
                this.util.makeHeading2('Topics'),
                topicTable,
                metadataStrip
            )
        }

        // Return the built up references
        return references
    }


}

class InteractionStandalone {
    constructor(interaction, company, creator, authorCompany) {
        this.creator = creator
        this.authorCompany = authorCompany
        this.title = interaction.name + ' Interaction Report'
        this.interaction = interaction
        this.company = company
        this.description = 'An Interaction report summarizing ' + interaction.name + ' and including relevant company data.'
        this.introduction = 'The mediumroast.io system automatically generated this document.' +
            ' It includes key metadata for this Interaction object and relevant metadata from the associated company.' + 
            '  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.abstract = interaction.abstract
        this.util = new Utilities()
        // TODO test rankTags in common.js
        this.topics = this.rankTags(this.interaction.topics)
        // this.topics = this.util.rankTags(this.interaction.topics)
    }

    // TODO remove this and rely on the one in utils
    rankTags (tags) {
        const ranges = boxPlot(Object.values(this.interaction.topics))
        let finalTags = {}
        for (const tag in tags) {
            // Rank the tag score using the ranges derived from box plots
            // if > Q3 then the ranking is high
            // if in between Q2 and Q3 then the ranking is medium
            // if < Q3 then the ranking is low
            let rank = null
            if (tags[tag] > ranges.upperQuartile) {
                rank = 'High'
            } else if (tags[tag] < ranges.lowerQuartile) {
                rank = 'Low'
            } else if (ranges.lowerQuartile <= tags[tag] <= ranges.upperQuartile) {
                rank = 'Medium'
            }
    
            finalTags[tag] = {
                score: tags[tag], // Math.round(tags[tag]),
                rank: rank
            }
            
        }
        return finalTags
    }

    // TODO consider moving this to common
    makeIntro () {
        const myIntro = [
            this.util.makeHeading1('Introduction'),
            this.util.makeParagraph(this.introduction)
        ]
        return myIntro
    }

    metadataTable (isPackage) {
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

    // Create the document
    async makeDocx(fileName, isPackage) {
        // If fileName isn't specified create a default
        fileName = fileName ? fileName : process.env.HOME + '/Documents/' + this.interaction.name.replace(/ /g,"_") + '.docx'

        // Construct the company section
        const companySection = new CompanySection(this.company)

        // Set up the default options for the document
        const myDocument = [].concat(
            this.makeIntro(),
            [
                this.util.makeHeading1('Interaction Detail'), 
                this.metadataTable(isPackage),
                this.util.makeHeading1('Topics'),
                this.util.topicTable(this.topics),
                this.util.makeHeading1('Abstract'),
                this.util.makeParagraph(this.abstract),
                this.util.makeHeading1('Company Detail'),
                companySection.makeFirmographics()
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

export { InteractionSection, InteractionStandalone }