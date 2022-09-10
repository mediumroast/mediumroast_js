// Import modules
import docx from 'docx'
import * as fs from 'fs'
import boxPlot from 'box-plot'


// TODO Change class names to: GenericHelpers, DOCXHelpers and HTMLHelpers
//  rankTags belongs to GenericHelpers

class Utilities {
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

    // Initialize the common styles for the doc
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

    // Create a bullet for a bit of prose
    makeBullet(text, level=0) {
        return new docx.Paragraph({
            text: text,
            numbering: {
                reference: 'bullet-styles',
                level: level
            }
        })
    }

    // For a section of prose create a paragraph
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

    // Create a text run
    makeTextrun(text, spaceAfter) {
        return new docx.TextRun({
            text: text,
            font: this.font,
            size: 16,
            // break: spaceAfter ? spaceAfter : 1
        })
    }

    // Create a page break
    pageBreak() {
        return new docx.Paragraph({
            children: [
                new docx.PageBreak()
            ]
        })
    }

    // Create a text of heading style 1
    makeHeading1(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_1
        })
    }

    // Create a text of heading style 2
    makeHeading2(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_2
        })
    }

    // Create a text of heading style 2
    makeHeading3(text) {
        return new docx.Paragraph({
            text: text,
            heading: docx.HeadingLevel.HEADING_3
        })
    }

    // Create an internal hyperlink
    makeInternalHyperLink(text, link) {
        return new docx.InternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 1.5 * this.size,
                }),
            ],
            anchor: link,
        })
    }

    // Create a bookmark needed to create an internal hyperlink
    makeBookmark(text, ident) {
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

    // Create an external hyperlink
    makeExternalHyperLink(text, link) {
        return new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: text,
                    style: 'Hyperlink',
                    font: this.font,
                    size: 1.5 * this.fontSize
                })
            ],
            link: link
        })
    }

    // Basic table row to produce a name/value pair
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

    // Create rows for object ids and object descriptions
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

    // Create the rows with URLs/links
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

    // Build a comparisons row
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

    

    // Write the report to storage
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

     // Rank supplied topics and return an object that can be rendered
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

    // Create a table for topics
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
}

export default Utilities