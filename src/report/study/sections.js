import Transforms from "./transforms.js";

class Sections {

    static mostLeastSimilarInsights(processData, workbook, companies) {
        // Build a lookup table for the type field
        const typeToNameMap = {
            'pm': 'proto-requirement',
            'analyst': 'market insight',
        }

        // Setup names for the reports
        const reportName = 'Insight uniqueness';
        const reportTitle = 'Insight uniqueness report';

        // Transform the data
        const mostLeastSimilarInsights = Transforms.extractForMostLeastSimilarInsightsReport(
            processData, companies
        );

        // Create worksheet for the most similar insights
        const worksheet = workbook.addWorksheet(reportName);

        // Add padding rows
        worksheet.addRow([]);
        worksheet.addRow([]);

        // Add title
        worksheet.mergeCells('C3:L3');
        const mostSimilarTitleRow = worksheet.getCell('C3');
        mostSimilarTitleRow.value = reportTitle;
        mostSimilarTitleRow.font = { size: 16, bold: true };
        mostSimilarTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Increase the height of the row containing the title
        worksheet.getRow(3).height = 30;

        // Add headers starting from C4
        worksheet.getCell('C4').value = 'Insight';
        worksheet.getCell('D4').value = 'Source interaction';
        worksheet.getCell('E4').value = 'Interaction excerpts';
        worksheet.getCell('F4').value = 'Type';
        worksheet.getCell('G4').value = 'Uniqueness';
        worksheet.getCell('H4').value = 'Rank';
        worksheet.getCell('I4').value = 'Most important interaction';
        worksheet.getCell('J4').value = 'Least important interaction';
        worksheet.getCell('K4').value = 'Most important company';
        worksheet.getCell('L4').value = 'Least important company';

        // Apply styles to headers
        ['C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4', 'K4', 'L4'].forEach(cell => {
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

        // Set column widths
        worksheet.getColumn('C').width = 70; // Insight text
        worksheet.getColumn('D').width = 50; // Interaction name
        worksheet.getColumn('E').width = 70; // Excerpts
        worksheet.getColumn('F').width = 20; // Insight type
        worksheet.getColumn('G').width = 20; // Uniqueness
        worksheet.getColumn('H').width = 20; // Rank
        worksheet.getColumn('I').width = 40; // Most similar interaction
        worksheet.getColumn('J').width = 40; // Least similar interaction
        worksheet.getColumn('K').width = 30; // Most similar company
        worksheet.getColumn('L').width = 30; // Least similar company


        // Add data starting from C5
        mostLeastSimilarInsights.forEach((data, index) => {
            const rowIndex = index + 5;
            const fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFD3D3D3'; // Alternate row colors

            worksheet.getCell(`C${rowIndex}`).value = data.insight;
            worksheet.getCell(`D${rowIndex}`).value = data.source_interaction;
            worksheet.getCell(`E${rowIndex}`).value = data.excerpts;
            worksheet.getCell(`F${rowIndex}`).value = typeToNameMap[data.type];
            worksheet.getCell(`G${rowIndex}`).value = data.uniqueness;
            worksheet.getCell(`H${rowIndex}`).value = data.rank;
            worksheet.getCell(`I${rowIndex}`).value = data.mostSimilarInteraction;
            worksheet.getCell(`J${rowIndex}`).value = data.leastSimilarInteraction;
            worksheet.getCell(`K${rowIndex}`).value = data.mostSimilarCompany;
            worksheet.getCell(`L${rowIndex}`).value = data.leastSimilarCompany;

            // Apply styles to data cells
            ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
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

        // Wrap text in columns C (Insight) and E (Excerpts)
        worksheet.getColumn('C').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('D').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('E').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('I').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('J').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('K').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('L').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

        // Apply autoFilter to the range
        worksheet.autoFilter = {
            from: 'C4',
            to: 'H4'
        };

        // Apply bolded outside borders
        const lastRow = worksheet.lastRow.number;
        ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
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
            worksheet.getCell(`L${rowIndex}`).border = {
                right: { style: 'thick' },
                bottom: { style: 'thin' }
            };
        }

        // Apply bottom borders to the last row
        ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
            worksheet.getCell(`${col}${lastRow}`).border = {
                bottom: { style: 'thick' }
            };
        });

        // Set the left and bottom border of the last cell on the left
        worksheet.getCell(`C${lastRow}`).border = {
            left: { style: 'thick' },
            bottom: { style: 'thick' }
        };

        // Set the right and bottom border of the last cell on the right
        worksheet.getCell(`L${lastRow}`).border = {
            right: { style: 'thick' },
            bottom: { style: 'thick' }
        };

        // Extend the outside border to the title cell
        worksheet.getCell('C3').border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            right: { style: 'thick' }
        };
        worksheet.getCell('L3').border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            right: { style: 'thick' }
        };

