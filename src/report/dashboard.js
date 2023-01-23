/**
 * Classes to create dashboards for company, interaction and study objects in mediumroast.io documents
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file dashboard.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 0.1.0
 */

// Import required modules
import docx from 'docx'
import * as fs from 'fs'
import DOCXUtilities from './common.js'
import docxSettings from './settings.js'

class CompanyDashbord {
    /**
     * A high class meant to create an initial dashboard page for an MS Word document company report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     * @param {String} theme - Governs the color of the dashboard, be either coffee or latte 
     */
    constructor(env, theme='coffee') {
        this.env = env
        this.util = new DOCXUtilities()
        this.themeStyle = docxSettings[theme] // Set the theme for the report
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
        // No borders
        this.noBorders = {
            left: this.noneStyle,
            right: this.noneStyle,
            top: this.noneStyle,
            bottom: this.noneStyle
        }
        // Right border only
        this.rightBorder = {
            left: this.noneStyle,
            right: this.borderStyle,
            top: this.noneStyle,
            bottom: this.noneStyle
        }
        // Bottom border only
        this.bottomBorder = {
            left: this.noneStyle,
            right: this.noneStyle,
            top: this.noneStyle,
            bottom: this.borderStyle
        }
        // Bottom and right borders
        this.bottomAndRightBorders = {
            left: this.noneStyle,
            right: this.borderStyle,
            top: this.noneStyle,
            bottom: this.borderStyle
        }
        // All borders, helpful for debugging
        this.allBorders = {
            left: this.borderStyle,
            right: this.borderStyle,
            top: this.borderStyle,
            bottom: this.borderStyle
        }
    }

