/**
 * Classes to create dashboards for company, interaction and study objects in mediumroast.io documents
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file dashboard.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 2.0.0
 */

// Import required modules
import docx from 'docx'
import * as fs from 'fs'
import Utilities from './helpers.js'
import docxSettings from './settings.js'
import Charting from './charts.js'
import TableWidgets from './widgets/Tables.js'
import TextWidgets from './widgets/Text.js'

class Dashboards {
    /**
     * A high class meant to create an initial dashboard page for an MS Word document company report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     * @param {String} theme - Governs the color of the dashboard, be either coffee or latte 
     */
    constructor(env) {
        this.env = env
        this.util = new Utilities(env)
        this.charting = new Charting(env)
        this.tableWidgets = new TableWidgets(env)
        this.textWidgets = new TextWidgets(env)
        this.themeStyle = docxSettings[env.theme] // Set the theme for the report
        this.generalStyle = docxSettings.general // Pull in all of the general settings
    }

    // Create a utility that takes text as an input, and an integer called numSentences, splits the text into sentences and returns the first numSentences as a string
    shortenText(text, numSentences=2) {
        const sentences = text.split('.')
        let shortText = ''
        for (let i=0; i<numSentences; i++) {
            shortText += sentences[i] + '.'
        }
        return shortText
    }

    // Create a function called truncate text that takes a string and an integer called numChars, and returns the first numChars of the string
    truncateText(text, numChars=107) {
        return `${text.substring(0, numChars)}...`
    }

    /**
     * 
     * @param {*} imageFile 
     * @param {*} height 
     * @param {*} width 
     * @returns 
     * @todo move to common
     */
    insertImage (imageFile, height, width) {
        const myFile = fs.readFileSync(imageFile)
        return new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            children: [
                new docx.ImageRun({
                    data: myFile,
                    transformation: {
                        height: height,
                        width: width
                    }
                })
            ]
        })
    }
}

class InteractionDashboard extends Dashboards {
    /**
     * A class meant to create an initial dashboard page for an MS Word document interaction report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     */
    constructor(env) {
        super(env)
    }

    _getTopTwoTopics(topics, topicCount=1) {
        // Convert the topics object to an array of entries
        const topicsArray = Object.entries(topics)
    
        // Sort the array based on the frequency property in descending order
        topicsArray.sort((a, b) => b[1].frequency - a[1].frequency)
    
        // Slice the array to get the top 2 entries
        const top2TopicsArray = topicsArray.slice(0, topicCount)
    
        // Convert the array back to an object
        const top2Topics = Object.fromEntries(top2TopicsArray);
    
        return top2Topics
    }

    _priorityTopicsTable (top2Topics) {
        let myTopics = []
        // Create the column header for insights
        let insightsColumnHeader = 'Proto-Requirement'
        let insightsCellKey = 'pm_label'
        if (this.env.persona == 'analyst') {
            insightsColumnHeader = 'Competitive Insight'
            insightsCellKey = 'analyst_label'
        }
        // Loop through the top 2 topics and create a table row for each topic
        for (const topic in top2Topics) {
            myTopics.push(
                this.tableWidgets.oneColumnTwoRowsTable(
                    [`Priority ${insightsColumnHeader}`, top2Topics[topic][insightsCellKey]]
                )
            )
        }
        return myTopics
    }

    async makeDashboard(interaction, company, isPackage=false) {
        // Define the header for the insights table
        const insightsTableHeader = this.env.persona == 'analyst' ? "Competitive Insights" : "Proto-Requirements"

        console.log(`The insights table header is: ${this.env.persona}`)
        const rightContents = this.tableWidgets.descriptiveStatisticsTable([
            {title: 'Type', value: interaction.interaction_type},
            {title: 'Est. reading time (min)', value: interaction.reading_time},
            {title: 'Page(s)', value: interaction.page_count},
            {title: 'Region', value: interaction.region},
            {title: insightsTableHeader, value: Object.keys(interaction.topics).length},
        ])
        let interactionName = interaction.name
        let interactionOptions = { includesHyperlink: false }
        if (isPackage) {
            let myObj = interaction.url.split('/').pop()
            // Replace spaces with underscores and keep the file extension
            // NOTE: This may not work, need to text on other interactions
            myObj = myObj.replace(/ /g, '_')
            interactionName = this.textWidgets.makeExternalHyperLink(
                interaction.name, 
                `./interactions/${myObj}`
            )
            interactionOptions = { includesHyperlink: true }
        }
        const interactionNameTable = this.tableWidgets.oneColumnTwoRowsTable(
            ['Name', interactionName],
            interactionOptions
        )
        const interactionDescriptionTable = this.tableWidgets.oneColumnTwoRowsTable(
            ['Description', super.shortenText(interaction.description)]
        )
        const associatedCompanyTable = this.tableWidgets.oneColumnTwoRowsTable(
            [`Linked company: ${company.name}`, super.shortenText(company.description)]
        )

        const top2Topics = this._getTopTwoTopics(interaction.topics)
        const protorequirementsTable = this._priorityTopicsTable(top2Topics)[0]
        const leftContents = this.tableWidgets.packContents([interactionNameTable, interactionDescriptionTable, associatedCompanyTable, protorequirementsTable])

        return this.tableWidgets.createDashboardShell(leftContents, rightContents, {leftWidth: 80, rightWidth: 20})
    }
}

