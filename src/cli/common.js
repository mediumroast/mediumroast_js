/**
 * A class for common functions for all CLIs.
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file common.js
 * @copyright 2023 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.1.0
 */


// Import required modules
import { Auth, Companies, Interactions, Studies } from '../api/mrServer.js'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

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
        env.apiKey ?
            this.apiKey = env.apiKey :
            this.apiKey = env.DEFAULT.access_token
    }
    
    /** 
     * @async
     * @function getOwningCompany
     * @description Find and return the owning company name
     * @param {Object} apiController - a fully authenticated company API controller capable of talking to the mediumroast.io
     * @returns {Array} the array contains [success, message, owningCompanyName], if success is true detected and return the owning company
     * @todo the user will have the owning company included in their profile so we don't need to do anything more sophisticated
    */
    async getOwningCompany(companyCtl) {
        // TODO this should turn into a two step process
        // 1. Obtain the company name from the user object
        // 2. Lookup the company name and ensure it is an owning company
        // If both of these checks work out then we're ok to say there is an owning company
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
     * @todo this is likely deprecated, or needs to be improved to ensure that the changed model is correct
     */
    async checkServer() {
        // Generate the credential & construct the API Controllers
        const myAuth = new Auth(
            this.restServer,
            this.apiKey,
            this.user
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
                    credential: myCredential,
                    owner: null
                }
            ]
        // Else the server isn't empty
        } else {
            const owningCompany = await this.getOwningCompany(companyCtl)
            return [
                false, 
                {status_code: 503, status_msg: 'server not empty'}, 
                {
                    restServer: this.restServer, 
                    companyCtl: companyCtl,
                    interactionCtl: interactionCtl,
                    studyCtl: studyCtl, 
                    credential: myCredential,
                    owner: owningCompany[2]
                }
            ]
        }
    }
}

class Utilities {
    /**
     * @async
     * @function downloadBinary
     * @description When given a full URL to an image download the image to the defined location
     * @param {String} url - the full URL to the targeted image
     * @param {String} dir - the target directory to save the file to
     * @param {String} filename - the name of the file to save the image to
     */
    async downloadBinary(url, directory, filename, showDownloadStatus=false) {
        const myFullPath = path.resolve(directory, filename)
        const myConfig = {
            responseType: "stream",
        }
        try {
            const resp = await axios.get(url, myConfig)
            const imageFile = fs.createWriteStream(myFullPath)
            const myDownload = resp.data.pipe(imageFile)
            const foo = await myDownload.on('finish', () => {
                imageFile.close()
                if(showDownloadStatus) {
                    console.log(`SUCCESS: Downloaded [${myFullPath}]`)
                }
            })
            return myFullPath
        } catch (err) {
            console.log(`ERROR: Unable to download file due to [${err}]`)
        }
    }

    async getBinary(url, fileName, directory) {
        const binaryPath = path.resolve(directory, fileName)
        const response = await axios.get(url, { responseType: 'stream' });
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(binaryPath) 
            response.data.pipe(fileStream)
            
            let failed = false
            fileStream.on('error', err => {
              reject([false, {status_code: 500, status_msg: `FAILED: could not download ${url} to ${binaryPath}`}, err])
              failed = true 
            })
        
            fileStream.on('close', () => {
                if (!failed) {
                    resolve([true, {status_code: 200, status_msg: `SUCCESS: downloaded ${url} to ${binaryPath}`}, binaryPath]) 
                } else {
                    resolve([false, {status_code: 500, status_msg: `FAILED: could not download ${url} to ${binaryPath}`}, err])
                }
            })
        
          })
    }
}

export {serverOperations, Utilities}

