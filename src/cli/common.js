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

class serverOperations {
    /**
     * A class with high level operations to interact with the mediumroast.io server 
     * @constructor
     * @classdesc Commonly needed high level operations that interact with the mediumroast.io server 
     * @param {Object} env - an object containing the environmental variables for instantiating access to the mediumroast.io server
     * @param {String} server - a full URL to the target mediumroast.io server 
     */
    constructor(env, server=null) {
        env.restServer ? 
            this.restServer = env.restServer :
            this.restServer = server
        env.user ?
            this.user = env.user :
            this.user = env.DEFAULT.user
        env.secret ?
            this.secret = env.secret :
            this.secret = env.DEFAULT.secret
        env.apiKey ?
            this.apiKey = env.apiKey :
            this.apiKey = env.DEFAULT.api_key
    }
    
    /** 
     * @async
     * @function getOwningCompany
     * @description Find and return the owning company name
     * @param {Object} apiController - a fully authenticated company API controller capable of talking to the mediumroast.io
     * @returns {Array} the array contains [success, message, owningCompanyName], if success is true detected and return the owning company
    */
    async getOwningCompany(companyCtl) {
        const [success, msg, results] = await companyCtl.findByX('role','Owner')
        if (success && results.length > 0) {
            return [true, {status_code: 200, status_msg: 'detected owning company'}, results[0].name]
        } else {
            return [false, {status_code: 404, status_msg: 'owning company not found'}, null]
        }
    }

    /**
     * @async
     * @function checkServer
     * @description Checks to see if the mediumroast.io sever is empty, has no objects, or not, has objects
     * @returns {Array} the array contains [success, message, apiControllers], if success is true the server is empty else it isn't
     */
    async checkServer() {
        // Generate the credential & construct the API Controllers
        const myAuth = new Auth(
            this.restServer,
            this.apiKey,
            this.user,
            this.secret,
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
                    restServer: this.restServer, 
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
                    restServer: this.restServer, 
                    companyCtl: companyCtl,
                    interactionCtl: interactionCtl,
                    studyCtl: studyCtl, 
                    credential: myCredential
                }
            ]
        }
    }
}

export default serverOperations

