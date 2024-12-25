const mrMarkdownBuilder = require('mr_markdown_builder')

// Globals
const MAPS_WARNING = `**Notice:** If you are using Safari and had previously disabled \`Prevent cross-site tracking\` feature in the \`Privacy tab\` in Safari's preferences, you can now reenable it since this bug has been fixed by GitHub.${mrMarkdownBuilder.cr()}${mrMarkdownBuilder.cr()}`

function createCompaniesMap (companies) {
    // Filter out companies with unknown latitude or longitude
    companies = companies.filter((company) => company.latitude !== 'Unknown' && company.longitude !== 'Unknown')
    // Create the map
    let map = mrMarkdownBuilder.h1('Company Locations')
    map += MAPS_WARNING
    map += mrMarkdownBuilder.geojson({
        type: 'FeatureCollection',
        features: companies.map((company) => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [company.longitude, company.latitude]
                },
                properties: {
                    name: company.name,
                    description: company.description,
                    role: company.role,
                    url: company.url
                }
            }
        })
    })
    // return the map
    return mrMarkdownBuilder.cr() + map
}

function createTableOfCompanies (companies) {
    // Create the table header
    const tableHeader = mrMarkdownBuilder.tableHeader(['Company Name', 'Company Type', 'Company Role', 'Company Region', 'Total Interactions'])
    // Count the total interactions for each company by looking at the number of keys in linked_interactions
    companies.forEach((company) => {
        company.total_interactions = Object.keys(company.linked_interactions).length
    })

    // Create the table rows
    const tableRows = companies.map((company) => {
        const companyRow = [
            mrMarkdownBuilder.link(company.name, `./${encodeURI(company.name.replace(/[\s,.\?!]/g, ''))}.md`),
            company.company_type,
            company.role,
            company.region,
            company.total_interactions
        ]
        return companyRow
    })
    // Create the table
    const companyTable = tableHeader + "\n" + mrMarkdownBuilder.tableRows(tableRows)
    // Return the table
    return companyTable
}

function createCompaniesReport (companies) {
    let readme = `[${mrMarkdownBuilder.link('Back to main README', '../README.md')}]\n`
    readme += mrMarkdownBuilder.hr()
    readme += mrMarkdownBuilder.h1('Introduction')
    readme += `There are currently \`${companies.length}\` companies in the repository. The table below lists all available companies and some of their firmographics. Click on the company name to view the company's profile.  Below the table is a map of all companies in the repository.  Click on a company's marker to view additional company information in context.`
    readme += mrMarkdownBuilder.h1('Table of Companies')
    // // Create the table header
    // const tableHeader = mrMarkdownBuilder.tableHeader(['Company Name', 'Company Type', 'Company Role', 'Company Region'])
    // // Create the table rows
    // const tableRows = companies.map((company) => {
    //     const companyRow = [
    //         mrMarkdownBuilder.link(company.name, `./${encodeURI(company.name.replace(/[\s,.\?!]/g, ''))}.md`),
    //         company.company_type,
    //         company.role,
    //         company.region
    //     ]
    //     return companyRow
    // })
    // // Create the table
    // const companyTable = tableHeader + "\n" + mrMarkdownBuilder.tableRows(tableRows)
    const companyTable = createTableOfCompanies(companies)
    // Create the README.md file
    readme += companyTable
    // Add a line break
    readme += mrMarkdownBuilder.cr() + mrMarkdownBuilder.hr()
    // Call the createMap function
    readme += mrMarkdownBuilder.cr() + createCompaniesMap(companies)
    // Return the file content
    return readme

}

module.exports = {
    createCompaniesReport,
    createTableOfCompanies
}