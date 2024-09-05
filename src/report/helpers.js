/**
 * A set of common utilities for creating HTML and DOCX reports for mediumroast.io objects
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file helpers.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import modules
import docx from 'docx'
import * as fs from 'fs'
import docxSettings from './settings.js'
import FilesystemOperators from '../cli/filesystem.js'

class Utilities {
    /**
     * To make machine authoring of a Microsoft DOCX file consistent and easier this class has been 
     * developed.  Key functions are available that better describe the intent of the operation
     * by name which makes it simpler author a document instead of sweating the details.
     * Further through trial and error the idiosyncrasies of the imported docx module
     * have been worked out so that the developer doesn't have to accidently find out and struggle
     * with document generation. 
     * @constructor
     * @classdesc Core utilities for generating elements in a Microsoft word DOCX file
     * @param {Object} env 
     * @todo Remove text and table widgets as they are not used and now in another class
     */
    constructor(env) {
        this.env = env
        this.generalSettings = docxSettings.general
        this.themeSettings = docxSettings[this.env.theme]
        // this.styling = this.initStyles()
        this.fileSystem = new FilesystemOperators()
        this.regions = {
            AMER: 'Americas',
            EMEA: 'Europe, Middle East and Africa',
            APAC: 'Asia Pacific and Japan'
        }
    }

    /**
     * @function initReportWorkspace
     * @description Initialize working directories needed for report production
     * @returns {void}
     * 
     * 
    */
    initReportWorkspace() {
        const subdirs = ['interactions', 'images']
        for (const myDir in subdirs) {
            this.fileSystem.safeMakedir(this.env.workDir + '/' + subdirs[myDir])
        }
    }

    /**
     * @async
     * @function writeReport
     * @description safely write a DOCX report to a desired location
     * @param {Object} docObj - a complete and error free document object that is ready to be saved
     * @param {String} fileName - the file name for the DOCX object
     * @returns {Array} an array containing if the save operation succeeded, the message, and null
     */
    async writeReport(docObj, fileName) {
        try {
            await docx.Packer.toBuffer(docObj).then((buffer) => {
                fs.writeFileSync(fileName, buffer)
            })
            return [true, 'SUCCESS: Created file [' + fileName + '] for object.', null]
        } catch (err) {
            return [false, 'ERROR: Failed to create report for object.', null]
        }
    }

    // ----------------- Company Data Manipulation Utilities ----------------- //
    getCompetitors(similarities, companies, interactions) {
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
        let leastSimilarCompany = this.getCompany(leastSimilarName, companies)
        leastSimilarCompany[0].interactions = this.getInteractions(leastSimilarCompany, interactions)

        const mostSimilarName = distanceToCompany[Math.min(...Object.keys(distanceToCompany))]
        let mostSimilarCompany = this.getCompany(mostSimilarName, companies)
        mostSimilarCompany[0].interactions = this.getInteractions(mostSimilarCompany, interactions)

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

    // Retrieve the company by name
    getCompany(companyName, companies) {
        return companies.filter(company => company.name === companyName)
    }
    // Retrieve the interactions for a company
    getInteractions(company, interactions) {
        // console.log(interactions)
        const interactionNames = Object.keys(company[0].linked_interactions);
        return interactionNames.map(interactionName =>
            interactions.find(interaction => interaction.name === interactionName)
        ).filter(interaction => interaction !== undefined)
    }

    initializeCompanyData(companyName, companies, interactions) {
        const sourceCompany = this.getCompany(companyName, companies)
        const competitors = this.getCompetitors(sourceCompany[0].similarity, companies, interactions)
        return {
            company: sourceCompany[0],
            interactions: this.getInteractions(sourceCompany, interactions),
            competitors: competitors,
            totalInteractions: interactions.length,
            totalCompanies: companies.length,
            averageInteractionsPerCompany: Math.round(interactions.length / companies.length),
        }
    }

}

export default Utilities