class CompanyDashbord extends Dashboards {
    /**
     * A class meant to create an initial dashboard page for an MS Word document company report
     * @constructor
     * @classdesc To operate this class the constructor should be passed a the environmental setting for the object.
     * @param {Object} env - Environmental variable settings for the CLI environment
     */
    constructor(env) {
        super(env)
    }

    // Create a table with the two images in a single row
    //     50%      |    50%    
    // bubble chart | radar chart
    _createChartsTable (bubbleImage, pieImage) {
        return new docx.Table({
            columnWidths: [50, 50],
            rows: [
                new docx.TableRow({
                    children: [
                        new docx.TableCell({
                            children: [this.insertImage(bubbleImage, 240, 345)],
                            borders: this.bottomAndRightBorders
                        }),
                        new docx.TableCell({
                            children: [this.insertImage(pieImage, 240, 345)],
                            borders: this.bottomAndRightBorders
                        }),
                    ]
                })
            ],
            width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE
            }
        })
    }


    /**
     * @async
     * @function makeDashboard - Create a dashboard for a company report
     * @param {Object} company - A company object
     * @param {Object} competitors - A competitors object
     * @param {Object} interactions - An interactions object
     * @param {Number} noInteractions - The number of interactions
     * @param {Number} totalInteractions - The total number of interactions
     * @param {Number} totalCompanies - The total number of companies
     * @param {Number} averageInteractions - The average number of interactions per company
     * @returns {Object} - A docx.Table object that contains the dashboard
     * 
     * @example
     * const companyDashboard = new CompanyDashboard(env)
     * const dashboard = await companyDashboard.makeDashboard(company, competitors, interactions, noInteractions, totalInteractions, totalCompanies, averageInteractions)
     * 
     */
    async makeDashboard(
        company, 
        competitors, 
        interactions, 
        noInteractions, 
        totalInteractions, 
        totalCompanies, 
        averageInteractions,
        allCompetitors) {

        // Create bubble and pie charts and the associated wrapping table
        const bubbleChartFile = await this.charting.bubbleChart({similarities: company.similarity, company: company, competitors: allCompetitors})
        const pieChartFile = await this.charting.pieChart({company: company})
        const chartsTable = this._createChartsTable(bubbleChartFile, pieChartFile)

        // Create the most similar company description table
        // TODO this needs to be fixed because the Ecludian distance doesn't match the most similar company
        const mostSimilarCompanyDescTable = this.tableWidgets.oneColumnTwoRowsTable([
            `Most similar company to ${company.name}: ${competitors.mostSimilar.name}`, 
            this.shortenText(competitors.mostSimilar.description, 3)
        ])

        // From the most similar company find the most similar interaction and the least similar interaction
        const mostSimilarInterationName = company.similarity[competitors.mostSimilar.name].most_similar.name
        // Find the most similar interaction using mostSimilarInterationName from the interactions object
        const mostSimilarInteraction = interactions.filter(interaction => {
            if (interaction.name === mostSimilarInterationName) {
                return interaction
            }
        })[0]
        const mostSimilarInteractionDescTable = this.tableWidgets.oneColumnTwoRowsTable([
            this.truncateText(`Most similar interaction from ${competitors.mostSimilar.name}: ${mostSimilarInteraction.name}`),
            this.shortenText(mostSimilarInteraction.description, 1)
        ])

        const leastSimilarInterationName = company.similarity[competitors.mostSimilar.name].least_similar.name
        // Find the least similar interaction using leastSimilarInterationName from the interactions object
        const leastSimilarInteraction = interactions.filter(interaction => {
            if (interaction.name === leastSimilarInterationName) {
                return interaction
            }
        })[0]
        const leastSimilarInteractionDescTable = this.tableWidgets.oneColumnTwoRowsTable([
            this.truncateText(`Least similar interaction from ${competitors.mostSimilar.name}: ${leastSimilarInteraction.name}`),
            this.shortenText(leastSimilarInteraction.description, 1)
        ])
        
        // Create the left and right contents
        const leftContents = this.tableWidgets.packContents([chartsTable, mostSimilarCompanyDescTable, mostSimilarInteractionDescTable, leastSimilarInteractionDescTable])
        const rightContents = this.tableWidgets.descriptiveStatisticsTable([
            {title: 'Number of Interactions', value: noInteractions},
            {title: 'Average Interactions per Company', value: averageInteractions},
            {title: 'Total Interactions', value: totalInteractions},
            {title: 'Total Companies', value: totalCompanies},
        ])

        return this.tableWidgets.createDashboardShell(leftContents, rightContents, {leftWidth: 85, rightWidth: 15})
    }

}

export {
    CompanyDashbord,
    InteractionDashboard
}