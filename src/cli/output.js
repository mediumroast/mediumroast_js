/**
 * A class used for consistent outputting of CLI data
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file output.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.2.0
 */

// Import required modules
import { table as createTable, getBorderCharacters } from 'table'
import {Parser} from '@json2csv/plainjs'
// import * as XLSX from 'xlsx'
import logo from 'asciiart-logo'
import FilesystemOperators from './filesystem.js'

class CLIOutput {
    /**
     * A class to enable consistent output formatting for CLI operations
     * @constructor
     * @classdesc Construct utilities, environmental variables and the object type
     * @param {Object} env - An object containing all needed environmental variables
     * @param {String} objectType - A string that contains the type of object using this module
     */
    constructor(env, objectType) {
        this.env = env
        this.objectType = objectType
        this.fileSystem = new FilesystemOperators()
    }

    /**
     * @function calculateColumnWidths
     * @description Calculate optimal column widths based on content and terminal width
     * @param {Array} data - Array of row data (arrays)
     * @param {Array} headers - Array of column headers
     * @param {Object} layout - Layout configuration with minWidths and maxWidth
     * @returns {Array} Array of column widths
     */
    calculateColumnWidths(data, headers, layout) {
        const columnCount = headers.length
        const maxWidth = layout.maxWidth || (process.stdout.columns - 10)
        const minWidths = layout.minWidths || headers.map(() => 10)
        const padding = 3 // Space for borders and padding per column
        
        // Calculate content-based widths
        const contentWidths = headers.map((header, index) => {
            const headerWidth = header.length
            const maxContentWidth = Math.max(...data.map(row => 
                String(row[index] || '').length
            ))
            return Math.max(headerWidth, maxContentWidth, minWidths[index])
        })
        
        // Calculate total width needed
        const totalContentWidth = contentWidths.reduce((sum, width) => sum + width, 0)
        const totalPadding = columnCount * padding
        const totalNeeded = totalContentWidth + totalPadding
        
        // If fits in maxWidth, use content widths
        if (totalNeeded <= maxWidth) {
            return contentWidths
        }
        
        // Otherwise, intelligently scale down while respecting priorities
        const availableWidth = maxWidth - totalPadding
        
        // For wide terminals with description column, limit description width
        if (headers.includes('Description')) {
            const descIndex = headers.indexOf('Description')
            const otherColumnsWidth = contentWidths.reduce((sum, width, index) => 
                index === descIndex ? sum : sum + width, 0)
            
            // Limit description to remaining space, but not less than minimum
            const maxDescWidth = Math.max(
                availableWidth - otherColumnsWidth,
                minWidths[descIndex]
            )
            
            contentWidths[descIndex] = Math.min(contentWidths[descIndex], maxDescWidth)
            
            // Recalculate total
            const newTotal = contentWidths.reduce((sum, width) => sum + width, 0)
            if (newTotal + totalPadding <= maxWidth) {
                return contentWidths
            }
        }
        
        // Final proportional scaling if still too wide
        const scaleFactor = availableWidth / totalContentWidth
        return contentWidths.map((width, index) => 
            Math.max(Math.floor(width * scaleFactor), minWidths[index])
        )
    }

    /**
     * @function truncateWithEllipsis
     * @description Truncate text with ellipsis if it exceeds maxWidth
     * @param {String} text - Text to truncate
     * @param {Number} maxWidth - Maximum width
     * @returns {String} Truncated text
     */
    truncateWithEllipsis(text, maxWidth) {
        if (!text || text.length <= maxWidth) return text
        return text.substring(0, maxWidth - 3) + '...'
    }

    /**
     * @function cleanDescription
     * @description Clean and normalize description text with smart truncation
     * @param {String} text - Raw description text
     * @param {Number} maxLength - Maximum length before truncation (default: 500)
     * @returns {String} Cleaned and truncated description text
     */
    cleanDescription(text, maxLength = 500) {
        if (!text) return 'No description'
        
        // First, normalize all whitespace characters and control characters
        const normalized = text
            .replace(/[\r\n\t\f\v]/g, ' ') // Replace all line breaks, tabs, form feeds, vertical tabs with spaces
            .replace(/\s+/g, ' ') // Replace multiple consecutive spaces with single space
            .replace(/[^\x20-\x7E]/g, ' ') // Replace non-printable ASCII characters with spaces
            .trim() // Remove leading/trailing whitespace
        
        // Split into words and filter out empty strings to ensure clean joining
        const words = normalized
            .split(' ')
            .filter(word => word.length > 0)
        
        // Rejoin with single spaces
        const cleaned = words.join(' ')
        
        // Smart truncation at word boundaries
        if (cleaned.length <= maxLength) {
            return cleaned
        }
        // console.log('------ Truncating description to fit maxLength:', maxLength)
        // console.log(cleaned)
        
        // Find the last space before maxLength to avoid cutting mid-word
        const truncateIndex = cleaned.lastIndexOf(' ', maxLength - 3)
        if (truncateIndex > 0) {
            return cleaned.substring(0, truncateIndex) + '...'
        }
        
        // Fallback: hard truncate if no space found
        return cleaned.substring(0, maxLength - 3) + '...'
    }

