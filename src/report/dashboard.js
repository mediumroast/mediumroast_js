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
import { bubbleChart, radarChart } from './charts.js'

class Dashboards {
    /**
     * A high class meant to create an initial dashboard page for an MS Word document company report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     * @param {String} theme - Governs the color of the dashboard, be either coffee or latte 
     */
    constructor(env) {
        this.env = env
        this.util = new DOCXUtilities(env)
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

    // Following the _statisticsTable method in the CompanyDashboard class create a similar method for all dashboards
    /**
     * 
     * 
     * @param {*} statistics
     * @returns
     * @todo turn into a loop instead of having the code repeated
     * @todo if the length of any number is greater than 3 digits shrink the font size by 15% and round down
     * @todo add a check for the length of the title and shrink the font size by 15% and round down
     * @todo add a check for the length of the value and shrink the font size by 15% and round down
     */
    descriptiveStatisticsTable(statistics) {
        let myRows = []
        for(const stat in statistics) {
            myRows.push(
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                this.util.makeParagraph(
                                    statistics[stat].value,
                                    {
                                        fontSize: this.generalStyle.metricFontSize,
                                        fontColor: this.themeStyle.titleFontColor,
                                        font: this.generalStyle.heavyFont,
                                        bold: true,
                                        center: true
                                    }
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
                                this.util.makeParagraph(
                                    statistics[stat].title,
                                    {
                                        fontSize: this.generalStyle.metricFontSize/2,
                                        fontColor: this.themeStyle.titleFontColor,
                                        bold: false,
                                        center: true
                                    }
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
            )
        }
        return new docx.Table({
            columnWidths: [95],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    // Using DOCXUtilties basicRow method create a similar method for all dashboards that returns a table with a single row
    /**
     * 
     * @param {*} data 
     * @returns 
     */
    simpleDescriptiveTable(title, text) {
        const myRows = [this.util.basicRow(title, text)]
        return new docx.Table({
            columnWidths: [95],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    /**
     * 
     * @param {*} imageFile 
     * @param {*} height 
     * @param {*} width 
     * @returns 
     * @todo move to common
     */
    insertImage (imageFile, height, width) {
        const myFile = fs.readFileSync(imageFile)
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.ImageRun({
                    data: myFile,
                    transformation: {
                        height: height,
                        width: width
                    }
                })
            ]
        })
    }
}

class InteractionDashboard extends Dashboards {
    /**
     * A class meant to create an initial dashboard page for an MS Word document interaction report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     */
    constructor(env) {
        super(env)
    }

    // Create the first row with two images and a nested table
    //     40%      |    40%      |   20%
    // bubble chart | radar chart | nested table for stats
    firstRow (interactionData, statisticsData) {
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    children: [interactionData.name],
                    borders: this.bottomBorder,
                    rowSpan: 1,
                    columnSpan:2,
                    margins: {
                        left: this.generalStyle.tableMargin,
                        right: this.generalStyle.tableMargin,
                        bottom: this.generalStyle.tableMargin,
                        top: this.generalStyle.tableMargin
                    },
                    verticalAlign: docx.VerticalAlign.CENTER,
                }),
                new docx.TableCell({
                    children: [interactionData.description],
                    borders: this.bottomBorder,
                    rowSpan: 1,
                    columnSpan:2,
                    margins: {
                        left: this.generalStyle.tableMargin,
                        right: this.generalStyle.tableMargin,
                        bottom: this.generalStyle.tableMargin,
                        top: this.generalStyle.tableMargin
                    },
                    verticalAlign: docx.VerticalAlign.CENTER,
                }),
                new docx.TableCell({
                    children: [statisticsData],
                    borders: this.allBorders,
                    rowSpan: 1,
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

    async makeDashboard(interaction, company) {
        // TODO Create the table around this data, note that we're also missing the cells of the first row, but we're writing the file
        
        const statsData = super.descriptiveStatisticsTable([
            {title: 'Interaction type', value: interaction.interaction_type},
            {title: 'Estimated reading time (minutes)', value: interaction.reading_time},
            {title: 'Page count', value: interaction.page_count},
            {title: 'Region', value: interaction.region},
            {title: 'Proto-requirements', value: Object.keys(interaction.topics).length},
        ])
        const interactionNameTable = super.simpleDescriptiveTable('Interaction Name', interaction.name)
        const interactionDescriptionTable = super.simpleDescriptiveTable('Interaction Description', interaction.description)
        const myRows = this.firstRow({name: interactionNameTable, description: interactionDescriptionTable}, statsData)
        const myTable = new docx.Table({
            columnWidths: [40, 20],
            rows: [myRows],
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

class CompanyDashbord {
    /**
     * A high class meant to create an initial dashboard page for an MS Word document company report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     * @param {String} theme - Governs the color of the dashboard, be either coffee or latte 
     */
    constructor(env) {
        this.env = env
        this.util = new DOCXUtilities(env)
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

    /**
     * 
     * @param {*} statistics 
     * @returns 
     * @todo turn into a loop instead of having the code repeated
     * @todo if the length of any number is greater than 3 digits shrink the font size by 15% and round down
     */
    _statisticsTable(statistics) {
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
                                this.generalStyle.heavyFont
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
                                this.generalStyle.heavyFont
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
                                this.generalStyle.heavyFont
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
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                statistics.totalCompanies,
                                this.generalStyle.metricFontSize,
                                this.themeStyle.titleFontColor,
                                0,
                                true,
                                true,
                                this.generalStyle.heavyFont
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
                                statistics.totalCompaniesTitle,
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
    _companyDescRow(company, descriptionLen=550) {
        // Trim the length of the description to the required size
        let companyDesc = company.company.description
        companyDesc = companyDesc.replace(/\.\.\.|\.$/, '')
        if (companyDesc.length > descriptionLen) {
            companyDesc = companyDesc.substring(0,descriptionLen)
        }
        companyDesc = companyDesc + '...'
        const myRows = [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [
                                this.makeParagraph(
                                        company.company.name, // Text for the paragraph
                                        this.generalStyle.companyNameFontSize, // Font size
                                        this.themeStyle.titleFontColor, // Specify the font color
                                        0, // Set the space after attribute to 0
                                        false, // Set bold to false
                                        true, // Set alignment to center
                                        this.generalStyle.heavyFont // Define the font used
                                    )
                                ],
                            borders: this.noBorders,
                            columnSpan: 2,
                            margins: {
                                top: this.generalStyle.tableMargin
                            }
                        }),
                    ],
            }),
            new docx.TableRow({
                children: [
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
        ]   
        return new docx.Table({
            columnWidths: [100],
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    _docDescRow (
        docs, 
        fileNameLen=25, 
        docLen=460, 
        headerText="Most/Least Similar Interactions",
        mostSimilarRowName="Most similar",
        leastSimilarRowName="Least similar"
    ) {
        // TODO add the header row with colspan=3, centered, and with margins all around to myrows
        let myRows = [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        children: [
                            this.makeParagraph(
                                    headerText, 
                                    this.generalStyle.dashFontSize,
                                    this.themeStyle.titleFontColor,
                                    0, // Set the space after attribute to 0
                                    true, // Set bold to true
                                    true, // Set alignment to center
                                    this.generalStyle.heavyFont // Define the font used
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
            doc === "most_similar" ? docCategoryName = mostSimilarRowName : docCategoryName = leastSimilarRowName
            // Trim the length of the document name
            let docName = docs[doc].name
            if (docName.length > fileNameLen) {
                docName = docName.substring(0,fileNameLen) + '...'
            }
            // Trim the length of the document description
            let docDesc = docs[doc].description
            docDesc = docDesc.replace(/\.\.\.|\.$/, '')
            if (docDesc.length > docLen) {
                docDesc = docDesc.substring(0,docLen)
            }
            docDesc = docDesc + '...'
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

    /**
     * 
     * @param {*} imageFile 
     * @param {*} height 
     * @param {*} width 
     * @returns 
     * @todo move to common
     */
    insertImage (imageFile, height, width) {
        const myFile = fs.readFileSync(imageFile)
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.ImageRun({
                    data: myFile,
                    transformation: {
                        height: height,
                        width: width
                    }
                })
            ]
        })
    }

    // Find the closest competitor
    // This uses the Euclidean distantce, given points (x1, y1) and (x2, y2)
    // d = sqrt((x2 - x1)^2 + (y2 - y1)^2) 
    _getMostSimilarCompany(comparisons, companies) {
        const x1 = 1 // In this case x1 = 1 and y1 = 1
        const y1 = 1
        let distances = {}
        for(const companyId in comparisons) {
            const myDistance = Math.sqrt(
                    (comparisons[companyId].most_similar.score - x1) ** 2 + 
                    (comparisons[companyId].least_similar.score - y1) ** 2
                )
            distances[myDistance] = companyId
        }
        const mostSimilarId = distances[Math.min(...Object.keys(distances))]
        const mostSimilarCompany = companies.filter(company => {
            if (parseInt(company.company.id) === parseInt(mostSimilarId)) {
                return company
            }
        })
        return mostSimilarCompany[0]
    }

    // Compute interaction descriptive statistics
    _computeInteractionStats(company, competitors) {
        // Pull out company interactions
        const companyInteractions = Object.keys(company.linked_interactions).length

        // Get the total number of interactions
        // Add the current company interactions to the total
        let totalInteractions = companyInteractions 
        // Sum all other companies' interactions
        for(const competitor in competitors) {
            totalInteractions += Object.keys(competitors[competitor].company.linked_interactions).length
        }

        // Compute the average interactions per company
        const totalCompanies = 1 + competitors.length  
        const averageInteractions = Math.round(totalInteractions/totalCompanies) 

        // Return the result
        return {
            totalStatsTitle: "Total Interactions",
            totalStats: totalInteractions,
            averageStatsTitle: "Average Interactions/Company",
            averageStats: averageInteractions,
            companyStatsTitle: "Interactions",
            companyStats: companyInteractions,
            totalCompaniesTitle: "Total Companies",
            totalCompanies: totalCompanies
        }
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
     * @todo Add an options object in a future release when refactoring
     * @todo Review the NOTICE section and at a later date work on all TODOs there
     */
    makeParagraph (
        paragraph, 
        size=20, 
        color="000", 
        spaceAfter=0, 
        bold=false, 
        center=false, 
        font="Avenir Next", 
        italics=false, 
        underline=false
    ) {
        size = 2 * size // Font size is measured in half points, multiply by to is needed
        return new docx.Paragraph({
            alignment: center ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
            children: [
                new docx.TextRun({
                    text: paragraph,
                    font: font ? font : "Avenir Next", // Default font: Avenir next
                    size: size ? size : 20, // Default font size size 10pt or 2 * 10 = 20
                    bold: bold ? bold : false, // Bold is off by default
                    italics: italics ? italics : false, // Italics off by default
                    underline: underline ? underline : false, // Underline off by default
                    break: spaceAfter ? spaceAfter : 0, // Defaults to no trailing space after the paragraph
                    color: color ? color : "000", // Default color is black 
                })
            ],
            
        })
    }

    /**
     * @async
     * @param {Object} company - the company the dashboard is for
     * @param {Object} competitors - the competitors to the company
     * @param {String} baseDir - the complete directory needed to store images for the dashboard
     * @returns 
     */
    async makeDashboard(company, competitors, baseDir) {
        // Create the bubble chart from the company comparisons
        const bubbleChartFile = await bubbleChart(
            company.comparison,
            this.env,
            baseDir
        )
        // Find the most similar company
        const mostSimilarCompany = this._getMostSimilarCompany(
            company.comparison, 
            competitors
        )
        // Pull in the relevant interactions from the most similar company
        const mostLeastSimilarInteractions = {
            most_similar: mostSimilarCompany.mostSimilar.interaction,
            least_similar: mostSimilarCompany.leastSimilar.interaction
        }
        // Compute the descriptive statistics for interactions
        const myStats = this._computeInteractionStats(company,competitors)
        // Create the radard chart from supplied interaction quality data
        const radarChartFile = await radarChart(
            {company: company, competitors: competitors, stats: myStats},
            this.env,
            baseDir
        )
        /**
         * NOTICE
         * I believe that there is a potential bug in node.js filesystem module.
         * This file is needed because otherwise the actual final of the two images
         * that needs to be inserted into the docx file won't load.  If we create a
         * scratch file then it will.  Essentially something is off with the last
         * file created in a series of files, but the second to last file appears ok.
         * 
         * Obviously more testing is needed before we approach the node team with something
         * half baked.  Until then here are some observations:
         * 1. Unless the file of a given name is present, even if zero bytes, the image data
         *    will not be put into the file.  If the file name exists then everything works.
         * 2. Again the last file in a series of files appears to be corrupted and cannot, for
         *    some odd reason, be read by the docx module and be inserted into a docx file.
         *    Yet when we look at the file system object within the file system it can be opened
         *    without any problems.
         * 
         * TODOs
         * 1. Create a separate program that emulates what is done in the mrcli dashboard
         * 2. Try on multiple OSes
         * 3. Clearly document the steps and problem encountered
         * 4. In the separate standalone program try using with and without axios use default http without
         */
        const scratchChartFile = await radarChart(
            {company: company, competitors: competitors, stats: myStats},
            this.env,
            baseDir,
            'scratch_chart.png'
        )
        let myRows = [
            this.firstRow(bubbleChartFile, radarChartFile, myStats),
            this.shellRow("companyDesc", mostSimilarCompany),
            this.shellRow("docDesc", null, mostLeastSimilarInteractions),
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
    CompanyDashbord,
    InteractionDashboard
}