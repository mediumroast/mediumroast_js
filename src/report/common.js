/**
 * A set of common utilities for creating HTML and DOCX reports for mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import modules
import docx from 'docx'
import * as fs from 'fs'
import boxPlot from 'box-plot'
import docxSettings from './settings.js'
import FilesystemOperators from '../cli/filesystem.js'


// TODO Change class names to: GenericUtilities, DOCXUtilities and HTMLUtilities
// TODO rankTags belongs to GenericUtilities

class DOCXUtilities {
    /**
     * To make machine authoring of a Microsoft DOCX file consistent and easier this class has been 
     * developed.  Key functions are available that better describe the intent of the operation
     * by name which makes it simpler author a document instead of sweating the details.
     * Further through trial and error the idiosyncrasies of the imported docx module
     * have been worked out so that the developer doesn't have to accidently find out and struggle
     * with document generation. 
     * @constructor
     * @classdesc Core utilities for generating elements in a Microsoft word DOCX file
     * @param {Object} env 
     * @todo when we get to HTML report generation for the front end we will rename this class and create a new one for HTML
     */
    constructor (env) {
        this.env = env
        this.generalSettings = docxSettings.general
        this.themeSettings = docxSettings[this.env.theme]
        this.font = docxSettings.general.font
        this.heavyFont = docxSettings.general.heavyFont
        this.halfFontSize = docxSettings.general.halfFontSize
        this.fullFontSize = docxSettings.general.fullFontSize
        this.fontFactor = docxSettings.general.fontFactor
        this.theme = this.env.theme
        this.documentColor = docxSettings[this.theme].documentColor
        this.textFontColor = `#${docxSettings[this.theme].textFontColor.toLowerCase()}`
        this.titleFontColor = `#${docxSettings[this.theme].titleFontColor.toLowerCase()}`
        this.tableBorderColor = `#${docxSettings[this.theme].tableBorderColor.toLowerCase()}`
        this.styling = this.initStyles()
        this.fileSystem = new FilesystemOperators()
        this.regions = {
            AMER: 'Americas',
            EMEA: 'Europe, Middle East and Africa',
            APAC: 'Asia Pacific and Japan'
        }
    }

    // Initials the working directories
    initDirectories() {
        const subdirs = ['interactions', 'images']
        for(const myDir in subdirs) {
            this.fileSystem.safeMakedir(this.env.workDir + '/' + subdirs[myDir])
        }
    }

    // Initialize the common styles for the docx
    initStyles () {
        const hangingSpace = 0.18
        return {
                default: {
                    heading1: {
                        run: {
                            size: this.fullFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 160,
                                after: 80,
                            },
                        },
                    },
                    heading2: {
                        run: {
                            size: 0.75 * this.fullFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                    heading3: {
                        run: {
                            size: 0.8 * this.fullFontSize,
                            bold: true,
                            font: this.font,
                            color: this.textFontColor
                        },
                        paragraph: {
                            spacing: {
                                before: 240,
                                after: 120,
                            },
                        },
                    },
                    listParagraph: {
                        run: {
                            font: this.font,
                            size: 1.5 * this.halfFontSize,
                        },
                    },
                    paragraph: {
                        font: this.font,
                        size: this.halfFontSize,
                    }
                },
                paragraphStyles: [
                    {
                        id: "mrNormal",
                        name: "MediumRoast Normal",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: this.font,
                            size: this.halfFontSize,
                        },
                    },
                ],
                numbering: {
                    config: [
                        {
                            reference: 'number-styles',
                            levels: [
                                {
                                    level: 0,
                                    format: docx.LevelFormat.DECIMAL,
                                    text: "%1.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { 
                                                left: docx.convertInchesToTwip(0.25), 
                                                hanging: docx.convertInchesToTwip(hangingSpace) 
                                            },
                                            spacing: {
                                                before: 75
                                            }
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: docx.LevelFormat.LOWER_LETTER,
                                    text: "%2.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.50), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: docx.LevelFormat.LOWER_ROMAN,
                                    text: "%3.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.75), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: docx.LevelFormat.UPPER_LETTER,
                                    text: "%4.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1.0), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                                {
                                    level: 4,
                                    format: docx.LevelFormat.UPPER_ROMAN,
                                    text: "%5.",
                                    alignment: docx.AlignmentType.START,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1.25), hanging: docx.convertInchesToTwip(hangingSpace) },
                                        },
                                    },
                                },
                            ]
                        },
                        {
                            reference: "bullet-styles",
                            levels: [
                                {
                                    level: 0,
                                    format: docx.LevelFormat.BULLET,
                                    text: "-",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(0.5), hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 1,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u00A5",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: docx.convertInchesToTwip(1), hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 2,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u273F",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2160, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 3,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u267A",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 2880, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                                {
                                    level: 4,
                                    format: docx.LevelFormat.BULLET,
                                    text: "\u2603",
                                    alignment: docx.AlignmentType.LEFT,
                                    style: {
                                        paragraph: {
                                            indent: { left: 3600, hanging: docx.convertInchesToTwip(0.25) },
                                        },
                                    },
                                },
                            ]
                        }
                    ]}
            }
    }

    /**
     * @function makeBullet
     * @description Create a bullet for a bit of prose
     * @param {String} text - text/prose for the bullet
     * @param {Integer} level - the level of nesting for the bullet
     * @returns {Object} new docx paragraph object as a bullet
     */
    makeBullet(text, level=0) {
        return new docx.Paragraph({
            text: text,
            numbering: {
                reference: 'bullet-styles',
                level: level
            }
        })
    }

    /**
     * @function makeHeader
     * @description Generate a header with an item's name and the document type fields
     * @param {String} itemName 
     * @param {String} documentType 
     * @param {Boolean} landscape 
     */
    makeHeader(itemName, documentType, options={}) {
        const {
            landscape = false
        } = options
        let separator = "\t".repeat(3)
        if (landscape) { separator = "\t".repeat(4)}
        return new docx.Header({
            children: [
                new docx.Paragraph({
                    alignment: docx.AlignmentType.CENTER,
                    children: [
                        new docx.TextRun({
                            children: [documentType],
                            font: this.font,
                            size: this.generalSettings.headerFontSize
                        }),
                        new docx.TextRun({
                            children: [itemName],
                            font: this.font,
                            size: this.generalSettings.headerFontSize
                        })
                    ],
                }),
            ],
        })
    }

    makeFooter(documentAuthor, datePrepared, landscape=false) {
        let separator = "\t"
        if (landscape) { separator = "\t".repeat(2)}
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.TextRun({
                    children: ['Page ', docx.PageNumber.CURRENT, ' of ', docx.PageNumber.TOTAL_PAGES, separator],
                    font: this.font,
                    size: 18
                }),
                new docx.TextRun({
                    children: ['|', separator, documentAuthor, separator],
                    font: this.font,
                    size: 18
                }),
                new docx.TextRun({
                    children: ['|', separator, datePrepared],
                    font: this.font,
                    size: 18
                })
            ]
        })
    }

    /**
     * @function makeParagraph
     * @description For a section of prose create a paragraph
     * @param {String} paragraph - text/prose for the paragraph
     * @param {Integer} size - font size for the paragrah
     * @param {Boolean} bold - a boolean value for determining if the text should be bolded
     * @param {Integer} spaceAfter - an integer 1 or 0 to determine if there should be space after this element
     * @returns {Object} a docx paragraph object 
     */
    // makeParagraph (paragraph, size, bold, spaceAfter) {
    //     return new docx.Paragraph({
    //         children: [
    //             new docx.TextRun({
    //                 text: paragraph,
    //                 font: this.font,
    //                 size: size ? size : 20,
    //                 bold: bold ? bold : false, 
    //                 break: spaceAfter ? spaceAfter : 0
    //             })
    //         ]
    //     })
    // }

    /**
     * 
     * @param {*} paragraph 
     * @param {*} size 
     * @param {*} color 
     * @param {*} spaceAfter 
     * @param {*} bold 
     * @param {*} center 
     * @param {*} font
     * @returns 
     * @todo Replace the report/common.js makeParagraph method with this one during refactoring
     * @todo Add an options object in a future release when refactoring
     * @todo Review the NOTICE section and at a later date work on all TODOs there
     */
    makeParagraph (paragraph,options={}) {
        const {
            fontSize,
            bold=false, 
            fontColor,
            font='Avenir Next',
            center=false, 
            italics=false, 
            underline=false,
            spaceAfter=0,
        } = options
        // const fontSize = 2 * this.fullFontSize // Font size is measured in half points, multiply by to is needed
        return new docx.Paragraph({
            alignment: center ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: font ? font : this.font,
                    size: fontSize ? fontSize : this.fullFontSize, // Default font size size 10pt or 2 * 10 = 20
                    bold: bold ? bold : false, // Bold is off by default
                    italics: italics ? italics : false, // Italics off by default
                    underline: underline ? underline : false, // Underline off by default
                    break: spaceAfter ? spaceAfter : 0, // Defaults to no trailing space
                    color: fontColor ? fontColor : this.textFontColor
                })
            ]
        })
    }



    /**
     * @function pageBreak
     * @description Create a page break
     * @returns {Object} a docx paragraph object with a PageBreak
     */
    pageBreak() {
        return new docx.Paragraph({
            children: [
                new docx.PageBreak()
            ]
        })
    }

    /**
     * @function makeHeading1
     * @description Create a text of heading style 1
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading1(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_1
        })
    }

    /**
     * @function makeHeading2
     * @description Create a text of heading style 2
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading2(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_2
        })
    }


    /**
     * @function makeHeading3
     * @description Create a text of heading style 3
     * @param {String} text - text/prose for the function
     * @returns {Object} a new paragraph as a heading
     */
    makeHeading3(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_3
        })
    }

    /**
     * @function makeExternalHyperLink
     * @description Create an external hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} link - the URL for the hyperlink
     * @returns {Object} a new docx ExternalHyperlink object
     */
    makeExternalHyperLink(text, link) {
        return new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 16
                })
            ],
            link: link
        })
    }

    /**
     * @function makeInternalHyperLink
     * @description Create an external hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} link - the URL for the hyperlink within the document
     * @returns {Object} a new docx InternalHyperlink object
     */
    makeInternalHyperLink(text, link) {
        return new docx.InternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 16,
                }),
            ],
            anchor: link,
        })
    }

    /**
     * @function makeBookmark
     * @description Create a target within a document to link to with an internal hyperlink
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark
     * @todo test and revise this function as it may need to be a textrun which can be embedded in something else
     */
    makeBookmark(text, ident) {
        return new docx.Paragraph({
            children: [
                new docx.Bookmark({
                    id: String(ident),
                    children: [
                        new docx.TextRun({text: text})
                    ]
                })
            ]
        })
    }

    /**
     * @function makeHeadingBookmark1
     * @description Create a target within a document to link to with an internal hyperlink of heading 1
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark at the heading level 1
     * @todo could we generalize this function and make the heading level a parameter in the future?
     */
    makeHeadingBookmark1(text, ident) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_1,
            children: [
                new docx.Bookmark({
                    id: String(ident),
                    children: [
                        new docx.TextRun({text: text})
                    ]
                })
            ]
        })
    }

    /**
     * @function makeHeadingBookmark2
     * @description Create a target within a document to link to with an internal hyperlink of heading 2
     * @param {String} text - text/prose for the function
     * @param {String} ident - the unique name of the bookmark
     * @returns {Object} a new docx paragraph object with a bookmark at the heading level 2
     */
    makeHeadingBookmark2(text, ident) {
        return new docx.Paragraph({
            heading: docx.HeadingLevel.HEADING_2,
            children: [
                new docx.Bookmark({
                    id: String(ident),
                    children: [
                        new docx.TextRun({text: text})
                    ]
                })
            ]
        })
    }

    

    /**
     * @function basicRow
     * @description Basic table row to produce a name/value pair table with 2 columns
     * @param {String} name - text/prose for the cell
     * @param {String} data - text/prose for the cell
     * @returns {Object} a new docx TableRow object
     */
    basicRow (name, data) {
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(name, {fontSize: this.fontFactor * this.fontSize, bold: true})]
                }),
                new docx.TableCell({
                    width: {
                        size: 80,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(data, {fontSize: this.fontFactor * this.fontSize})]
                })
            ]
        })
    }

    /**
     * @function descriptionRow
     * @description Description table row to produce a name/value pair table with 2 columns
     * @param {String} id - text/prose for the cell
     * @param {String} description - text/prose for the cell
     * @returns {Object} a new docx TableRow object
     */
    descriptionRow(id, description, bold=false) {
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 10,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(id, {fontSize: 16, bold: bold ? true : false})]
                }),
                new docx.TableCell({
                    width: {
                        size: 90,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(description, {fontSize: 16, bold: bold ? true : false})]
                })
            ]
        })
    }

    /**
     * @function urlRow
     * @description Hyperlink table row to produce a name/value pair table with 2 columns and an external hyperlink
     * @param {String} category - text/prose for the first column
     * @param {String} name - text/prose for the hyperlink in the second column
     * @param {String} link - the URL for the hyperlink
     * @returns {Object} a new docx TableRow object with an external hyperlink
     */
    urlRow(category, name, link) {
        // define the link to the target URL
        const myUrl = new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: name,
                    style: 'Hyperlink',
                    font: this.font,
                    size: this.fontSize
                })
            ],
            link: link
        })

        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(category, this.fontFactor * this.fontSize, true)]
                }),
                new docx.TableCell({
                    width: {
                        size: 80,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [new docx.Paragraph({children:[myUrl]})]
                })
            ]
        })
    }

    /**
     * @function basicTopicRow
     * @description Create a 3 column row for displaying topics which are the results of term extraction
     * @param {String} theme - text/prose for the theme in col 1
     * @param {Float} score - the numerical score for the term in col 2
     * @param {String} rank - a textual description of the relative priority for the term in col 3
     * @param {Boolean} bold - whether or not to make the text/prose bold typically used for header row
     * @returns {Object} a new 3 column docx TableRow object
     */
    basicTopicRow (theme, score, rank, bold) {
        const myFontSize = 16
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 60,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(theme, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(score, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(rank, myFontSize, bold ? true : false)]
                }),
            ]
        })
    }

    /**
     * @function basicComparisonRow
     * @description Create a 4 column row for displaying comparisons which are the results of similarity comparisons
     * @param {String} company - text/prose for the company in col 1
     * @param {String} role - the role of the company in col 2
     * @param {Float} score - the numerical score for the term in col 3
     * @param {String} rank - a textual description of the relative priority for the company in col 4
     * @param {Boolean} bold - whether or not to make the text/prose bold typically used for header row
     * @returns {Object} a new 4 column docx TableRow object
     */
    basicComparisonRow (company, role, distance, bold) {
        const myFontSize = 16
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 40,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(company, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 30,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(role, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 30,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(distance, myFontSize, bold ? true : false)]
                }),
            ]
        })
    }

    

    /**
     * @async
     * @function writeReport
     * @description safely write a DOCX report to a desired location
     * @param {Object} docObj - a complete and error free document object that is ready to be saved
     * @param {String} fileName - the file name for the DOCX object
     * @returns {Array} an array containing if the save operation succeeded, the message, and null
     */
    async writeReport (docObj, fileName) {
        try {
            await docx.Packer.toBuffer(docObj).then((buffer) => {
                fs.writeFileSync(fileName, buffer)
            })
            return [true, 'SUCCESS: Created file [' + fileName + '] for object.', null]
        } catch(err) {
            return [false, 'ERROR: Failed to create report for object.', null]
        }
     }

     /**
      * @function rankTags
      * @description Rank supplied topics and return an object that can be rendered
      * @param {Object} tags - the tags from the source object to be ranked
      * @returns {Object} the final tags which now have ranking and are suitable for a basicTopicRow
      */
     rankTags (tags) {
        const ranges = boxPlot(Object.values(tags))
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

    /**
     * @function topicTable
     * @description A higher level function that calls basicTopicRow to create a complete table
     * @param {Object} topics - the result of rankTags
     * @returns {Object} a complete docx table that includes topics
     * @todo Sort based upon rank from highest to lowest
     */
     topicTable(topics) {
        let myRows = [this.basicTopicRow('Keywords', 'Term Frequency', 'Rank', true)]
        // TODO When the score and rank are switched the program will fail and will not create a report.
        //      This appears to potentially be bug in docx, but as for now we will have to not change
        //      the code to swap the two columns. Utilmately, the goal would be to swap the columns to
        //      meet customer needs.
        // TODO sort the columns based upon rank
        for (const topic in topics) {
            myRows.push(this.basicTopicRow(topic, topics[topic].score.toFixed(2), topics[topic].rank))
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

        return myTable
    }

    _tagCell(tag) {
        return new docx.TableCell({
            margins: {
                top: this.generalSettings.tagMargin,
                right: this.generalSettings.tagMargin,
                bottom: this.generalSettings.tagMargin,
                left: this.generalSettings.tagMargin
            },
            borders: {
                top: { size: 20, color: this.themeSettings.documentColor, style: docx.BorderStyle.SINGLE }, // 2 points thick, black color
                bottom: { size: 20, color: this.themeSettings.documentColor, style: docx.BorderStyle.SINGLE },
                left: { size: 20, color: this.themeSettings.documentColor, style: docx.BorderStyle.SINGLE },
                right: { size: 20, color: this.themeSettings.documentColor, style: docx.BorderStyle.SINGLE },
            },
            shading: {fill: this.themeSettings.tagColor},
            children: [this.makeParagraph(tag, {fontSize: this.fontSize, fontColor: this.themeSettings.tagFontColor, center: true})],
            verticalAlign: docx.AlignmentType.CENTER,
        })
    }

    _distributeTags(tagsList) {
        // Calculate the number of lists as the ceiling of the square root of the length of tagsList
        const numLists = Math.ceil(Math.sqrt(tagsList.length))
        
        // Initialize result array with numLists empty arrays
        const result = Array.from({ length: numLists }, () => [])
        // Initialize lengths array with numLists zeros
        const lengths = Array(numLists).fill(0)
    
        // Sort tagsList in descending order based on the length of the tags
        tagsList.sort((a, b) => b.length - a.length)
    
        // Distribute tags
        tagsList.forEach(tag => {
            // Find the index of the child list with the minimum total character length
            const minIndex = lengths.indexOf(Math.min(...lengths))
            // Add the tag to this child list
            result[minIndex].push(tag);
            // Update the total character length of this child list
            lengths[minIndex] += tag.length
        })
    
        return result;
    }

    tagsTable(tags) {
        // Get the length of the tags
        const tagsList = Object.keys(tags)
        const distributedTags = this._distributeTags(tagsList)
        let myRows = []
        distributedTags.forEach(tags => {
            let cells = []
            tags.forEach(tag => {
                cells.push(this._tagCell(tag))
            })
            myRows.push(new docx.TableRow({
                children: cells
            }))
        })
        // define the table with the summary theme information
        const myTable = new docx.Table({
            columnWidths: Array(distributedTags.length).fill(100/distributedTags.length),
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return myTable
    }



    // Create an introductory section
    /**
     * @function makeIntro
     * @description Creates a complete document with a heading of level 1
     * @param {String} introText - text/prose for the introduction
     * @returns {Object} a complete introduction with heading level 1 and a paragraph
     */
    makeIntro (introText) {
        return [
            this.makeHeading1('Introduction'),
            this.makeParagraph(introText)
        ]
    }
}

export default DOCXUtilities