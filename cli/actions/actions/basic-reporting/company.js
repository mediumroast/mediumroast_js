const mrMarkdownBuilder = require('mr_markdown_builder')
const interactionsBuilder = require('./interactions.js')


// Globals
const MAPS_WARNING = `**Notice:** If you are using Safari and had previously disabled \`Prevent cross-site tracking\` feature in the \`Privacy tab\` in Safari's preferences, you can now reenable it since this bug has been fixed by GitHub.`

async function createBadges(company) {
    // Create a badge for the company role
    const badgesRow = [
        await mrMarkdownBuilder.badge(encodeURIComponent('Role'), company.role),
        await mrMarkdownBuilder.badge(encodeURIComponent('Type'), encodeURIComponent(company.company_type)),
        await mrMarkdownBuilder.badge(encodeURIComponent('Region'), company.region),
        await mrMarkdownBuilder.badge(encodeURIComponent('Creator'), encodeURIComponent(company.creator_name))
    ]
    return "\n" + badgesRow.join(mrMarkdownBuilder.space()) + "\n"
}

function createIndustryList(company) {
    const industryDataList = [
        `${mrMarkdownBuilder.b('Major Group')} ${mrMarkdownBuilder.rightArrow()} ${company.major_group_description} (Code: ${company.major_group_code})`,
        `${mrMarkdownBuilder.b('Industry Group')} ${mrMarkdownBuilder.rightArrow()} ${company.industry_group_description} (Code: ${company.industry_group_code})`,
        `${mrMarkdownBuilder.b('Industry')} ${mrMarkdownBuilder.rightArrow()} ${company.industry} (Code: ${company.industry_code})`
    ]
    // Create a list of industries
    let industryList = `${mrMarkdownBuilder.b('Industry:')} ${company.industry} (Code: ${company.industry_code}) ${mrMarkdownBuilder.cr()}`
    industryList += mrMarkdownBuilder.collapsible(
        `Industry Details, click to expand`, mrMarkdownBuilder.ul(industryDataList)
    )
    return industryList
}

function createCompanyWebLinkList(company) {
    // Create the table rows
    let wikipediaURL
    company.wikipedia_url === 'Unknown' ?
        wikipediaURL = `The Wikipedia URL is ${company.wikipedia_url}` :
        wikipediaURL = mrMarkdownBuilder.link(`Wikipedia for ${company.name}`, company.wikipedia_url)
    let listItems = [

        [wikipediaURL],
        [mrMarkdownBuilder.link(`${company.name} on Google News`, encodeURIComponent(company.google_news_url))],
        [mrMarkdownBuilder.link(`Map for ${company.name}`, encodeURIComponent(company.google_maps_url))],
        [mrMarkdownBuilder.link(`${company.name} Patents`, encodeURIComponent(company.google_patents_url))]
    ]
    // If the company is public then add the public properties
    if (company.company_type === 'Public') {
        const propertyToName = {
            google_finance_url: 'Google Finance',
            recent10k_url: 'Most Recent 10-K Filing',
            recent10q_url: 'Most Recent 10-Q Filing',
            firmographics_url: 'SEC EDGAR Firmographics',
            filings_url: `All Filings for ${company.name}`,
            owner_transactions_url: 'Shareholder Transactions'
        }
        for (const property in [
            'google_finance_url', 'recent10k_url', 'recent10q_url', 'firmographics_url', 'filings_url', 'owner_transactions_url']
        ) {
            if (company[property] !== 'Unknown') { continue }
            listItems.push([mrMarkdownBuilder.link(propertyToName[property], company[property])])
        }
    }
    // Create the table
    return mrMarkdownBuilder.h2('Key Web Links') + "\n" + mrMarkdownBuilder.ul(listItems)
}

function createInteractionList(company, interactions) {
    // Create a list of interactions
    const interactionNames = Object.keys(company.linked_interactions)
    const interactionList = interactionNames.map((interactionName) => {
        // Find the interaction object that matches the interaction name
        const interaction = interactions.find((interaction) => interaction.name === interactionName)
        // Create link internal link to the interaction file    
        const interactionLink = mrMarkdownBuilder.link(interaction.name, `/${encodeURI(interaction.url)}`)
        return interactionLink
    })

    return `${mrMarkdownBuilder.h2('Interactions')} \n ${mrMarkdownBuilder.ul(interactionList)}`
}

