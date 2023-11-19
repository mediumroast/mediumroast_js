#!/usr/bin/env node

import axios from "axios"
import chalk from 'chalk'
import Authenticate from '../src/api/authorize.js'
import WizardUtils from '../src/cli/commonWizard.js'


    function getConfig () {
        return {
            clientId:'Iv1.eb16133ca33b9509',
            appId: '628777',
            deviceCodeUrl: 'https://github.com/login/device/code',
            accessTokenUrl: 'https://github.com/login/oauth/access_token',
            contentType:  'application/json',
            grantType: 'urn:ietf:params:oauth:grant-type:device_code',
        }
    }

    async function getDeviceCode(config) {
        const options = {
            method: 'POST',
            url: config.deviceCodeUrl,
            headers: {
                'Accept': config.contentType
            },
            data: new URLSearchParams({
                client_id: config.clientId,
            })
        }
        let deviceCode
        try {
            deviceCode = await axios.request(options)
            return [true, deviceCode.data]
        } catch (err) {
            return [false, err]
        }
    }

    async function getAccessToken(config, deviceCode) {
        const options = {
            method: 'POST',
            url: config.accessTokenUrl,
            // Defines the headers to call GitHub for authentication
            headers: {
                'Accept': config.contentType
            },
            // Setup the URL string parameters which will be fed to the call
            data: new URLSearchParams({
                client_id: config.clientId,
                device_code: deviceCode,
                grant_type: config.grantType

            })
        }
        let accessToken
        try {
            accessToken = await axios.request(options)
            return [true, accessToken.data]
        } catch (err) {
            return [false, err]
        }
    }

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Obtain key configuration data to be used for getting device codes and access tokens
const config = getConfig()

// Construct the authenticator object
const authenticator = new Authenticate()

// Pull in wizard utilities
const wizardUtils = new WizardUtils('all')

// Request the device code which will be used to get the access token
const deviceCodeResp = await getDeviceCode(config)
// If we got a device code then proceed to get the access token
if(deviceCodeResp[0]) {
    const deviceCodeData = deviceCodeResp[1]
    // Authorize the devide
    console.log(
        chalk.blue.bold(`Opening your browser to authorize this client, copy or type this code in your browser [${deviceCodeData.user_code}].`)
    )
    // Open the browser
    await authenticator.verifyClientAuth(deviceCodeData.verification_uri)
    let authorized = null
    // Prompt the user and await their login and approval
    while (!authorized) {
        authorized = await wizardUtils.operationOrNot('Has the web authorization completed?')
    }
    // Get the access token
    const accessTokenResp = await getAccessToken(config, deviceCodeData.device_code)
    if(accessTokenResp[0]) {
        const accessTokenData = accessTokenResp[1]
        // Log the access token to the console
        console.log(accessTokenData)
        // console.log(
        //     chalk.blue.bold(`Generated the access token as [${accessTokenData}].`)
        // )
    } else {
        console.log(chalk.red(`Failed to generate a access token with [${accessTokenResp[1]}]`))
        process.exit()
    }
    
} else {
    console.log(chalk.red(`Failed to generate a device code with [${deviceCodeResp[1]}]`))
    process.exit()
}
