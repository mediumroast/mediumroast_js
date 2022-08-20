// Import required modules
import axios from "axios"

/*
Simple and safe wrappers around axios to make RESTful API calls simpler.

The credential object, passed when this object is created, should include all relevant items
needed to authenticate a client.  This can include appropriate JWT tokens, user identifiers,
passwords, etc.  At a minimum the restServer and an apiKey are needed to connect.
*/
class mrRest {
    constructor(credential) {
        this.user = credential.user
        this.secret = credential.secret
        this.apiKey = credential.apiKey
        this.restServer = credential.restServer
    }

    /*
    Get an object using endpoint only.

    If the request succeeds a boolean status of true, and the JSON is returned.
    Otherwise, if the request fails a boolean status of false, and status message is returned.
    */
    async getObj(endpoint) {
        const myURL = this.restServer + endpoint
        try {
            const resp = await axios.get(
                myURL,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': this.apiKey
                    }
                }
            )
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    /*
    Put an object using endpoint and a Javascript object.

    If the request succeeds a boolean status of true, and the JSON is returned.
    Otherwise, if the request fails a boolean status of false, and status message is returned.
    */
    async putObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        // TODO confirm API Key
        const myHeaders = {
            'Accept': 'application/json',
            'Authorization': this.apiKey
        }
        try {
            const resp = await axios.put(url = myURL, data = obj, {headers: myHeaders})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    /*
    Patch an object using endpoint and a Javascript object.

    If the request succeeds a boolean status of true, and the JSON is returned.
    Otherwise, if the request fails a boolean status of false, and status message is returned.
    */
    async patchObj(endpoint, obj, head = {'Accept': 'application/json'}) {
        const myURL = this.restServer + endpoint
        // TODO confirm API Key
        const myHeaders = {
            'Accept': 'application/json',
            'Authorization': this.apiKey
        }
        try {
            const resp = await axios.patch(url = myURL, data = obj, {headers: myHeaders})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    /*
    Delete an object using endpoint and a Javascript object.

    If the request succeeds a boolean status of true, and the JSON is returned.
    Otherwise, if the request fails a boolean status of false, and status message is returned.
    */
    async deleteObj(endpoint, obj, head = {'Accept': 'application/json'}) {
        const myURL = this.restServer + endpoint
        // TODO confirm API Key
        const myHeaders = {
            'Accept': 'application/json',
            'Authorization': this.apiKey
        }
        try {
            const resp = await axios.delete(url = myURL, data = obj, {headers: myHeaders})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }
}

export default mrRest