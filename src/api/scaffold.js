/**
 * A class that safely wraps RESTful calls to the backend server
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file scaffold.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 * @version 1.0.0
 */

// Import required modules
import axios from "axios"


class mrRest {
    /**
     * Simple and safe wrappers around axios to make RESTful API to mediuroast.io.
     * The credential object, passed when this object is created, should include all relevant items
     * needed to authenticate a client.  This can include appropriate JWT tokens, user identifiers,
     * passwords, etc.  At a minimum the restServer and an apiKey are needed to connect.
     * @constructor
     * @classdesc Construct the object to interact with the mediumroast.io application
     * @param {Object} credential - contains key items needed to interact with the mediumroast.io application
     */
    constructor(credential) {
        this.user = credential.user
        this.secret = credential.secret
        this.apiKey = credential.apiKey
        this.restServer = credential.restServer
    }

    /**
     * @function getObj
     * @description Get an object using endpoint only.
     * @param  {String} endpoint - The full URL to the RESTful target
     * @returns  {Array} An array starting with a boolean success/failure and resulting data
     */
    async getObj(endpoint) {
        const myURL = this.restServer + endpoint
        const myHeaders = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this.apiKey
            }
        }

        try {
            const resp = await axios.get(myURL, myHeaders)
            return [true, {status_code: resp.status, status_msg: resp.statusText}, resp.data]
        } catch (err) {
            // console.error(err)
            return [false, err, null]
        }
    }

    /**
     * @function postObj
     * @description Post an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @returns  {Array} An array starting with a boolean success/failure and resulting data
     */
    async postObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        const myHeaders = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey
            }
        }
        try {
            const resp = await axios.post(myURL, obj, myHeaders)
            return [true, {status_code: resp.status, status_msg: resp.statusText}, resp.data]
        } catch (err) {
            return [false, err, null]
        }
    }

    /**
     * @function patchObj
     * @description Patch an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @returns  {Array} An array starting with a boolean success/failure and resulting data
     * @todo This may not be needed for the final implementation, verify with the backend
     */
    async patchObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        const myHeaders = {
            headers: {
                'Accept': 'application/json',
                'Authorization': this.apiKey
            }
        }
        try {
            const resp = await axios.patch(url = myURL, data = obj, myHeaders)
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    /**
     * @function deleteObj
     * @description Delete an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @returns  {Array} An array starting with a boolean success/failure and resulting data
     * @todo this isn't yet implemented in the backend verification is needed
     */
    async deleteObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        const myHeaders = {
            headers: {
                'Accept': 'application/json',
                'Authorization': this.apiKey
            }
        }
        try {
            const resp = await axios.delete(url = myURL, data = obj, myHeaders)
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }
}

export default mrRest