    // Create the first row with two images and a nested table
    //     40%      |    40%      |   20%
    // bubble chart | radar chart | nested table for stats
    firstRow (bubbleImage, radarImage, rank, bold) {
        const myFontSize = 16
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [this.insertImage('/Users/mihay42/tmp/bubble_chart.png', 226, 259.2)],
                    borders: this.bottomAndRightBorders
                }),
                new docx.TableCell({
                    children: [this.insertImage('/Users/mihay42/tmp/radar_chart.png', 226, 345.6)],
                    borders: this.bottomAndRightBorders
                }),
                new docx.TableCell({
                    children: [new docx.Paragraph("text")],
                    borders: this.noBorders,
                    rowSpan: 5
                }),
            ]
        })
    }

    // Create a blank row for spacing
    blankRow () {
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [new docx.Paragraph("")],
                    borders: this.rightBorder,
                    columnSpan: 2,
                }),
            ]
        })
    }

    // A custom table that contains a company logo/name and description
    _companyDescRow(company) {
        const myRow = new docx.TableRow({
            children: [
                new docx.TableCell({
                    // TODO this needs to be a relevant URL which points to the relevant company
                    children: [this.insertImage(company.logo_url, 19.44, 86.4)],
                    borders: this.noBorders,
                    margins: {
                        left: this.generalStyle.tableMargin,
                        right: this.generalStyle.tableMargin,
                        bottom: this.generalStyle.tableMargin,
                        top: this.generalStyle.tableMargin
                    }
                }),
                new docx.TableCell({
                    children: [
                        this.makeParagraph(
                            company.description, 
                            this.generalStyle.dashFontSize,
                            this.themeStyle.fontColor, 
                            false
                        )
                    ],
                    borders: this.noBorders,
                    margins: {
                        bottom: docx.convertInchesToTwip(0.1),
                        top: docx.convertInchesToTwip(0.1)
                    }
                }),
            ]
        })
        return new docx.Table({
            columnWidths: [10, 90],
            rows: [myRow],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    _docDescRow (docs, fileNameLen=25) {
        // TODO add the header row with colspan=3, centered, and with margins all around to myrows
        let myRows = []
        for(const doc in docs) {
            let docCategoryName = ""
            doc === "most_similar" ? docCategoryName = "Most similar" : docCategoryName = "Least similar"
            let docName = docs[doc].name
            if (docName.length > fileNameLen) {
                docName = docName.substring(0,fileNameLen) + '...'
            }
            // TODO look into setting widths explicitly for each cell
            // TODO set margins
            myRows.push(
                    new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                this.makeParagraph(
                                        docCategoryName, 
                                        this.generalStyle.dashFontSize,
                                        this.themeStyle.fontColor,
                                        false
                                    )
                                ],
                            borders: this.noBorders
                        }),
                        new docx.TableCell({
                            children: [
                                // TODO this needs to be a URL which points to the relevant document
                                this.makeParagraph(
                                    docName, 
                                    this.generalStyle.dashFontSize,
                                    this.themeStyle.fontColor, 
                                    false
                                )
                            ],
                            borders: this.noBorders
                        }),
                        new docx.TableCell({
                            children: [
                                this.makeParagraph(
                                    docs[doc].text, 
                                    this.generalStyle.dashFontSize,
                                    this.themeStyle.fontColor, 
                                    false
                                )
                            ],
                            borders: this.noBorders
                        }),
                    ]
                })
            )
        }
        return new docx.Table({
            columnWidths: [25, 35, 40],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

    }


    // A shell row to contain company description, document descriptions, etc.
    shellRow (type, company, docs) {
        let myTable = {}
        if (type === "companyDesc") {
            myTable = this._companyDescRow(company)
        } else if (type === "docDesc") {
            myTable = this._docDescRow(docs)
        } else {
            myTable = this._blankRow()
        }
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [myTable],
                    borders: this.bottomAndRightBorders,
                    columnSpan: 2,
                })
            ]
        })
    }

    insertImage (imageFile, height, width) {
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.ImageRun({
                    data: fs.readFileSync(imageFile),
                    transformation: {
                        height: height, // 3 inches
                        width: width
                    }
                })
            ]
        })
    }

    makeParagraph (paragraph, size, color, bold, spaceAfter) {
        // Note the font size is measured in half points
        size = 2 * size
        return new docx.Paragraph({
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: this.generalStyle.font,
                    size: size ? size : 20,
                    bold: bold ? bold : false, 
                    break: spaceAfter ? spaceAfter : 0,
                    color: color ? color : "fff"
                })
            ]
        })
    }

    /**
     * 
     * @param {Object} company - the company the dashboard is for
     * @param {Object} competitors - the competitors to the company
     * @returns 
     */
    makeDashboard(company, competitor, docs) {
        competitor = {
            description: "Savonix is a company developing a mobile neurocognitive assessment and brain health platform. The platform allows users to access accurate cognitive data in domains from attention and impulse control to different kinds of memory to assess for dementia risk. It also enables users to screen for cognitive health directly from their mobile device.",
            logo_url: "/Users/mihay42/tmp/savonix.png",
            name: "Savonix"
        }
        docs = {
            most_similar: {
                name: "Science - Savonix",
                text: "This is the value of Savonix. We leverage our powerful database of cognitive, lifestyle, and other health data to assess and monitor your brain health over time. Our clinically validated, neurocognitive test provides real-time results for instant and delayed verbal memory, impulse control, attention, focus, emotion identification, information processing speed, flexible thinking, working memory and executive function. The role of memory in dement..."
            },
            least_similar: {
                name: "Bayer Selects Savonix Digital Cognitive Assessment Platform to Validate the Effects of Multivitamin Supplement Berocca in Malaysia | Business Wire",
                text: "A global leader in digital tests for cognitive health, and Bayer's consumer health division today announces a partnership agreement to work together to validate the effects of multivitamin supplement Berocca in the Malaysian market. A Savonix digital cognitive assessment, which takes around 10 minutes to complete, will be administered to 200 university students between the ages of 18-25 in Malaysia. The platform is an accessible, consumer-friendly and comprehensive tool for professional cognitive screens..."
            }
        }
        let myRows = [
            this.firstRow('one', 'two', 'three', true),
            this.shellRow("companyDesc", competitor, null),
            this.shellRow("docDesc", null, docs),
        ]
        const myTable = new docx.Table({
            columnWidths: [40, 40, 20],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })

        return myTable
    }

}

export {
    CompanyDashbord
}