// NOTICE: This module is reserved for future use

// Import required modules
import axios from "axios"


class mrRest {

    constructor(credential) {
        this.user = credential.user
        this.apiKey = credential.apiKey
        this.restServer = credential.restServer
    }


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
            return [false, err, err.response.data]
        }
    }


    async deleteObj(endpoint, obj) {
        const myURL = this.restServer + endpoint
        const payload = {
            headers: {
                'Accept': 'application/json',
                'Authorization': this.apiKey
            },
            data: obj
        }
        try {
            const resp = await axios.delete(myURL, payload)
            return [true, {status_code: resp.status, status_msg: resp.statusText}, resp.data]
        } catch (err) {
            return [false, err,  err.response.data]
        }
    }
}

export default mrRest