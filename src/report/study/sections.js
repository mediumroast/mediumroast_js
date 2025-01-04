import { getLargestKey } from "./helpers.js";
import Transforms from "./transforms.js";

class Sections {

    static prioritizeCompanies(companiesData, workbook) {
        // Setup names for the report section
        const reportName = 'All Companies';
        const reportTitle = 'Prioritized Companies Report';

        // Transform the data
        const combinedCompanies = Transforms.extractForPriorityCompanyReport(
            companiesData
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

                worksheet.getCell(`C${rowIndex}`).value = companyName;
                worksheet.getCell(`D${rowIndex}`).value = company.contenderType;
                worksheet.getCell(`E${rowIndex}`).value = company.contenderDirection;
                worksheet.getCell(`F${rowIndex}`).value = company.countAboveThreshold;
                worksheet.getCell(`G${rowIndex}`).value = company.countBelowThreshold;

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
        worksheet.getColumn('F').width = 20;
        worksheet.getColumn('G').width = 20;

        // Wrap text in columns
        worksheet.getColumn('C').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
        worksheet.getColumn('E').alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

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

    static topInsights(company, workbook, sectionName=null) {
        // Build a lookup table for the type field
        const typeToNameMap = {
            'pm': 'proto-requirement',
            'analyst': 'market insight',
        }

        // Setup names for the report section
        const reportName = sectionName;
        const reportTitle = `Top Insights Report for ${sectionName}`;

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