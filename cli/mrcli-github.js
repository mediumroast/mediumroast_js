#!/usr/bin/env node

import Environmentals from '../src/cli/env.js'
import { GitHubAuth } from '../src/api/authorize.js'
import GitHubFunctions from "../src/api/github.js"
import WizardUtils from '../src/cli/commonWizard.js'
import FilesystemOperators from '../src/cli/filesystem.js'



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
console.clear()

// Test the creation of a repository
const myOrgName = 'mediumroast'
// const myOrg = await octokit.rest.orgs.get({org: myOrgName})

// Construct the GitHub API object
const gitHubCtl = new GitHubFunctions(accessToken[1], myOrgName, 'mr-cli-setup')
let gitHubResp
let doSetup

const containerName = 'Companies'

const wizardUtils = new WizardUtils('all')

gitHubResp = await gitHubCtl.checkForLock(containerName)
if(gitHubResp[0]) {
    console.log(`The ${containerName} container is locked, please remove the lock and try again.`)
    process.exit(1)
}


gitHubResp = await gitHubCtl.lockContainer(containerName)
console.log(gitHubResp[2].data)
// Save the sha for the unlock
const lockSha = gitHubResp[2].data.content.sha

doSetup = await wizardUtils.operationOrNot(
    `Did the lock occur?`
)

// Create a new Branch
gitHubResp = await gitHubCtl.createBranchFromMain()

console.log(gitHubResp[2].data)

doSetup = await wizardUtils.operationOrNot(
    `Did the Branch create?`
)

const branchName = gitHubResp[2].data.ref
const branchSha = gitHubResp[2].data.object.sha 

// Construct filesystem operators
const filesystem = new FilesystemOperators()


// Read the file companies.json in the current directory, using the filesystem operators, and convert to JSON
const companies = await filesystem.readJSONFile('./companies.json')

// Read objects from the repository
gitHubResp = await gitHubCtl.readObjects(containerName)
console.log(gitHubResp[2])
doSetup = await wizardUtils.operationOrNot(
    `Objects read?`
)
const objectSha = gitHubResp[2].data.sha
gitHubResp = await gitHubCtl.writeObject(containerName, companies[2], branchName, objectSha)
console.log(gitHubResp[2])

doSetup = await wizardUtils.operationOrNot(
    `Objects write?`
)

// Merge branch into main
gitHubResp = await gitHubCtl.mergeBranchToMain(branchName, branchSha)


doSetup = await wizardUtils.operationOrNot(
    `Did the Branch merge?`
)

gitHubResp = await gitHubCtl.unlockContainer(containerName, lockSha)
console.log(gitHubResp[2])

doSetup = await wizardUtils.operationOrNot(
    `Did the repo unlock merge?`
)