function createCompanyMap(company) {
    // Check to see if either the latitude or longitude is "Unknown" and if so return false
    if (company.latitude === 'Unknown' || company.longitude === 'Unknown') {
        return ''
    }
    let geoJsonMarkdown = mrMarkdownBuilder.h2('Location')
    geoJsonMarkdown += MAPS_WARNING + mrMarkdownBuilder.cr() + mrMarkdownBuilder.cr()
    // Create the location JSON
    const geoJson = {
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
    // Add the geojson object to the company file
    geoJsonMarkdown += mrMarkdownBuilder.geojson(geoJson)
    return geoJsonMarkdown
}

async function createTags (company) {
    // Create a list of interaction tags
    const companyProperties = Object.keys(company)
    const tags = companyProperties.map((property) => {
        return mrMarkdownBuilder.tag(property)
    })
    return mrMarkdownBuilder.cr() + tags.join(mrMarkdownBuilder.space()) + mrMarkdownBuilder.cr()
}

async function createSimilarCompany(company) {
    // Add the company name with the logo image
    const companyLogo = mrMarkdownBuilder.imageWithSize(`${company.name} Logo`, company.logo_url, 20, company.name)
    // Create the link to the markdown file
    const companyLink = mrMarkdownBuilder.link(company.name, `./${encodeURI(company.name.replace(/[\s,.\?!]/g, ''))}.md`)
    // With the logo create an h3 header with the company name that also links to the company's markdown file
    let similarCompany = mrMarkdownBuilder.h3(`${companyLogo} ${companyLink}`)
    // Add a line break
    similarCompany += mrMarkdownBuilder.cr()
    // Add the company badges
    similarCompany += await createBadges(company)
    // Add a line break
    similarCompany += mrMarkdownBuilder.cr()
    // Add the company description
    similarCompany += `${mrMarkdownBuilder.b('Description:')} ${company.description} ${mrMarkdownBuilder.cr()}`
    // Add a line break
    similarCompany += mrMarkdownBuilder.cr()
    // Create the Industry List
    similarCompany += createIndustryList(company)
    // return the similar company markdown
    return similarCompany
}



async function createInteractionList(interaction, isMostSimilar) {
    // Destructure the interactions object into most and least
    // Skip interaction if any section is "Unknown"
    if (interaction.description === "Unknown" || interaction.abstract === "Unknown" || interaction.reading_time === "Unknown" || interaction.tags === "Unknown") {
        return null
    }

    // Create link internal link to the interaction file
    const interactionLink = mrMarkdownBuilder.link(interaction.name, `/${encodeURIComponent(interaction.url)}`)

    const mostLeastSimilar = isMostSimilar ? 'Most Similar Interaction: ' : 'Least Similar Interaction: '

    // Create the interaction section
    let interactionSection = `${mrMarkdownBuilder.h3(mostLeastSimilar + interactionLink)}${mrMarkdownBuilder.cr()}`
    interactionSection += await interactionsBuilder.createMetadataBadges(interaction) + mrMarkdownBuilder.cr()
    interactionSection += `${interaction.description}${mrMarkdownBuilder.cr()}`

    return interactionSection
}

// Retrieve the company by name
function getCompany(companyName, companies) {
    return companies.filter(company => company.name === companyName)
}
// Retrieve the interactions for a company
function getInteractions(company, interactions) {
    // console.log(interactions)
    const interactionNames = Object.keys(company[0].linked_interactions);
    return interactionNames.map(interactionName =>
        interactions.find(interaction => interaction.name === interactionName)
    ).filter(interaction => interaction !== undefined)
}

function getCompetitors(similarities, companies, interactions) {
    // x1 = 1 and y1 = 1 because this the equivalent of comparing a company to itself
    const x1 = 1
    const y1 = 1
    let distanceToCompany = {}
    let companyToDistance = {}
    for (const companyName in similarities) {
        // Compute the distance using d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
        const myDistance = Math.sqrt(
            (similarities[companyName].most_similar.score - x1) ** 2 +
            (similarities[companyName].least_similar.score - y1) ** 2
        )
        distanceToCompany[myDistance] = companyName
        companyToDistance[companyName] = myDistance
    }

    // Obtain the closest company using max, note min returns the least similar
    const leastSimilarName = distanceToCompany[Math.max(...Object.keys(distanceToCompany))]
    let leastSimilarCompany = getCompany(leastSimilarName, companies)
    leastSimilarCompany[0].interactions = getInteractions(leastSimilarCompany, interactions)

    const mostSimilarName = distanceToCompany[Math.min(...Object.keys(distanceToCompany))]
    let mostSimilarCompany = getCompany(mostSimilarName, companies)
    mostSimilarCompany[0].interactions = getInteractions(mostSimilarCompany, interactions)

    // Transform the strings into floats prior to return
    const allDistances = Object.keys(distanceToCompany).map(
        (distance) => {
            return parseFloat(distance)
        }
    )
    // return both the most similar id and all computed distanceToCompany
    return {
        mostSimilar: mostSimilarCompany[0],
        leastSimilar: leastSimilarCompany[0],
        distances: allDistances,
        companyMap: companyToDistance,
        all: companies
    }
}

async function createSimilarCompanies(similarCompanies, companies, interactions) {
    // Get all competitors
    const competitors = getCompetitors(similarCompanies, companies, interactions)
    const companyObject = competitors.mostSimilar
    const mostSimilarCompany = competitors.mostSimilar.name
    
    
    // Create a list of similar companies to process
    // const mostSimilarCompany = Object.keys(similarCompanies).reduce((a, b) => similarCompanies[a] > similarCompanies[b] ? a : b)
    // Append the most similar company to the list from the companies array
    // const companyObject = companies.find((company) => company.name === mostSimilarCompany)
    // Create the most similar company markdown
    const mostSimilarCompanySection = await createSimilarCompany(companyObject)
    // Get the most and least similar interactions from the similarCompanies object using companyObject name
    const mostSimilarInteraction = interactions.find((interaction) => interaction.name === similarCompanies[mostSimilarCompany].most_similar.name)
    const leastSimilarInteraction = interactions.find((interaction) => interaction.name === similarCompanies[mostSimilarCompany].least_similar.name)
    // Create the most and least similar interactions markdown
    const mostSimilar = await createInteractionList(mostSimilarInteraction, true)
    const leastSimilar = await createInteractionList(leastSimilarInteraction, false)
    // Combine the most and least similar interactions into a single string
    const similarInteractions = `${mostSimilar}${leastSimilar}`
    // Process the similar interactions list by calling the createSimilarInteractions function, this should return the markdown for the similar interactions
    // Return the markdown for the similar companies and interactions
    return `${mrMarkdownBuilder.h2('Most Similar Company')}${mrMarkdownBuilder.cr()}${mostSimilarCompanySection}${mrMarkdownBuilder.cr()}${similarInteractions}${mrMarkdownBuilder.hr()}`
}

async function createCompanyReport(companies, interactions, reports) {
    let companyReports = []
    const suffix = '.md'
    const prefix = reports.company
    for (let company of companies) {
        // ---- BEGIN Company Introduction ----
        // Get the name of the company and remove spaces, commas, periods, question marks, and exclamation points
        const companyFileName = company.name.replace(/[\s,.\?!]/g, '')
        // Add company name with the logo image
        const companyLogo = mrMarkdownBuilder.imageWithSize(`${company.name} Logo`, company.logo_url, 25, company.name)
        // Call the h1 method from the headers module
        let companyFile = `[${mrMarkdownBuilder.link('Back to Company Directory', './README.md')}]\n`
        companyFile += mrMarkdownBuilder.hr()
        companyFile += mrMarkdownBuilder.h1(`${companyLogo} ${mrMarkdownBuilder.link(company.name, company.url)}`)
        // Add a line break
        companyFile += mrMarkdownBuilder.cr()
        // Add the company badges
        companyFile += await createBadges(company)
        // Add a line break
        companyFile += mrMarkdownBuilder.cr()
        // Add the company description
        companyFile += `${mrMarkdownBuilder.b('Description:')} ${company.description} ${mrMarkdownBuilder.cr()}`
        // Add a line break
        companyFile += mrMarkdownBuilder.cr()
        // Create the Industry List
        companyFile += createIndustryList(company)
        // If there are tags add them to the company file
        if (company.tags && Object.keys(company.tags).length > 0) {
            companyFile += `${mrMarkdownBuilder.h3('Tags')}${mrMarkdownBuilder.cr()}${await createTags(company.tags)}${mrMarkdownBuilder.cr()}`
        }
        // Add a horizontal rule
        companyFile += mrMarkdownBuilder.hr()
        // Add a line break
        companyFile += mrMarkdownBuilder.cr()
        // ----  End Company Introduction  ----

        // If similar companies exist, add them to the company file
        if (company.similarity && Object.keys(company.similarity).length > 0) {
            companyFile += await createSimilarCompanies(company.similarity, companies, interactions)
        }

        // If there are linked_interactions in the company then create the interaction list
        if (Object.keys(company.linked_interactions).length > 0) {
            companyFile += await interactionsBuilder.createInteractionsSection(company, interactions);
        }

        // Add a line break
        companyFile += mrMarkdownBuilder.cr()

        // Create the company table
        companyFile += createCompanyWebLinkList(company)

        // Add a line break
        companyFile += mrMarkdownBuilder.cr()

        // Add an h2 for the company's location
        companyFile += createCompanyMap(company)

        // Add a line break
        companyFile += mrMarkdownBuilder.cr()

        // Add a horizontal rule
        companyFile += mrMarkdownBuilder.hr()

        // Add the creation date
        companyFile += `[ ${mrMarkdownBuilder.b('Created:')} ${company.creation_date} by ${company.creator_name} | ${mrMarkdownBuilder.b('Modified:')} ${company.modification_date} ]`

        // Return the file content   
        companyReports.push({
            name: company.name,
            path: `${prefix}${companyFileName}${suffix}`,
            content: companyFile
        })
    }
    return companyReports
}


module.exports = {
    createCompanyReport
}