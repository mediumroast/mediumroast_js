/**
 * A class that safely wraps RESTful calls to the backend server
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file scaffold.js
 * @copyright 2022 Mediumroast, Inc. All rights reserved.
 * @license Apache-2.0
 */

// Import required modules
import axios from "axios"

/**
 * Simple and safe wrappers around axios to make RESTful API calls simpler.
 * The credential object, passed when this object is created, should include all relevant items
 * needed to authenticate a client.  This can include appropriate JWT tokens, user identifiers,
 * passwords, etc.  At a minimum the restServer and an apiKey are needed to connect.
 * @class
 */
class mrRest {
    constructor(credential) {
        this.user = credential.user
        this.secret = credential.secret
        this.apiKey = credential.apiKey
        this.restServer = credential.restServer
    }

    /**
     * Get an object using endpoint only.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Returns} result A tuple starting with a boolean success/failure and resulting data
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
            return (true, resp.data)
        } catch (err) {
            // console.error(err)
            return (false, err)
        }
    }

    /**
     * Post an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @param  {Returns} result A tuple starting with a boolean success/failure and resulting data
     */
    async postObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        const myHeaders = {
            headers: {
                'Accept': 'application/json',
                'Authorization': this.apiKey
            }
        }
        try {
            const resp = await axios.post(myURL, obj, myHeaders)
            return (true, resp.data)
        } catch (err) {
            return (false, err)
        }
    }

    /**
     * Patch an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @param  {Returns} result A tuple starting with a boolean success/failure and resulting data
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
     * Delete an object using endpoint and a Javascript object.
     * @param  {String} endpoint The full URL to the RESTful target
     * @param  {Object} obj Data objects for input
     * @param  {Returns} result A tuple starting with a boolean success/failure and resulting data
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