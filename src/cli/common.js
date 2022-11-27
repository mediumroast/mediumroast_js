/**
 * A class for common functions for all CLIs.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */


// Import required modules
import { Auth, Companies, Interactions, Studies } from '../api/mrServer.js'

/** 
 * @async
 * @function getOwningCompany
 * @description Find and return the owning company name
 * @param {Object} apiController - a fully authenticated company API controller capable of talking to the mediumroast.io
 * @returns {Array} the array contains [success, message, owningCompanyName], if success is true detected and return the owning company
*/
export async function getOwningCompany(apiController) {
    const [success, msg, results] = await apiController.find_by_x({
        findByX: 'role', 
        xEquals: 'Owner'
    })
    if (success && results.length > 0) {
        return [true, {status_code: 200, status_msg: 'detected owning company'}, results[0].name]
    } else {
        return [false, {status_code: 404, status_msg: 'no owning company detected'}, null]
    }
}

/**
 * @async
 * @function checkServer
 * @description Checks to see if the mediumroast.io sever is empty, has no objects, or not, has objects
 * @param {String} server
 * @param {Object} env 
 * @returns {Array} the array contains [success, message, apiControllers], if success is true the server is empty else it isn't
 */
 export async function checkServer(server, env) {
    // Generate the credential & construct the API Controllers
    const myAuth = new Auth(
        server,
        env.DEFAULT.api_key,
        env.DEFAULT.user,
        env.DEFAULT.secret,
    )
    const myCredential = myAuth.login()
    const interactionCtl = new Interactions(myCredential)
    const companyCtl = new Companies(myCredential)
    const studyCtl = new Studies(myCredential)
    
    // Get all objects from the server
    const myStudies = await studyCtl.getAll()
    const myCompanies = await companyCtl.getAll()
    const myInteractions = await interactionCtl.getAll()
    const [noStudies, noCompanies, noInteractions] = [myStudies[2], myCompanies[2], myInteractions[2]]

    // See if the server is empty
    if (noStudies.length === 0 && noCompanies.length === 0 && noInteractions.length === 0) {
        return [
            true, 
            {status_code: 200, status_msg: 'server empty'}, 
            {
                restServer: server, 
                companyCtl: companyCtl,
                interactionCtl: interactionCtl,
                studyCtl: studyCtl, 
                credential: myCredential
            }
        ]
    // Else the server isn't empty
    } else {
        return [
            false, 
            {status_code: 503, status_msg: 'server not empty'}, 
            {
                restServer: server, 
                companyCtl: companyCtl,
                interactionCtl: interactionCtl,
                studyCtl: studyCtl, 
                credential: myCredential
            }
        ]
    }
}

/**
 * 
 * @param {String} companyName 
 * @returns 
 */
export function generateBucketName(companyName) {
    let tmpName = companyName.replace(/[^a-z0-9]/gi,'')
    return tmpName.toLowerCase()
}