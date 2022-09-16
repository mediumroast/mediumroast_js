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
     * @param {String} font 
     * @param {Float} fontSize 
     * @param {Float} textFontSize 
     * @param {String} textFontColor
     * @todo when we get to HTML report generation for the front end we will rename this class and create a new one for HTML
     */
    constructor (font, fontSize, textFontSize, textFontColor) {
        this.font = font ? font : 'Avenir Next'
        this.size = fontSize ? fontSize : 11
        this.textFontSize = textFontSize ? textFontSize : 22
        this.textFontColor = textFontColor ? textFontColor : '#41a6ce'
        this.fontFactor = 1
        this.styling = this.initStyles()
        this.regions = {
            AMER: 'Americas',
            EMEA: 'Europe, Middle East and Africa',
            APAC: 'Asia Pacific and Japan'
        }
    }

    // Initialize the common styles for the docx
    initStyles () {
        const hangingSpace = 0.18
        return {
                default: {
                    heading1: {
                        run: {
                            size: this.textFontSize,
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
                            size: 0.75 * this.textFontSize,
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
                            size: 0.8 * this.textFontSize,
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
                            size: 1.5 * this.size,
                        },
                    },
                    paragraph: {
                        font: this.font,
                        size: this.size,
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
                            size: this.size,
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
     * @function makeParagraph
     * @description For a section of prose create a paragraph
     * @param {String} paragraph - text/prose for the paragraph
     * @param {Integer} size - font size for the paragrah
     * @param {Boolean} bold - a boolean value for determining if the text should be bolded
     * @param {Integer} spaceAfter - an integer 1 or 0 to determine if there should be space after this element
     * @returns {Object} a docx paragraph object 
     */
    makeParagraph (paragraph, size, bold, spaceAfter) {
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: this.font,
                    size: size ? size : 20,
                    bold: bold ? bold : false, 
                    break: spaceAfter ? spaceAfter : 0
                })
            ]
        })
    }

    // 
    /**
     * @function makeTextrun
     * @description Create a text run with or without space after
     * @param {String} text - text/prose for the textrun
     * @param {Integer} spaceAfter - an integer 1 or 0 to determine if there should be space after this element
     * @returns {Object} a docx textrun object
     */
    makeTextrun(text, spaceAfter=false) {
        const myFontSize = 16
        if (spaceAfter) {
            return new docx.TextRun({
                text: text,
                font: this.font,
                size: myFontSize,
                break: 1
            })
        } else {
            return new docx.TextRun({
                text: text,
                font: this.font,
                size: myFontSize
            })
        }
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
                    children: [this.makeParagraph(name, this.fontFactor * this.fontSize, true)]
                }),
                new docx.TableCell({
                    width: {
                        size: 80,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(data, this.fontFactor * this.fontSize)]
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
                    children: [this.makeParagraph(id, 16, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 90,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [this.makeParagraph(description, 16, bold ? true : false)]
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
    basicComparisonRow (company, role, score, rank, bold) {
        const myFontSize = 16
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 25,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(company, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 25,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(role, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 25,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(score, myFontSize, bold ? true : false)]
                }),
                new docx.TableCell({
                    width: {
                        size: 25,
                        type: docx.WidthType.PERCENTAGE,
                        font: this.font,
                    },
                    children: [this.makeParagraph(rank, myFontSize, bold ? true : false)]
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
     */
    topicTable(topics) {
        let myRows = [this.basicTopicRow('Keywords', 'Score', 'Rank', true)]
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