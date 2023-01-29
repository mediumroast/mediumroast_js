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
        // Top and right borders
        this.topAndRightBorders = {
            left: this.noneStyle,
            right: this.borderStyle,
            top: this.borderStyle,
            bottom: this.noneStyle
        }
        // All borders, helpful for debugging
        this.allBorders = {
            left: this.borderStyle,
            right: this.borderStyle,
            top: this.borderStyle,
            bottom: this.borderStyle
        }
    }

    _statisticsTable(statistics) {
        // TODO if the length of any number is greater than 3 digits shrink the font size by 15% and round down
        const myRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.companyStats,
                                this.generalStyle.metricFontSize,
                                this.themeStyle.titleFontColor,
                                0,
                                true,
                                true,
                                this.generalStyle.metricFont
                            )
                        ],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.companyStatsTitle,
                                this.generalStyle.metricFontTitleSize,
                                this.themeStyle.titleFontColor,
                                0,
                                false,
                                true
                            )
                        ],
                        borders: this.noBorders,
                        margins: {
                            bottom: this.generalStyle.tableMargin,
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.averageStats,
                                this.generalStyle.metricFontSize,
                                this.themeStyle.titleFontColor,
                                0,
                                true,
                                true,
                                this.generalStyle.metricFont
                            )
                        ],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.averageStatsTitle,
                                this.generalStyle.metricFontTitleSize,
                                this.themeStyle.titleFontColor,
                                0,
                                false,
                                true
                            )
                        ],
                        borders: this.noBorders,
                        margins: {
                            bottom: this.generalStyle.tableMargin,
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.totalStats,
                                this.generalStyle.metricFontSize,
                                this.themeStyle.titleFontColor,
                                0,
                                true,
                                true,
                                this.generalStyle.metricFont
                            )
                        ],
                        borders: this.bottomBorder,
                        margins: {
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.totalStatsTitle,
                                this.generalStyle.metricFontTitleSize,
                                this.themeStyle.titleFontColor,
                                0,
                                false,
                                true
                            )
                        ],
                        borders: this.noBorders,
                        margins: {
                            bottom: this.generalStyle.tableMargin,
                            top: this.generalStyle.tableMargin
                        }
                    }),
                ]
            }),
        ]
        return new docx.Table({
            columnWidths: [95],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    // Create the first row with two images and a nested table
    //     40%      |    40%      |   20%
    // bubble chart | radar chart | nested table for stats
    firstRow (bubbleImage, radarImage, stats) {
        bubbleImage = '/Users/mihay42/tmp/bubble_chart.png'
        radarImage = '/Users/mihay42/tmp/radar_chart.png'
        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [this.insertImage(bubbleImage, 226, 259.2)],
                    borders: this.bottomAndRightBorders
                }),
                new docx.TableCell({
                    children: [this.insertImage(radarImage, 226, 345.6)],
                    borders: this.bottomAndRightBorders
                }),
                new docx.TableCell({
                    children: [this._statisticsTable(stats)],
                    borders: this.noBorders,
                    rowSpan: 5,
                    margins: {
                        left: this.generalStyle.tableMargin,
                        right: this.generalStyle.tableMargin,
                        bottom: this.generalStyle.tableMargin,
                        top: this.generalStyle.tableMargin
                    },
                    verticalAlign: docx.VerticalAlign.CENTER,

                }),
            ]
        })
    }

    // A custom table that contains a company logo/name and description
    _companyDescRow(company, descriptionLen=350) {
        // Trim the length of the description to the required size
        let companyDesc = company.description
        companyDesc = companyDesc.replace(/\.\.\.|\.$/, '')
        if (companyDesc.length > descriptionLen) {
            companyDesc = companyDesc.substring(0,descriptionLen)
        }
        companyDesc = companyDesc + '...'
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
                            companyDesc, 
                            this.generalStyle.dashFontSize,
                            this.themeStyle.fontColor, 
                            false
                        )
                    ],
                    borders: this.noBorders,
                    margins: {
                        bottom: this.generalStyle.tableMargin,
                        top: this.generalStyle.tableMargin
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

    _docDescRow (docs, fileNameLen=25, docLen=460, headerText="Relevant Interactions") {
        // TODO add the header row with colspan=3, centered, and with margins all around to myrows
        let myRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                    headerText, 
                                    this.generalStyle.dashFontSize,
                                    this.themeStyle.fontColor,
                                    0, // Set the space after attribute to 0
                                    true, // Set bold to true
                                    true // Set alignment to center
                                )
                            ],
                        borders: this.noBorders,
                        columnSpan: 3,
                        margins: {
                            bottom: this.generalStyle.tableMargin,
                            top: this.generalStyle.tableMargin
                        }
                        
                    }),
                ],
        })]
        for(const doc in docs) {
            let docCategoryName = ""
            doc === "most_similar" ? docCategoryName = "Most similar" : docCategoryName = "Least similar"
            // Trim the length of the document name
            let docName = docs[doc].name
            if (docName.length > fileNameLen) {
                docName = docName.substring(0,fileNameLen) + '...'
            }
            // Trim the length of the document description
            let docDesc = docs[doc].text
            docDesc = docDesc.replace(/\.\.\.|\.$/, '')
            if (docDesc.length > docLen) {
                docDesc = docDesc.substring(0,docLen)
            }
            docDesc = docDesc + '...'
            // TODO look into setting widths explicitly for each cell
            myRows.push(
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                children: [
                                    this.makeParagraph(
                                            docCategoryName, 
                                            this.generalStyle.dashFontSize,
                                            this.themeStyle.fontColor,
                                        )
                                    ],
                                borders: this.noBorders,
                                margins: {
                                    top: this.generalStyle.tableMargin,
                                    left: this.generalStyle.tableMargin,
                                },
                                width: {
                                    size: 15,
                                    type: docx.WidthType.PERCENTAGE
                                }
                            }),
                            new docx.TableCell({
                                children: [
                                    // TODO this needs to be a URL which points to the relevant document
                                    this.makeParagraph(
                                        docName, 
                                        this.generalStyle.dashFontSize,
                                        this.themeStyle.fontColor, 
                                    )
                                ],
                                borders: this.noBorders,
                                margins: {
                                    top: this.generalStyle.tableMargin,
                                    right: this.generalStyle.tableMargin,
                                },
                                width: {
                                    size: 15,
                                    type: docx.WidthType.PERCENTAGE
                                }
                            }),
                            new docx.TableCell({
                                children: [
                                    this.makeParagraph(
                                        docDesc, 
                                        this.generalStyle.dashFontSize,
                                        this.themeStyle.fontColor, 
                                    )
                                ],
                                borders: this.noBorders,
                                margins: {
                                    // left: this.generalStyle.tableMargin,
                                    right: this.generalStyle.tableMargin,
                                    bottom: this.generalStyle.tableMargin,
                                    top: this.generalStyle.tableMargin
                                },
                                width: {
                                    size: 70,
                                    type: docx.WidthType.PERCENTAGE
                                }
                            }),
                        ],
                })
            )
        }
        return new docx.Table({
            columnWidths: [20, 30, 50],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            },
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
                    borders: this.topAndRightBorders,
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
     */
    makeParagraph (paragraph, size, color, spaceAfter, bold, center, font) {
        // Note the font size is measured in half points
        size = 2 * size
        return new docx.Paragraph({
            alignment: center ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: font ? font : this.generalStyle.font,
                    size: size ? size : 20,
                    bold: bold ? bold : false, 
                    break: spaceAfter ? spaceAfter : 0,
                    color: color ? color : "000",
                })
            ],
            
        })
    }

    /**
     * 
     * @param {Object} company - the company the dashboard is for
     * @param {Object} competitors - the competitors to the company
     * @returns 
     */
    makeDashboard(company, competitor, interactions) {
        competitor = {
            description: "Savonix is a company developing a mobile neurocognitive assessment and brain health platform. The platform allows users to access accurate cognitive data in domains from attention and impulse control to different kinds of memory to assess for dementia risk. It also enables users to screen for cognitive health directly from their mobile device.",
            logo_url: "/Users/mihay42/tmp/savonix.png",
            name: "Savonix"
        }
        interactions = {
            most_similar: {
                name: "Science - Savonix",
                text: "This is the value of Savonix. We leverage our powerful database of cognitive, lifestyle, and other health data to assess and monitor your brain health over time. Our clinically validated, neurocognitive test provides real-time results for instant and delayed verbal memory, impulse control, attention, focus, emotion identification, information processing speed, flexible thinking, working memory and executive function. The role of memory in dement..."
            },
            least_similar: {
                name: "Bayer Selects Savonix Digital Cognitive Assessment Platform to Validate the Effects of Multivitamin Supplement Berocca in Malaysia | Business Wire",
                text: "A global leader in digital tests for cognitive health, and Bayer's consumer health division today announces a partnership agreement to work together to validate the effects of multivitamin supplement Berocca in the Malaysian market. A Savonix digital cognitive assessment, which takes around 10 minutes to complete, will be administered to 200 university students between the ages of 18-25 in Malaysia. The platform is an accessible, consumer-friendly and comprehensive tool for professional cognitive screens..."
            },
        }
        const myStats = {
            totalStatsTitle: "Total Interactions",
            totalStats: 52,
            averageStatsTitle: "Average Interactions/Company",
            averageStats: 13,
            companyStatsTitle: "uMETHOD Interactions",
            companyStats: 13
        }
        let myRows = [
            this.firstRow(null, null, myStats),
            this.shellRow("companyDesc", competitor),
            this.shellRow("docDesc", null, interactions),
        ]
        const myTable = new docx.Table({
            columnWidths: [40, 40, 20],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            },
            height: {
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