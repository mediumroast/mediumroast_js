#!/usr/bin/env node

import { Octokit } from "octokit"
import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import GitHubFunctions from "../src/api/github.js"



    function getConfig () {
        return {
            clientId:'Iv1.f5c0a4eb1f0606f8',
            appId: '650476',
            deviceCodeUrl: 'https://github.com/login/device/code',
            accessTokenUrl: 'https://github.com/login/oauth/access_token',
            contentType:  'application/json',
            grantType: 'urn:ietf:params:oauth:grant-type:device_code',
            clientType: 'github-app',
        }
    }

/* 
    -----------------------------------------------------------------------

    MAIN - Steps below represent the main function of the program

    ----------------------------------------------------------------------- 
*/

// Construct the authorization object
const githubAuth = new GitHubAuth()

// Obtain key configuration data to be used for getting device codes and access tokens
let config = getConfig()

// Get configuration information from the config file
const environment = new Environmentals('1.0.0', 'github', 'functions to test GitHub operations', 'all')
const configFile = environment.checkConfigDir()
let env = environment.readConfig(configFile)

// Check to see if the GitHub section is available
let accessToken
let updateConfig = false
if (env.hasSection('GitHub')) {
    // Convert the access and refresh token expirations into Date objects
    const accessExpiry = new Date(env.get('GitHub', 'expiresAt'))
    const now = new Date()

    // Check to see if the access token is valid
    if (accessExpiry < now) {
        accessToken = await githubAuth.getAccessToken(config)
        env = environment.updateConfigSetting(env, 'GitHub', 'token', accessToken.token)
        env = environment.updateConfigSetting(env[1], 'GitHub', 'expiresAt', accessToken.expiresAt)
        env = environment.updateConfigSetting(env[1], 'GitHub', 'deviceCode', accessToken.deviceCode)
        updateConfig = true
        env = env[1]
    }
} else {
    // Section GitHub not available perform complete authorization flow
    // Get the access token and add a GitHub section to the env
    accessToken = await githubAuth.getAccessToken(config)
    // Create the GitHub section
    env = environment.addConfigSection(env, 'GitHub', accessToken)
    env = environment.removeConfigSetting(env[1], 'GitHub', 'contentType')
    env = environment.removeConfigSetting(env[1], 'GitHub', 'grantType')
    env = environment.removeConfigSetting(env[1], 'GitHub', 'clientType')
    updateConfig = true
    env = env[1]
}

// Save the config file
if (updateConfig) {
    env.write(configFile)
}

// Pull out the token
accessToken = environment.getConfigSetting(env, 'GitHub', 'token')

// Construct Octokit
// const octokit = new Octokit({auth: accessToken[1]})

// Test the creation of a repository
const myOrgName = 'mediumroast'
// const myOrg = await octokit.rest.orgs.get({org: myOrgName})

// Construct the GitHub API object
const gitHubCtl = new GitHubFunctions(accessToken[1], myOrgName)
let gitHubResp

gitHubResp = await gitHubCtl.createContainers()
console.log(gitHubResp[1])


