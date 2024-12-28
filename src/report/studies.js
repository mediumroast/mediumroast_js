/**
 * Create reports for studies
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file studies.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

import ExcelJS from 'exceljs'
import Utilities from './helpers.js'

class BaseStudyReport {
    constructor(studyName, study, env) {
        this.util = new Utilities(env)
        this.study = study
        this.studyName = studyName
        this.env = env
        this.baseDir = this.env.outputDir
        this.workDir = this.env.workDir
        this.baseName = studyName.replace(/ /g,"_")
    }
}

class SourceInsights extends BaseStudyReport {
    constructor(studyName, study, env) {
        super(studyName, study, env)
        this.sourceData = this.study.sourceTopics
    }

    async generateTop5InsightsReport() {
        // Create the file name
        const fileName = `${this.baseDir}/${this.baseName}_source_insights.xlsx`
        // Get the largest key from sourceData
        const largestKey = Object.keys(this.sourceData).reduce((a, b) => this.sourceData[a].length > this.sourceData[b].length ? a : b);
        const companiesData = this.sourceData[largestKey];

        // Create workbook
        const workbook = new ExcelJS.Workbook();

        // Iterate through each company within the largest key
        for (const companyName in companiesData) {
            if (companiesData.hasOwnProperty(companyName)) {
                const companyData = companiesData[companyName];

                // Count occurrences in targets
                const interactionCountInTargets = {};
                for (const key in companyData) {
                    if (companyData.hasOwnProperty(key)) {
                        const item = companyData[key];
                        const interaction = item.source_interaction;

                        for (const target in item.targets) {
                            if (item.targets.hasOwnProperty(target)) {
                                if (!interactionCountInTargets[interaction]) {
                                    interactionCountInTargets[interaction] = 0;
                                }
                                interactionCountInTargets[interaction]++;
                            }
                        }
                    }
                }

                // Get top 5 interactions
                const top5Interactions = Object.entries(interactionCountInTargets)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(entry => entry[0]);

                // Gather insights for top 5 interactions
                const reportData = [];
                for (const key in companyData) {
                    if (companyData.hasOwnProperty(key)) {
                        const item = companyData[key];
                        const interaction = item.source_interaction;

                        if (top5Interactions.includes(interaction)) {
                            const avgSimilarityScore = Object.values(item.targets).reduce((a, b) => a + b, 0) / Object.values(item.targets).length;
                            reportData.push({
                                insight: item.insight,
                                source_interaction: interaction,
                                type: item.type,
                                count: item.count,
                                avgSimilarityScore: avgSimilarityScore,
                                excerpts: item.excerpts
                            });
                        }
                    }
                }

                // Sort report data by Count in descending order
                reportData.sort((a, b) => b.count - a.count);

                // Create worksheet for the company
                const worksheet = workbook.addWorksheet(companyName);

                // Add padding rows
                worksheet.addRow([]);
                worksheet.addRow([]);

                // Add title
                worksheet.mergeCells('C3:H3');
                const titleRow = worksheet.getCell('C3');
                titleRow.value = `Top Insights Report for ${companyName}`;
                titleRow.font = { size: 16, bold: true };
                titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

                // Increase the height of the row containing the title
                worksheet.getRow(3).height = 30;

                // Add headers starting from C4
                worksheet.getCell('C4').value = 'Source Interaction';
                worksheet.getCell('D4').value = 'Interaction Frequency';
                worksheet.getCell('E4').value = 'Insight Text';
                worksheet.getCell('F4').value = 'Insight Type';
                worksheet.getCell('G4').value = 'Insight Avg. Similarity Score';
                worksheet.getCell('H4').value = 'Insight Excerpts';

                // Apply styles to headers
                ['C4', 'D4', 'E4', 'F4', 'G4', 'H4'].forEach(cell => {
                    worksheet.getCell(cell).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    worksheet.getCell(cell).alignment = { vertical: 'top', horizontal: 'left' };
                    worksheet.getCell(cell).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF000000' }
                    };
                    worksheet.getCell(cell).border = {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' }
                    };
                });

                // Freeze row 4
                worksheet.views = [
                    { state: 'frozen', ySplit: 4 }
                ];

                // Add data starting from C5
                reportData.forEach((data, index) => {
                    const rowIndex = index + 5;
                    const fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFD3D3D3'; // Alternate row colors

                    worksheet.getCell(`C${rowIndex}`).value = data.source_interaction;
                    worksheet.getCell(`D${rowIndex}`).value = data.count;
                    worksheet.getCell(`E${rowIndex}`).value = data.insight;
                    worksheet.getCell(`F${rowIndex}`).value = data.type;
                    worksheet.getCell(`G${rowIndex}`).value = data.avgSimilarityScore;
                    worksheet.getCell(`H${rowIndex}`).value = data.excerpts;

                    // Apply styles to data cells
                    ['C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
                        const cell = worksheet.getCell(`${col}${rowIndex}`);
                        cell.font = { color: { argb: 'FF000000' } };
                        cell.alignment = { vertical: 'top', horizontal: 'left' };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: fillColor }
                        };
                        cell.border = {
                            bottom: { style: 'thin' }
                        };
                    });
                });

                // Set column widths
                worksheet.getColumn('C').width = 50;
                worksheet.getColumn('D').width = 30;
                worksheet.getColumn('E').width = 70;
                worksheet.getColumn('F').width = 30;
                worksheet.getColumn('G').width = 30;
                worksheet.getColumn('H').width = 70;

                // Wrap text in columns C (Insight) and H (Excerpts)
                worksheet.getColumn('C').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                worksheet.getColumn('E').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                worksheet.getColumn('H').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

                // Apply autoFilter to the range
                worksheet.autoFilter = {
                    from: 'C4',
                    to: 'H4'
                };

                // Apply bolded outside borders
                const lastRow = worksheet.lastRow.number;
                ['C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
                    worksheet.getCell(`${col}4`).border = {
                        top: { style: 'thick' },
                        left: { style: 'thick' },
                        bottom: { style: 'thick' },
                        right: { style: 'thick' }
                    };
                });

                // Apply left and right borders to the entire table
                for (let rowIndex = 5; rowIndex <= lastRow; rowIndex++) {
                    worksheet.getCell(`C${rowIndex}`).border = {
                        left: { style: 'thick' },
                        bottom: { style: 'thin' }
                    };
                    worksheet.getCell(`H${rowIndex}`).border = {
                        right: { style: 'thick' },
                        bottom: { style: 'thin' }
                    };
                }

                // Apply bottom borders to the last row
                ['C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
                    worksheet.getCell(`${col}${lastRow}`).border = {
                        bottom: { style: 'thick' },
                    };
                });

                // Set the left and bottom border of the last cell on the left
                worksheet.getCell(`C${lastRow}`).border = {
                    left: { style: 'thick' },
                    bottom: { style: 'thick' }
                };

                // Set the right and bottom border of the last cell on the right
                worksheet.getCell(`H${lastRow}`).border = {
                    right: { style: 'thick' },
                    bottom: { style: 'thick' }
                };

                // Extend the outside border to the title cell
                worksheet.getCell('C3').border = {
                    top: { style: 'thick' },
                    left: { style: 'thick' },
                    right: { style: 'thick' }
                };
                worksheet.getCell('H3').border = {
                    top: { style: 'thick' },
                    right: { style: 'thick' },
                    left: { style: 'thick' }
                };
            }
        }

        // Write to file
        const writeResult = await workbook.xlsx.writeFile(fileName);
        return [true, {status_code: 200, status_msg: `Successfully wrote file to ${fileName}`}, writeResult];
    }
}

export { SourceInsights }