        return workbook;

    }

    static prioritizeCompanies(companiesData, workbook, sourceData) {
        // Setup names for the report section
        const reportName = 'All Contenders';
        const reportTitle = 'Contenders summary report';

        // Transform the data
        const combinedCompanies = Transforms.extractForPriorityCompanyReport(
            companiesData,
            sourceData
        );

        const worksheet = workbook.addWorksheet(reportName);

        // Add padding rows
        worksheet.addRow([]);
        worksheet.addRow([]);

        // Add title
        worksheet.mergeCells('C3:G3');
        const titleRow = worksheet.getCell('C3');
        titleRow.value = reportTitle;
        titleRow.font = { size: 16, bold: true };
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Increase the height of the row containing the title
        worksheet.getRow(3).height = 30;

        // Add headers starting from C4
        worksheet.getCell('C4').value = 'Company name';
        worksheet.getCell('D4').value = 'Contender type';
        worksheet.getCell('E4').value = 'Contender direction';
        worksheet.getCell('F4').value = 'Most important interaction';
        worksheet.getCell('G4').value = 'Least important interaction';

        // Apply styles to headers
        ['C4', 'D4', 'E4', 'F4', 'G4'].forEach(cell => {
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
        let rowIndex = 5;
        for (const companyName in combinedCompanies) {
            if (combinedCompanies.hasOwnProperty(companyName)) {
                const company = combinedCompanies[companyName];

                const topInteractionCellText = company.topInteraction ? 
                    `${company.topInteraction}\n\n Copy and run to obtain interaction report -> \n\n mrcli i --report=\"${company.topInteraction}\"` : 
                    'Top interaction not available';

                const bottomInteractionCellText = company.bottomInteraction ? 
                    `${company.bottomInteraction}\n\n Copy and run to obtain interaction report -> \n\n mrcli i --report=\"${company.bottomInteraction}\"` : 
                    'Bottom interaction not available';

                worksheet.getCell(`C${rowIndex}`).value = companyName;
                worksheet.getCell(`D${rowIndex}`).value = company.contenderType;
                worksheet.getCell(`E${rowIndex}`).value = company.contenderDirection;
                worksheet.getCell(`F${rowIndex}`).value = topInteractionCellText;
                worksheet.getCell(`G${rowIndex}`).value = bottomInteractionCellText;

                // Apply styles to data cells
                ['C', 'D', 'E', 'F', 'G'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowIndex}`);
                    cell.font = { color: { argb: 'FF000000' } };
                    cell.alignment = { vertical: 'top', horizontal: 'left' };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: rowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFD3D3D3' }
                    };
                    cell.border = {
                        bottom: { style: 'thin' }
                    };
                });

                rowIndex++;
            }
        }

        // Set column widths
        worksheet.getColumn('C').width = 30;
        worksheet.getColumn('D').width = 20;
        worksheet.getColumn('E').width = 20;
        worksheet.getColumn('F').width = 50;
        worksheet.getColumn('G').width = 50;

        // Wrap text in columns
        worksheet.getColumn('C').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('E').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('F').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('G').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

        // Apply autoFilter to the range
        worksheet.autoFilter = {
            from: 'C4',
            to: 'G4'
        };

        // Apply bolded outside borders
        const lastRow = worksheet.lastRow.number;
        ['C', 'D', 'E', 'F', 'G'].forEach(col => {
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
            worksheet.getCell(`G${rowIndex}`).border = {
                right: { style: 'thick' },
                bottom: { style: 'thin' }
            };
        }

        // Apply bottom borders to the last row
        ['C', 'D', 'E', 'F', 'G'].forEach(col => {
            worksheet.getCell(`${col}${lastRow}`).border = {
                bottom: { style: 'thick' }
            };
        });

        // Set the left and bottom border of the last cell on the left
        worksheet.getCell(`C${lastRow}`).border = {
            left: { style: 'thick' },
            bottom: { style: 'thick' }
        };

        // Set the right and bottom border of the last cell on the right
        worksheet.getCell(`G${lastRow}`).border = {
            right: { style: 'thick' },
            bottom: { style: 'thick' }
        };

        // Extend the outside border to the title cell
        worksheet.getCell('C3').border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            right: { style: 'thick' }
        };
        worksheet.getCell('G3').border = {
            top: { style: 'thick' },
            left: { style: 'thick' },
            right: { style: 'thick' }
        };

        return workbook;
    }

    /**
     * @function topInsights
     * @description Generates the top insights section of the report.
     * @param {Object} company - The company data object.
     * @param {Object} workbook - The workbook object to which the section will be added.
     * @param {string} [sectionName=null] - The name of the section. If not provided, a default name will be used.
     * @returns {Object} The updated workbook object with the top insights section added.
     * 
     * @example
     * const workbook = Sections.topInsights(company, workbook, 'Company Name');
     * console.log(`The workbook has been updated with the top insights section.`);
     */

    static topInsights(company, workbook, sectionName) {
        // Build a lookup table for the type field
        const typeToNameMap = {
            'pm': 'proto-requirement',
            'analyst': 'market insight',
        }

        // Setup names for the report section
        // todo: rethink sectionName a bit to handle source company, perhaps it should be an object instead of a string {name: 'Company Name', isSource: true}
        let reportName = sectionName.source ? `Source insights - ${sectionName.name}` : sectionName.name;
        // If the length of reportName is greater than 31 characters, truncate it and append '...'
        if (reportName.length > 31) {
            reportName = reportName.substring(0, 27) + '...';
        }
        const reportTitle = `Top Insights Report for ${sectionName.name}`;

        // Transform the data
        const reportData = Transforms.extractForTopInsightsReport(company);

        // Create worksheet for the company
        const worksheet = workbook.addWorksheet(reportName);

        // Add padding rows
        worksheet.addRow([]);
        worksheet.addRow([]);

        // Add title
        worksheet.mergeCells('C3:H3');
        const titleRow = worksheet.getCell('C3');
        titleRow.value = reportTitle;
        titleRow.font = { size: 16, bold: true };
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Increase the height of the row containing the title
        worksheet.getRow(3).height = 30;

        // Add headers starting from C4
        worksheet.getCell('C4').value = 'Insight';
        worksheet.getCell('D4').value = 'Source interaction';
        worksheet.getCell('E4').value = 'Interaction excerpts';
        worksheet.getCell('F4').value = 'Type';
        worksheet.getCell('G4').value = 'Priority';
        worksheet.getCell('H4').value = 'Rank';

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

            worksheet.getCell(`C${rowIndex}`).value = data.insight;
            worksheet.getCell(`D${rowIndex}`).value = data.source_interaction;
            worksheet.getCell(`E${rowIndex}`).value = data.excerpts;
            worksheet.getCell(`F${rowIndex}`).value = typeToNameMap[data.type];
            worksheet.getCell(`G${rowIndex}`).value = data.priority;
            worksheet.getCell(`H${rowIndex}`).value = data.rank;

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
        worksheet.getColumn('C').width = 70; // Insight text
        worksheet.getColumn('D').width = 50; // Interaction name
        worksheet.getColumn('E').width = 70; // Excerpts
        worksheet.getColumn('F').width = 30; // Insight type
        worksheet.getColumn('G').width = 30; // Priority
        worksheet.getColumn('H').width = 30; // Rank

        // Wrap text in columns C (Insight) and H (Excerpts)
        worksheet.getColumn('C').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('D').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('E').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

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

        return workbook;
    }

}

export default Sections;