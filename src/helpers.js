// Import required modules
import axios from "axios"

class Utils {
    constructor(user = 'dev', token = 'a_token_is_here', serverType = 'json', server = 'http://mr-01:3000') {
        this.userName = user
        this.userToken = token
        this.serverType = serverType
        this.server = server
    }

    // HTTP Gets
    async getObj(target, head=null) {
        const myURL = this.server + target
        try {
            const resp = await axios.get(myURL)
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    // HTTP Puts
    async putObj(target, payload, head = {'Accept': 'application/json'}) {
        const myURL = this.server + target
        try {
            const resp = await axios.put(url = myURL, data = payload, {headers: head})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    // HTTP Patches
    async patchObj(target, payload, head = {'Accept': 'application/json'}) {
        const myURL = this.server + target
        try {
            const resp = await axios.patch(url = myURL, data = payload, {headers: head})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }

    // HTTP Deletes
    async deleteObj(target, payload, head = {'Accept': 'application/json'}) {
        const myURL = this.server + target
        try {
            const resp = await axios.delete(url = myURL, {headers: head})
            return (true, resp.data)
        } catch (err) {
            console.error(err)
            return (false, err)
        }
    }
}

export default Utils