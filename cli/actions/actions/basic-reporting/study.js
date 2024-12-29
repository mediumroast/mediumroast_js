const mrMarkdownBuilder = require('mr_markdown_builder')
const { createTableOfCompanies } = require('./companies.js')

// Globals
const UNCAFFINATED = `${mrMarkdownBuilder.h1('Notice')}Your study hasn't been analyzed by Mediumroast's Caffeine Machine Intelligence service yet. Please reach out to your Mediumroast team via ${mrMarkdownBuilder.link('Discord', 'https://discord.gg/ebM4Cf8meK')} or email us at ${mrMarkdownBuilder.link('help@mediumroast.io', 'mailto:help@mediumroast.io')} to arrange for onboarding, preparation and caffinating your study.`

const NO_TOP_INSIGHTS = `There are no insights for this study. This means for the Interactions collected for this study, there are no insights that are considered to be of high importance. If you would like to learn more about how to improve the quality of the insights for this study, please reach out to your Mediumroast team via ${mrMarkdownBuilder.link('Discord', 'https://discord.gg/ebM4Cf8meK')} or email us at ${mrMarkdownBuilder.link('hello@mediumroast.io', 'mailto:hello@mediumroast.io')}.`

const NO_COMPANY_INSIGHTS = `There are no top insights for this company due to either an insufficient number of collected Interactions or more generically none of the thresholds triggering an important insight were met. If you would like to learn more about improving insights quality and output for this company, please reach out to your Mediumroast team via ${mrMarkdownBuilder.link('Discord', 'https://discord.gg/ebM4Cf8meK')} or email us at ${mrMarkdownBuilder.link('hello@mediumroast.io', 'mailto:hello@mediumroast.io')}.`

function _checkCaffinated (study) {
    if (study.status === 0) {
        return [false, UNCAFFINATED]
    }
    return [true, null]
}

function _getLargestKey (sourceData) {
    return Object.keys(sourceData).reduce((a, b) => sourceData[a].length > sourceData[b].length ? a : b);
}

