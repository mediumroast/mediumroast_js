// Import required modules
import docx from 'docx'
import Utilities from './common.js'


class Section {
    constructor(interactions, objectName, objectType, protocol, characterLimit = 1000) {

        // NOTE creation of a ZIP package is something we likely need some workspace for
        //      since the documents should be downloaded and then archived.  Therefore,
        //      the CLI is a likely place to do this for now.  Suspect for the web_ui
        //      we will need some server side logic to make this happen.

        this.interactions = interactions
        this.characterLimit = characterLimit
        this.introduction = 'The mediumroast.io system has automatically generated this section.' +
            ' It includes key metadata from each interaction associated to the object ' + objectName +
            '.  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.objectName = objectName
        this.objectType = objectType
        this.font = 'Avenir Next' // We need to pass this in from the config file
        this.fontSize = 10 // We need to pass this in from the config file
        this.protocol = protocol
        this.protoDoc = this.createRefs()
        this.util = new Utilities()
    }

    // Create the entire section as a proto document to be fed to a format like docx, ..., html.
    createRefs() {
        let protoDoc = {
            intro: this.introduction,
            references: {}
        }
        for (const item in this.interactions) {
            protoDoc.references[this.interactions[item].interactionName] = this.createRef(this.interactions[item])
        }
        return protoDoc
    }

    // Create an individual reference from an interaction
    createRef(interaction, dateKey = 'date', timeKey = 'time', httpType = 'http') {
        // NOTE need to think about the URL and how to properly unpack it
        //      example, swap to from X to http and then preserve it as a 
        //      part of the protoDoc

        // Decode the date
        const myDate = interaction[dateKey]
        const [year, month, day] = [myDate.substring(0, 4), myDate.substring(4, 6), myDate.substring(6, 8)]

        // Decode the time
        const myTime = interaction[timeKey]
        const [hour, min] = [myTime.substr(0, 2), myTime.substr(2, 4)]

        // Detect the repository type and replace it with http
        // NOTE This is setup to create a local package with source links in a local working directory
        const repoType = interaction.url.split('://')[0]
        let myURL = interaction.url.split('://').pop()
        myURL = this.protocol + myURL.split('/').pop()

        // Create the reference
        let reference = {
            type: interaction.interactionType, // TODO There is a bug here in the ingestion
            abstract: interaction.abstract.substr(0, this.characterLimit) + '...',
            date: year + '-' + month + '-' + day,
            time: hour + ':' + min,
            url: myURL,
            repo: repoType,
            guid: interaction.GUID
        }
        // Set the object type and name
        reference[this.objectType] = this.objectName

        return reference
    }

    // Create a paragraph
    makeParagraph(paragraph, size, bold) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: this.font,
                    size: size ? size : 20,
                    bold: bold ? bold : false,
                })
            ]
        })
    }

    // Create a title of heading style 2
    makeTitle(title, ident) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_2
        })
    }

    // Create a text run
    makeTextrun(text) {
        return new docx.TextRun({
            text: text,
            font: this.font,
            size: 1.5 * this.fontSize,
        })
    }

    makeURL(name, link) {
        return new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: name,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 1.5 * this.fontSize
                })
            ],
            link: link
        })
    }

    // Return the proto document as a docx formatted section
    makeDocx() {
        const excerptAnchor = this.util.makeInternalHyperLink('Summary Excerpts', 'summary_excerpts')
        let finaldoc = [this.makeParagraph(this.protoDoc.intro)]

        for (const myReference in this.protoDoc.references) {
            // String(this.protoDoc.references[myReference].guid)
            finaldoc.push(this.util.makeBookmark2(myReference, String(this.protoDoc.references[myReference].guid).substring(0, 40)))
            finaldoc.push(this.makeParagraph(
                this.protoDoc.references[myReference].abstract,
                1.5 * this.fontSize))
            const permaLink = this.makeURL(
                'Document link',
                this.protoDoc.references[myReference].url)

            finaldoc.push(
                new docx.Paragraph({
                    children: [
                        this.makeTextrun('[ '),
                        permaLink,
                        this.makeTextrun(' | Date: ' + this.protoDoc.references[myReference].date + ' | '),
                        this.makeTextrun('Time: ' + this.protoDoc.references[myReference].time + ' | '),
                        this.makeTextrun('Type: ' + this.protoDoc.references[myReference].type + ' | '),
                        excerptAnchor,
                        this.makeTextrun(' ]'),
                    ]
                })
            )
        }
        return finaldoc
    }

    // Return the proto document as a html formatted section
    makeHtml() {
        return false
    }
}

class Standalone {
    constructor(interaction, creator, authorCompany) {
        this.creator = creator
        this.authorCompany = authorCompany
        this.title = interaction.name + ' Interaction Report'
        this.interaction = interaction
        this.description = 'An Interaction report summarizing ' + interaction.name + ' and including relevant company data.'
        this.introduction = 'The mediumroast.io system automatically generated this document.' +
            ' It includes key metadata for this Interaction object and relevant metadata from the associated company.' + 
            '  If this report document is produced as a package, instead of standalone, then the' +
            ' hyperlinks are active and will link to documents on the local folder after the' +
            ' package is opened.'
        this.abstract = interaction.abstract
        this.util = new Utilities()
        this.regions = {
            AMER: 'Americas',
            EMEA: 'Europe, Middle East and Africa',
            APAC: 'Asia Pacific, Japan and China'
        }
    }


    makeIntro () {
        const myIntro = [
            this.util.makeHeading1('Introduction'),
            this.util.makeParagraph(this.introduction)
        ]
        // console.log(myIntro)
        return myIntro
    }

    metadataTable () {
        // Name (when package links to physical file)
        // Description
        // Creation Date
        // Location (Use Lat Long pair hyper link)
        // Associated Company (Hyper link)
        const myTable = new docx.Table({
            columnWidths: [20, 80],
            rows: [
                this.util.basicRow('Interaction Name', this.interaction.name),
                this.util.basicRow('Description', this.interaction.description),
                this.util.basicRow('Creation Date', this.interaction.creation_date),
                this.util.basicRow('Region', this.regions[this.interaction.region]),
                this.util.basicRow('Type', this.interaction.interaction_type),
                this.util.basicRow('Abstract', this.interaction.abstract),
            ],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
        // console.log(myTable)
        return myTable
    }

    abstract () {
        // Abstract (might need outside of the table)
        null
    }

    makeDocx() {
        // Set up the default options for the document
        const myDocument = [].concat(this.makeIntro(),[this.util.makeHeading1('Interaction Detail'), this.metadataTable()])
        // console.log(myDocument)

        return new docx.Document ({
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

    }
}

export { Section, Standalone }