#!/usr/bin/env node

import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import GitHubFunctions from "../src/api/github.js"
import WizardUtils from '../src/cli/commonWizard.js'



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
const gitHubCtl = new GitHubFunctions(accessToken[1], myOrgName, 'mr-cli-setup')
let gitHubResp

const containerName = 'Studies'
const shas = {
    content: 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391',
    commit: 'a38e44b965a966c232bad3ba6c9adde9b3703903',
    commitTree: '7e9937a4b9852d8a55aa983abdda423d8cd8f750'
}

const wizardUtils = new WizardUtils('all')

gitHubResp = await gitHubCtl.lockContainer(containerName)
console.log(gitHubResp[2].data)

const doSetup = await wizardUtils.operationOrNot(
    `Is the lock finished?`
)

gitHubResp = await gitHubCtl.unlockContainer(containerName, shas.content)
console.log(gitHubResp[2].data)


