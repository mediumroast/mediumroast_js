/**
 * Common functions and tools used for report processing
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file tools.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

import FilesystemOperators from '../cli/filesystem.js'

/**
 * @function getMostSimilarCompany 
 * @description Find the closest competitor using the Euclidean distance
 * @param {Object} comparisons - the comparisons from a company object
 * @returns {Object} An array containing a section description and a table of interaction descriptions
 */
export function getMostSimilarCompany(comparisons, companies) {
    // x1 = 1 and y1 = 1 because this the equivalent of comparing a company to itself
    const x1 = 1 
    const y1 = 1
    let distanceToCompany = {}
    let companyToDistance = {}
    for(const companyId in comparisons) {
        // Compute the distance using d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
        const myDistance = Math.sqrt(
                (comparisons[companyId].most_similar.score - x1) ** 2 + 
                (comparisons[companyId].least_similar.score - y1) ** 2
            )
        distanceToCompany[myDistance] = companyId
        companyToDistance[companyId] = myDistance
    }
    // Obtain the closest company using max, note min returns the least similar
    const mostSimilarId = distanceToCompany[Math.max(...Object.keys(distanceToCompany))]
    // Get the id for the most similar company
    const mostSimilarCompany = companies.filter(company => {
        if (parseInt(company.company.id) === parseInt(mostSimilarId)) {
            return company
        }
    })
    // Transform the strings into floats prior to return
    const allDistances = Object.keys(distanceToCompany).map (
        (distance) => {
            return parseFloat(distance)
        }
    )
    // return both the most similar id and all computed distanceToCompany
    return {mostSimilarCompany: mostSimilarCompany[0], distances: allDistances, companyMap: companyToDistance}
}


/**
 * @function initWorkingDirs 
 * @description Prepare working directories for report and package creation
 * @param {String} baseDir - full path to the directory to initialize with key working directories
 */
export function initWorkingDirs(baseDir) {
    const fileSystem = new FilesystemOperators()
    const subdirs = ['interactions', 'images']
    for(const myDir in subdirs) {
        fileSystem.safeMakedir(baseDir + '/' + subdirs[myDir])
    }
}

/**
 * @function cleanWorkingDirs 
 * @description Clean up working directories after report and/or package creation
 * @param {String} baseDir - full path to the directory to initialize with key working directories
 * @returns {Array} containing the status of the rmdir operation, status message and null
 */
export function cleanWorkingDirs(baseDir) {
    const fileSystem = new FilesystemOperators()
    return fileSystem.rmDir(baseDir)
}