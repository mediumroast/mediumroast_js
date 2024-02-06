// Load the modules
const { readObjects, readBranches, readWorkflows, saveReports } = require('./github.js')
const { createCompaniesReport, createCompanyReports, createMainReport } = require('./reports.js')


// Create the run function that creates the reports
async function run () {
    // Define inputs
    const inputs = {
        companies: await readObjects('/Companies/Companies.json'),
        interactions: await readObjects('/Interactions/Interactions.json'),
        branches: await readBranches(),
        workflows: await readWorkflows()
    }

    // If there are no companies then return
    if (inputs.companies.length === 0) {
        return
    }

    // Define reports
    const reports = {
        companies: `Companies/README.md`,
        company: `Companies/`,
        main: `README.md`,
    }

    // Create the company files
    const companyFiles = await createCompanyReports(inputs.companies, inputs.interactions, reports)
    // Create the companies file
    const companiesFile = createCompaniesReport(inputs.companies)
    // Create the main file
    const mainFile = createMainReport(inputs)
    // Create the reports array
    const markdownReports = [
        {
            name: 'Companies',
            path: reports.companies,
            content: companiesFile
        },
        {
            name: 'Main',
            path: reports.main,
            content: mainFile
        },
        ...companyFiles
    ]

    // Write the reports
    await saveReports(markdownReports, inputs)
}

run()