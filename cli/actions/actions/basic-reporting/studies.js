const mrMarkdownBuilder = require('mr_markdown_builder')

// Globals
const NO_STUDIES = `${mrMarkdownBuilder.h1('Notice')}There are no studies present in your Mediumroast for GitHub repository. Please initialize the \`Foundation\` study using \`mrcli study --init_foundation\` command.  After you've initialized the \`Foundation\` study please reach out to your Mediumroast team via ${mrMarkdownBuilder.link('Discord', 'https://discord.gg/ebM4Cf8meK')} or email us at ${mrMarkdownBuilder.link('hello@mediumroast.io', 'mailto:hello@mediumroast.io')}.   ${mrMarkdownBuilder.cr()}${mrMarkdownBuilder.cr()}`

function createStudiesReport (studies) {
    let readme = `[${mrMarkdownBuilder.link('Back to main README', '../README.md')}]\n`
    readme += mrMarkdownBuilder.hr()
    readme += mrMarkdownBuilder.h1('Introduction')
    readme += `There are currently \`${studies.length}\` study or studies in the repository. The table below lists all available studies and some of their characteristics. Click on the study name to view the study's profile.`

    // Should we not have any studies then we should return the NO_STUDIES message
    if (studies.length === 0) {
        readme += NO_STUDIES
        return readme
    }

    readme += mrMarkdownBuilder.h1('Table of Studies')
    // Create the table header
    const tableHeader = mrMarkdownBuilder.tableHeader(['Study Name', 'Related GitHub Project', 'Total Associated Companies', 'Caffinated'])
    // Create the table rows
    const tableRows = studies.map((study) => {
        // Get the most recent key from the companies object
        const mostRecentKey = Object.keys(study.companies).sort().pop();
        const includedCompaniesLength = study.companies[mostRecentKey].included_companies.length;
 
        const studyRow = [
            mrMarkdownBuilder.link(study.name, `./${encodeURI(study.name.replace(/[\s,.\?!]/g, ''))}.md`),
            study.project,
            includedCompaniesLength,
            study.status === 1 ? "Yes" : "No"
        ]
        return studyRow
    })
    // Create the table
    const studyTable = tableHeader + "\n" + mrMarkdownBuilder.tableRows(tableRows)
    // Create the README.md file
    readme += studyTable
    // Return the file content
    return readme
}

module.exports = {
    createStudiesReport
}