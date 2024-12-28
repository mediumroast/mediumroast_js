// Load the modules
const { readObjects, readBranches, readWorkflows, saveReports } = require('./github.js')
const { createCompaniesReport } = require('./companies.js')
const { createCompanyReport } = require('./company.js')
const { createStudiesReport } = require('./studies.js')
const { createStudyReport } = require('./study.js')
const { createMainReport } = require('./main.js')


// Create the run function that creates the reports
async function run () {
    // Define inputs
    const inputs = {
        companies: await readObjects('/Companies/Companies.json'),
        interactions: await readObjects('/Interactions/Interactions.json'),
        studies: await readObjects('/Studies/Studies.json'),
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
        studies: `Studies/README.md`,
        study: `Studies/`,
        main: `README.md`,
    }

    // Create the company files
    const companyFiles = await createCompanyReport(inputs.companies, inputs.interactions, reports)
    // Create the companies file
    const companiesFile = createCompaniesReport(inputs.companies)
    
    
    // Create the main report
    const mainFile = createMainReport(inputs)

    // Create the study files
    const studyFiles = await createStudyReport(inputs.studies, inputs.companies, reports)
    // Create the studies file
    const studiesFile = await createStudiesReport(inputs.studies)
    
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
        {
            name: 'Studies',
            path: reports.studies,
            content: studiesFile
        },
        ...companyFiles,
        ...studyFiles
    ]

    // Write the reports
    await saveReports(markdownReports, inputs)
}

run()