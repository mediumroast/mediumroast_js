// report/widgets/TableWidget.js
import Widgets from './Widgets.js'
import TextWidgets from './Text.js'
import docx from 'docx'

class TableWidgets extends Widgets {
    constructor(env) {
        super(env)
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
     * @function twoColumnRowBasic
     * @description Basic table row to produce a name/value pair table with 2 columns
     * @param {Array} cols - an array of 2 strings to be used as the text/prose for the cells
     * @param {Object} options - options for the cell to control bolding in the first column and all columns and border styles
     * @returns {Object} a new docx TableRow object
     * 
     * @example
     * const myRow = twoColumnRowBasic(["Name", "Michael Hay"], {firstColumnBold: true, allColumnsBold: false})
     * 
     */
    twoColumnRowBasic (cols, options={}) {
        let {
            firstColumnBold = true,
            allColumnsBold = false,
            allBorders = false,
            bottomBorders = true,
            lastCellBottomRightBorders = false
        } = options

        // Set the first column to bold if all columns are bold
        if (allColumnsBold) {
            firstColumnBold = true
        }

        // Set the border style
        let leftBorderStyle = this.noBorders
        let rightBorderStyle = this.noBorders
        if (allBorders) {
            leftBorderStyle = this.allBorders
            rightBorderStyle = this.allBorders
        } else if (bottomBorders) {
            leftBorderStyle = this.bottomBorder
            rightBorderStyle = this.bottomBorder
        } else if (lastCellBottomRightBorders) {
            leftBorderStyle = this.bottomBorder
            rightBorderStyle = this.bottomAndRightBorders
        }

        // Destructure the cols array
        const [col1, col2] = cols

        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [TextWidgets.makeParagraph(col1, {fontSize: this.fontFactor * this.fontSize, bold: firstColumnBold})],
                    borders: leftBorderStyle
                }),
                new docx.TableCell({
                    width: {
                        size: 80,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [TextWidgets.makeParagraph(col2, {fontSize: this.fontFactor * this.fontSize, bold: allColumnsBold})],
                    borders: rightBorderStyle
                })
            ]
        })
    }

    /**
     * @function twoColumnRowWithHyperlink
     * @description Hyperlink table row to produce a name/value pair table with 2 columns and an external hyperlink
     @param {Array} cols - an array of 3 strings for the row first column, second column text, and the hyperlink URL
     * @param {Object} options - options for the cell to control bolding in the first column and all columns and border styles
     * @returns {Object} a new docx TableRow object with an external hyperlink
     */
    twoColumnRowWithHyperlink(cols, options={}) {
        let {
            firstColumnBold = true,
            allColumnsBold = false,
            allBorders = false,
            bottomBorders = true,
            lastCellBottomRightBorders = false
        } = options

        // Set the first column to bold if all columns are bold
        if (allColumnsBold) {
            firstColumnBold = true
        }

        // Set the border style
        let leftBorderStyle = this.noBorders
        let rightBorderStyle = this.noBorders
        if (allBorders) {
            leftBorderStyle = this.allBorders
            rightBorderStyle = this.allBorders
        } else if (bottomBorders) {
            leftBorderStyle = this.bottomBorder
            rightBorderStyle = this.bottomBorder
        } else if (lastCellBottomRightBorders) {
            leftBorderStyle = this.bottomBorder
            rightBorderStyle = this.bottomAndRightBorders
        }

        // Destructure the cols array
        const [col1, col2, col2Hyperlink] = cols

        // define the link to the target URL
        const myUrl = new docx.ExternalHyperlink({
            children: [
                new docx.TextRun({
                    text: col2,
                    style: 'Hyperlink',
                    font: this.generalSettings.font,
                    size: this.generalSettings.fullFontSize,
                    bold: allColumnsBold
                })
            ],
            link: col2Hyperlink
        })

        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 20,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [TextWidgets.makeParagraph(col1, {fontSize: this.generalSettings.fullFontSize, bold: firstColumnBold})],
                    borders: leftBorderStyle
                }),
                new docx.TableCell({
                    width: {
                        size: 80,
                        type: docx.WidthType.PERCENTAGE
                    },
                    children: [new docx.Paragraph({children:[myUrl]})],
                    borders: rightBorderStyle
                })
            ]
        })
    }

    /**
     * @function threeColumnRowBasic
     * @description Basic table row with 3 columns
     * @param {Array} cols - an array of 3 strings to be used as the text/prose for the cells
     * * @param {Object} options - options for the cell to control bolding in the first column and all columns and border styles
     * @returns {Object} a new 3 column docx TableRow object
     */
    threeColumnRowBasic (cols, options={}) {
        let {
            firstColumnBold = true,
            allColumnsBold = false,
            allBorders = false,
            bottomBorders = true,
        } = options

        // Set the first column to bold if all columns are bold
        if (allColumnsBold) {
            firstColumnBold = true
        }

        // Set the border style
        let borderStyle = this.noBorders
        if (allBorders) {
            borderStyle = this.allBorders
        } else if (bottomBorders) {
            borderStyle = this.bottomBorder
        }
        // Destructure the cols array
        const [col1, col2, col3] = cols

        // return the row
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    width: {
                        size: 40,
                        type: docx.WidthType.PERCENTAGE,
                    },
                    children: [TextWidgets.makeParagraph(col1, {fontSize: this.fontFactor * this.fontSize, bold: firstColumnBold})],
                    borders: borderStyle
                }),
                new docx.TableCell({
                    width: {
                        size: 30,
                        type: docx.WidthType.PERCENTAGE,
                    },
                    children: [TextWidgets.makeParagraph(col2, {fontSize: this.fontFactor * this.fontSize, bold: allColumnsBold})],
                    borders: borderStyle
                }),
                new docx.TableCell({
                    width: {
                        size: 30,
                        type: docx.WidthType.PERCENTAGE,
                    },
                    children: [TextWidgets.makeParagraph(col3, {fontSize: this.fontFactor * this.fontSize, bold: allColumnsBold})],
                    borders: borderStyle
                }),
            ]
        })
    }

    /** 
     * Begin functions for completely defining tables with a particular structure
    */
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

    /**
     * @function tagsTable
     * @description Create a table with tags
     * @param {Object} tags - tags object
     * @returns {Object} a docx Table object
     * @example
     * const tags = {
     *   "tag1": "value1",
     *   "tag2": "value2"
     * }
     * const myTable = tagsTable(tags)
     * 
     * // Add the table to the document
     * doc.addSection({
     *      properties: {},
     *      children: [myTable]
     * })
     */
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
    
    /**
     * @function simpleDescriptiveTable
     * @param {String} title -  the title of the table
     * @param {String} text - the text for the table
     * @returns {Object} a docx Table object
     * @example
     * const myTable = simpleDescriptiveTable("Title", "Text")
     * 
     * Will return a table with the title in the first column and the text in the second column, like this:
     * 
     * -------------------------------------
     * | Title | Text                       |
     * -------------------------------------
     */
    simpleDescriptiveTable(title, text) {
        return new docx.Table({
            columnWidths: [95],
            margins: {
                left: this.generalStyle.tableMargin,
                right: this.generalStyle.tableMargin,
                bottom: this.generalStyle.tableMargin,
                top: this.generalStyle.tableMargin
            },
            rows: [this.twoColumnRowBasic([title, text], {firstColumnBold: true, allColumnsBold: false, lastCellBottomRightBorders: true})],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }

    /**
     * 
     * @function descriptiveStatisticsTable
     * @param {Object} statistics
     * @returns
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
            borders: this.noBorders,
            rows: myRows,
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }
}

export default TableWidgets