function _filterTopInsights (companyData, topCount=5) {
    // Define the topCount interactions report data
    const reportData = {};

    // Count occurrences in targets
    for (const company in companyData) {
        if (companyData.hasOwnProperty(company)) {
            const items = companyData[company];
            const interactionCountInTargets = {};

            for (const key in items) {
                if (items.hasOwnProperty(key)) {
                    const item = items[key];
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

            // Get topCount interactions
            const topInteractions = Object.entries(interactionCountInTargets)
                .sort((a, b) => b[1] - a[1])
                .slice(0, topCount)
                .map(entry => entry[0]);

            // Gather insights for topCount interactions
            reportData[company] = {};
            for (const key in items) {
                if (items.hasOwnProperty(key)) {
                    const item = items[key];
                    const interaction = item.source_interaction;

                    if (topInteractions.includes(interaction)) {
                        const avgSimilarityScore = Object.values(item.targets).reduce((a, b) => a + b, 0) / Object.values(item.targets).length;
                        if (!reportData[company][interaction]) {
                            reportData[company][interaction] = [];
                        }
                        reportData[company][interaction].push({
                            insight: item.insight,
                            type: item.type,
                            count: item.count,
                            avgSimilarityScore: avgSimilarityScore,
                            excerpts: item.excerpts
                        });
                    }
                }
            }

            // Sort report data by Count in descending order
            for (const interaction in reportData[company]) {
                if (reportData[company].hasOwnProperty(interaction)) {
                    reportData[company][interaction].sort((a, b) => b.count - a.count);
                }
            }
        }
    }

    return reportData;
}

async function _getTopInsights(study, topCount=5) {
    //  Define the top five insights documents
    let topInsightsDoc = ""

    // Check if sourceTopics and companies are not empty
    if (!study.sourceTopics || Object.keys(study.sourceTopics).length === 0) {
        return NO_TOP_INSIGHTS;
    }
    if (!study.companies || Object.keys(study.companies).length === 0) {
        return NO_TOP_INSIGHTS;
    }

    // Get the largest key from sourceData
    const insightsLargestKey = _getLargestKey(study.sourceTopics);
    const companiesInsightsData = study.sourceTopics[insightsLargestKey];

    // Get the largest key from companies
    const companiesLargestKey = _getLargestKey(study.companies);
    const totalCompanies = study.companies[companiesLargestKey].included_companies.length;

    // largestKey is an ISO date time stamp that looks like this: 1733856213.4864123. We need to convert it to a human readable date time stamp
    const date = new Date(insightsLargestKey * 1000);

    // Create the introduction to the top 5 insights
    topInsightsDoc += mrMarkdownBuilder.h2(`Top Source Insights as of \`${date.toDateString()}\``)
    topInsightsDoc += `The following insights are automatically generated by Mediumroast's Caffeine Machine Intelligence service, and derived from Interactions associated to the Companies in the study. This analysis means to help you understand the most important insights for the \`${totalCompanies}\` Companies in the study. For brevity only the first two insights are reported. A more complete equivalent report, in Microsoft Excel, can also be generated by running the command \`\`\`mrcli study --report=${study.name}\`\`\`.\n`

    // Filter the top insights
    const topInsights = _filterTopInsights(companiesInsightsData, topCount);

    // Iterate over the top insights and create a list of insights we should start with the parent company as a third level header, then the source interaction as a fourth level header, then the insight as a list item below the source interaction

    for (const company of Object.keys(topInsights)) {
        topInsightsDoc += mrMarkdownBuilder.h3(company)
        for (const interaction of Object.keys(topInsights[company])) {
            topInsightsDoc += mrMarkdownBuilder.h4(interaction)
            for (const insight of topInsights[company][interaction].slice(0, 2)) {
                topInsightsDoc += `${mrMarkdownBuilder.b('Insight:')} ${insight.insight} ${mrMarkdownBuilder.cr()}`
                const insightDetails = [
                    `${mrMarkdownBuilder.b('Type:')} ${insight.type}`,
                    `${mrMarkdownBuilder.b('Average Similarity Score:')} ${insight.avgSimilarityScore.toFixed(3)}`,
                    `${mrMarkdownBuilder.b('Excerpts:')} ${insight.excerpts}`
                ]
                topInsightsDoc += mrMarkdownBuilder.collapsible (
                    'Insight Details, click to expand',
                    mrMarkdownBuilder.ul(insightDetails)
                )
                topInsightsDoc += mrMarkdownBuilder.cr()
            }
        }
        topInsightsDoc += mrMarkdownBuilder.hr()
    }

    return topInsightsDoc
}

async function createStudyReport (studies, companies, reports) {
    let studyReports = []
    const suffix = '.md'
    const prefix = reports.study
    for (let study of studies) {
        // ---- BEGIN Study Introduction ----
        // Get the name of the study and remove spaces, commas, periods, question marks, and exclamation points
        const studyFileName = study.name.replace(/[\s,.\?!]/g, '')
        // Add company name with the logo image
        // Call the h1 method from the headers module
        let studyFile = `[${mrMarkdownBuilder.link('Back to Study Directory', './README.md')}]\n`
        studyFile += mrMarkdownBuilder.hr()
        studyFile += mrMarkdownBuilder.h1(`${study.name} Study`)
        // Add a line break
        studyFile += mrMarkdownBuilder.cr()
        // Add the study description
        studyFile += `${mrMarkdownBuilder.b('Description:')} ${study.description} ${mrMarkdownBuilder.cr()}`
        // Add a horizontal rule
        studyFile += mrMarkdownBuilder.hr()
        // Add a line break
        studyFile += mrMarkdownBuilder.cr()
        // ---- END Study Introduction ----

        // ---- Check if the study is caffinated ----
        const [caffinated, caffinatedMessage] = _checkCaffinated(study)
        if (caffinated === true) {
            // ---- BEGIN Top Insights ----
            // Get the top insights
            const topInsights = await _getTopInsights(study)
            studyFile += topInsights
            // ---- END Top Insights ----
        } else {
            studyFile += caffinatedMessage
        }

        // ---- BEGIN Footer ----
        // Add a line break
        studyFile += mrMarkdownBuilder.cr()

        // Add a horizontal rule <-- Not needed in the footer
        // studyFile += mrMarkdownBuilder.hr()

        // Add the creation date
        studyFile += `[ ${mrMarkdownBuilder.b('Created:')} ${study.creation_date} by ${study.creator_name} | ${mrMarkdownBuilder.b('Modified:')} ${study.modification_date} ]`

        // Return the file content   
        studyReports.push({
            name: study.name,
            path: `${prefix}${studyFileName}${suffix}`,
            content: studyFile
        })
        // ---- END Footer ----
    }
    return studyReports
}

module.exports = {
    createStudyReport
}