    /**
     * @function wrapText
     * @description Word wrap text to fit within maxWidth
     * @param {String} text - Text to wrap
     * @param {Number} maxWidth - Maximum width per line
     * @returns {String} Wrapped text with newlines
     */
    wrapText(text, maxWidth) {
        if (!text || text.length <= maxWidth) return text
        
        const words = text.split(' ')
        const lines = []
        let currentLine = ''
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word
            if (testLine.length <= maxWidth) {
                currentLine = testLine
            } else {
                if (currentLine) lines.push(currentLine)
                currentLine = word.length > maxWidth ? word.substring(0, maxWidth - 3) + '...' : word
            }
        }
        
        if (currentLine) lines.push(currentLine)
        return lines.join('\n')
    }

    /**
     * @function getResponsiveLayout
     * @description Get responsive column layout based on terminal width
     * @param {String} tableType - Type of table (e.g., 'Companies', 'Interactions')
     * @returns {Object} Layout configuration with columns and priorities
     */
    getResponsiveLayout(tableType) {
        const width = process.stdout.columns
        
        if (tableType === 'Companies') {
            if (width < 80) {
                return {
                    columns: ['Name', 'Role', 'Interactions'],
                    priorities: [1, 2, 3],
                    minWidths: [25, 15, 8], // Increased name and role widths
                    maxWidth: 150 // Force wider table for narrow terminals
                }
            } else if (width < 120) {
                return {
                    columns: ['Name', 'Role', 'Interactions', 'Region'],
                    priorities: [1, 2, 3, 4],
                    minWidths: [30, 15, 8, 10], // Increased name and role widths
                    maxWidth: 150 // Force wider table for medium terminals
                }
            } else {
                return {
                    columns: ['Name', 'Role', 'Interactions', 'Region', 'Description'],
                    priorities: [1, 2, 3, 4, 5],
                    minWidths: [35, 18, 8, 12, 40], // Increased name and role, controlled description
                    maxWidth: Math.min(width - 10, 180) // Limit max width for wide terminals
                }
            }
        }
        
        // Default layout for other table types
        return {
            columns: ['Name', 'Description'],
            priorities: [1, 2],
            minWidths: [25, 40],
            maxWidth: Math.min(width - 10, 120)
        }
    }

    /**
     * @function outputCLI
     * @description An output router enabling users to pick their output format of choice for a CLI
     * @param  {String} outputType Type of output to produce/route to: table, json, csv, xls
     * @param  {Object} results Data objects to be output
     */
     outputCLI(results, outputType='table') {
        // Emit the output as per the cli options
        if (outputType === 'table') {
            this.outputTable(results)
        } else if (outputType === 'json') {
            console.log(JSON.stringify(results, null, 2))
        } else if (outputType === 'csv') {
            this.outputCSV(results)
        } else if (outputType === 'xls') {
            this.outputXLS(results)
        }
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output an ASCII formatted table with key object metadata to the console
    outputTable(objects) {
        // User objects output
        // Note: The separation between User and other objects is due to their structure. Pointedly 
        //          user objects do not contain name and description fields.
        let table
        if (this.objectType === 'Users') {
            const headers = ['GitHub Id', 'Login', 'User Type', 'Role Name', 'Site Admin']
            const tableData = []
            
            // NOTE: In this alpha version users aren't yet operable
            for (const myObj in objects) {
                tableData.push([
                    objects[myObj].id,
                    objects[myObj].login,
                    objects[myObj].type,
                    objects[myObj].role_name,
                    objects[myObj].site_admin
                ])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'Org') {
            const headers = ['Id', 'Name', 'GitHub Url', 'Description']
            const tableData = []
            
            for (const myObj in objects) {
                const orgName = objects[myObj].name || objects[myObj].login || 'Unknown'
                tableData.push([
                    objects[myObj].id !== null ? objects[myObj].id : 'No Id', 
                    orgName,
                    objects[myObj].html_url !== null ? objects[myObj].html_url : 'No GitHub Url',
                    objects[myObj].description !== null ? this.cleanDescription(objects[myObj].description) : 'No Description'
                ])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const columnName = headers[index]
                    const maxWidth = colWidths[index]
                    
                    if (columnName === 'Description') {
                        return this.wrapText(cell, maxWidth)
                    } else {
                        return this.truncateWithEllipsis(String(cell), maxWidth)
                    }
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'MyUser') {
            const headers = ['GitHub Id', 'Login', 'Name', 'Type', 'Company', 'GitHub Website']
            const tableData = []
            
            for (const myObj in objects) {
                tableData.push([
                    objects[myObj].id !== null ? objects[myObj].id : 'No Id',
                    objects[myObj].login !== null ? objects[myObj].login : 'No Login',
                    objects[myObj].name !== null ? objects[myObj].name : 'No Name',
                    objects[myObj].type !== null ? objects[myObj].type : 'No Type',
                    objects[myObj].company !== null ? objects[myObj].company : 'No Company',
                    objects[myObj].html_url !== null ? objects[myObj].html_url : 'No GitHub Website'
                ])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        // Study, Company and Interaction objects output
        } else if (this.objectType === 'Companies') {
            // Get responsive layout based on terminal width
            const layout = this.getResponsiveLayout('Companies')
            
            // Prepare data for width calculation
            const tableData = []
            const headers = layout.columns
            
            for (const myObj in objects) {
                let totalInteractions = 0
                if (Object.keys(objects[myObj].linked_interactions).length) {
                    totalInteractions = Object.keys(objects[myObj].linked_interactions).length
                }
                
                // Build row data based on responsive layout
                const rowData = []
                for (const column of layout.columns) {
                    switch (column) {
                        case 'Name':
                            rowData.push(objects[myObj].name || 'Unknown')
                            break
                        case 'Role':
                            rowData.push(objects[myObj].role || 'Unknown')
                            break
                        case 'Interactions':
                            rowData.push(totalInteractions.toString())
                            break
                        case 'Region':
                            rowData.push(objects[myObj].region || 'Unknown')
                            break
                        case 'Description':
                            rowData.push(this.cleanDescription(objects[myObj].description))
                            break
                    }
                }
                tableData.push(rowData)
            }
            
            // Add summary row if there are companies
            if (tableData.length > 0) {
                const totalCompanies = tableData.length
                const totalInteractions = tableData.reduce((sum, row) => {
                    const interactionsIndex = headers.indexOf('Interactions')
                    return sum + (interactionsIndex >= 0 ? parseInt(row[interactionsIndex]) : 0)
                }, 0)
                
                // Add separator row
                tableData.push(headers.map(() => '─'.repeat(3)))
                
                // Create summary row
                const summaryRow = headers.map((header, index) => {
                    switch (header) {
                        case 'Name':
                            return `Total: ${totalCompanies} companies`
                        case 'Interactions':
                            return totalInteractions.toString()
                        default:
                            return ''
                    }
                })
                tableData.push(summaryRow)
            }
            
            // Calculate optimal column widths
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const columnName = headers[index]
                    const maxWidth = colWidths[index]
                    
                    // Special handling for different column types
                    if (columnName === 'Description') {
                        // Wrap long descriptions
                        return this.wrapText(cell, maxWidth)
                    } else if (columnName === 'Interactions') {
                        // Right-align numbers
                        return cell.toString()
                    } else {
                        // Truncate other columns with ellipsis
                        return this.truncateWithEllipsis(cell, maxWidth)
                    }
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'Interactions') {
            const headers = ['Name', 'Creator', 'Region', 'Linked Company']
            const tableData = []
            
            for (const myObj in objects) {
                let linkedCompany = 'Orphaned'
                if(Object.keys(objects[myObj].linked_companies).length) {
                    linkedCompany = Object.keys(objects[myObj].linked_companies)[0]
                }
                    
                tableData.push([
                    objects[myObj].name,
                    objects[myObj].creator_name,
                    objects[myObj].region,
                    linkedCompany
                ])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'ActionsBilling') {
            const headers = ['Minutes Used', 'Paid Minutes Used', 'Minutes Remaining', 'Included Minutes', 'Repository', 'Billing Month']
            const tableData = [[
                objects.billing.total_minutes_used + ' min',
                objects.billing.total_paid_minutes_used + ' min',
                objects.billing.total_minutes_remaining + ' min',
                objects.billing.included_minutes + ' min',
                objects.repository !== null ? objects.repository : 'No Repository',
                objects.period.current_month !== null ? objects.period.current_month : 'No Billing Month'
            ]]
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))

        } else if (this.objectType === 'StorageContainers') {
            const headers = ['Container Name', 'Object Count', 'Metadata Size', 'Size', 'Last Updated']
            const tableData = []
            
            for (const myObj in objects) {
                tableData.push(objects[myObj])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'Workflows') {
            const headers = ['Name', 'Id', 'Status', 'Trigger', 'Runtime (min)']
            const tableData = []
            
            for (const myObj in objects.slice(-5)) {
                tableData.push([
                    objects[myObj].name,
                    objects[myObj].workflowId,
                    objects[myObj].conclusion,
                    objects[myObj].event,
                    objects[myObj].runTimeMinutes + ' min'
                ])
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'Storage') {
            const headers = ['Organization', 'Plan', 'Cycle Days Left', 'Total Space', 'Consumed', 'Remaining', 'Remaining %']
            const tableData = [objects]
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10 }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else if (this.objectType === 'SetupSummary') {
            const headers = ['Component', 'Status']
            const tableData = []
            
            // Convert array of arrays to table data
            for (const row of objects) {
                tableData.push(row)
            }
            
            // Calculate column widths for responsive design
            const layout = { maxWidth: process.stdout.columns - 10, minWidths: [30, 40] }
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const maxWidth = colWidths[index]
                    return this.truncateWithEllipsis(String(cell), maxWidth)
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        } else {
            // Default table layout with responsive sizing
            const layout = this.getResponsiveLayout('default')
            const tableData = []
            const headers = layout.columns
            
            for (const myObj in objects) {
                tableData.push([
                    objects[myObj].name || 'Unknown',
                    this.cleanDescription(objects[myObj].description)
                ])
            }
            
            // Calculate optimal column widths
            const colWidths = this.calculateColumnWidths(tableData, headers, layout)
            
            // Format the data for display
            const formattedData = tableData.map(row => {
                return row.map((cell, index) => {
                    const columnName = headers[index]
                    const maxWidth = colWidths[index]
                    
                    if (columnName === 'Description') {
                        return this.wrapText(cell, maxWidth)
                    } else {
                        return this.truncateWithEllipsis(cell, maxWidth)
                    }
                })
            })
            
            // Prepare final table data with headers
            const finalTableData = [headers, ...formattedData]
            
            // Create table configuration
            const config = {
                border: getBorderCharacters('ramac'),
                columns: colWidths.map(width => ({ width })),
                drawHorizontalLine: (lineIndex, rowCount) => {
                    return true // Draw horizontal line after every row
                }
            }
            
            // Output the table
            console.log(createTable(finalTableData, config))
        }
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output a CSV file to this.env.outputDir containing all object metadata
    outputCSV(objects) {
        const fileName = 'Mr_' + this.objectType + '.csv'
        const myFile = this.env.outputDir + '/' + fileName
        const csvParser = new Parser()
        try {
            const csv = csvParser.parse(objects)
            this.fileSystem.saveTextOrBlobFile(myFile, csv)
            console.log(`SUCCESS: wrote [${this.objectType}] objects to [${myFile}]`)
            return [true, {status_code: 200, status_msg: `wrote [${this.objectType}] objects to [${myFile}]`}, null]
        } catch (err) {
            console.error(`ERROR: Unable to write [${this.objectType}] objects to [${myFile}] due to [${err}]`)
            return [false, {}, err]
        }
    }

    // NOTE: Not exterally facing doesn't require JSDoc signture
    // Purpose: Output an XLSX file to this.env.outputDir containing all object metadata
    outputXLS(objects) {
        console.log('NOTICE: XLSX output is presently disabled, a future version will reenable it.')
        return [false, {status_code: 501, status_msg: 'ERROR: XLSX output is presently disabled'}, null]
        // NOTE: 
        // const fileName = 'Mr_' + this.objectType + '.xlsx'
        // const myFile = this.env.outputDir + '/' + fileName
        // try {
        //     const mySheet = XLSX.utils.json_to_sheet(objects)
        //     const myWorkbook = XLSX.utils.book_new()
        //     XLSX.utils.book_append_sheet(myWorkbook, mySheet, this.objectType)
        //     XLSX.writeFile(myWorkbook, myFile)
        //     return [true, null]
        // } catch (err) {
        //     return [false, err]
        // }
    }

    /**
     * @function splashScreen
     * @description print a splash screen with using name as the big title, description as the subtitle and a version declaration
     * @param {String} name Used for the big title on the splash screen.
     * @param {String} description Forms the subtitle on the splash screen.
     * @param {String} version Defines the version number on the splash screen.
     */
     splashScreen (name, description, version) {
        const logoConfig = {
            name: name,
            lineChars: 10,
            padding: 3,
            margin: 3,
            borderColor: 'bold-gray',
            logoColor: 'bold-orange',
            textColor: 'orange',
        }
        // Print out the splash screen
        console.clear()
        console.log(
            logo(logoConfig)
            .emptyLine()
            .right(version)
            .emptyLine()
            .center(description)
            .render()
        )
    }

    /**
     * @function printLine
     * @description print line for separation in various steps
     */
    printLine () {
        const line = '-'.repeat(process.stdout.columns)
        console.log(line)
    }
}

export default CLIOutput