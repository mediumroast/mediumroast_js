/**
 * @fileoverview A class that safely wraps RESTful calls to the GitHub API
 * @license Apache-2.0
 * @version 1.0.0
 * 
 * @author Michael Hay <michael.hay@mediumroast.io>
 * @file github.js
 * @copyright 2024 Mediumroast, Inc. All rights reserved.
 * 
 * @class GitHubFunctions
 * @classdesc Core functions needed to interact with the GitHub API for mediumroast.io.
 * 
 * @requires octokit
 * 
 * @exports GitHubFunctions
 * 
 * @example
 * const gitHubCtl = new GitHubFunctions(accessToken, myOrgName, 'mr-cli-setup')
 * const createRepoResp = await gitHubCtl.createRepository()
 */

import { Octokit } from "octokit"


class GitHubFunctions {
    /**
     * @constructor
     * @classdesc Core functions needed to interact with the GitHub API for mediumroast.io.
     * @param {String} token - the GitHub token for the mediumroast.io application
     * @param {String} org - the GitHub organization for the mediumroast.io application
     * @param {String} processName - the name of the process that is using the GitHub API
     * @memberof GitHubFunctions
    */
    constructor (token, org, processName) {
        this.token = token
        this.orgName = org
        this.repoName = `${org}_discovery`
        this.repoDesc = `A repository for all of the mediumroast.io application assets.`
        this.octCtl = new Octokit({auth: token})
        // NOTE: The lockfile name needs to be more flexible in checking for the lockfile
        this.lockFileName = `${processName}.lock`
        this.mainBranchName = 'main'
        this.objectFiles = {
            Studies: 'Studies.json',
            Companies: 'Companies.json',
            Interactions: 'Interactions.json',
            Users: null,
            Billings: null
        }
    }

    /**
     * @async
     * @function getSha
     * @description Gets the SHA of a file in a container on a branch
     * @param {String} containerName - the name of the container to get the SHA from
     * @param {String} fileName - the short name of the file to get the SHA from
     * @param {String} branchName - the name of the branch to get the SHA from
     * @returns {Array} An array with position 0 being boolean to signify success/failure, position 1 being the response or error message, and position 2 being the SHA. 
     * @memberof GitHubFunctions
     */
    async getSha(containerName, fileName, branchName) {
        try {
            const response = await this.octCtl.rest.repos.getContent({
                owner: this.orgName,
                repo: this.repoName,
                ref: branchName,
                path: `${containerName}/${fileName}`
            })
            return [true, {status_code:200, status_msg: `captured sha for [${containerName}/${fileName}]`}, response.data.sha]
        } catch (err) {
            return [false, {status_code: 500, status_msg: `unable to capture sha for [${containerName}/${fileName}] due to [${err.message}]`}, err]
        }
    }

    /**
    * @async 
    * @function getUser
    * @description Gets the authenticated user from the GitHub API
    * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the user info or error message.
    * @todo Add a check to see if the user is a member of the organization
    * @todo Add a check to see if the user has admin rights to the organization
    */
    async getUser() {
        // using try and catch to handle errors get user info
        try {
            const response = await this.octCtl.rest.users.getAuthenticated()
            return [true, `SUCCESS: able to capture current user info`, response.data]
        } catch (err) {
            return [false, `ERROR: unable to capture current user info due to [${err}]`, err.message]
        }
    }

    /**
     * @async
     * @function getAllUsers
     * @description Gets all of the users from the GitHub API
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the user info or error message.
     */
    async getAllUsers() {
        // using try and catch to handle errors get info for all users
        try {
            const response = await this.octCtl.rest.repos.listCollaborators({
                owner: this.orgName,
                repo: this.repoName,
                affiliation: 'all'
            })
            return [true, `SUCCESS: able to capture info for all users`, response.data]
        } catch (err) {
            return [false, `ERROR: unable to capture info for all users due to [${err}]`, err.message]
        }
    }

    /**
     * @async
     * @function getActionsBillings
     * @description Gets the complete billing status for actions from the GitHub API
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the user info or error message.
     */
    async getActionsBillings() {
        // using try and catch to handle errors get info for all billings data
        try {
            const response = await this.octCtl.rest.billing.getGithubActionsBillingOrg({
                org: this.orgName,
            })
            return [true, `SUCCESS: able to capture info for actions billing`, response.data]
        } catch (err) {
            return [false, {status_code: 404, status_msg: `unable to capture info for actions billing due to [${err}]`}, err.message]
        }
    }

    /**
     * @async
     * @function getStorageBillings
     * @description Gets the complete billing status for actions from the GitHub API
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the user info or error message.
     */
    async getStorageBillings() {
        // using try and catch to handle errors get info for all billings data
        try {
            const response = await this.octCtl.rest.billing.getSharedStorageBillingOrg({
                org: this.orgName,
            })
            return [true, `SUCCESS: able to capture info for storage billing`, response.data]
        } catch (err) {
            return [false, {status_code: 404, status_msg: `unable to capture info for storage billing due to [${err}]`}, err.message]
        }
    }

    /**
     * @function createRepository
     * @description Creates a repository, at the organization level, for keeping track of all mediumroast.io assets
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the created repo or error message.
     * @todo Make sure the repo is not public
     */
    async createRepository () {
        try {
            const response = await this.octCtl.rest.repos.createInOrg({
              org: this.orgName,
              name: this.repoName,
              description: this.repoDesc,
              private: true
            })
            return [true, response.data]
          } catch (err) {
            return[false, err.message]
          }
    }

    /**
     * @function getGitHubOrg
     * @description If the GitHub organization exists retrieves the detail about it and returns to the caller
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the org or error message.
     */
    async getGitHubOrg () {
        try {
            const response = await this.octCtl.rest.orgs.get({
                org: this.orgName
            })
            return[true, response.data]
        } catch (err) {
            return[false, err.message]
        }
    }

    /**
     * @function createContainers
     * @description Creates the top level Study, Company and Interaction containers for all mediumroast.io assets
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the responses or error messages.
     */
    async createContainers (containers = ['Studies', 'Companies', 'Interactions']) {
        let responses = []
        let emptyJson = Buffer.from(JSON.stringify([])).toString('base64')
        for (const containerName in containers) {
            try {
                const response = await this.octCtl.rest.repos.createOrUpdateFileContents({
                    owner: this.orgName,
                    repo: this.repoName,
                    path: `${containers[containerName]}/${containers[containerName]}.json`,
                    message: `Create container [${containers[containerName]}]`,
                    content: emptyJson, // Create a valid empty JSON file, but this must be Base64 encoded
                })
                responses.push(response)
            } catch (err) {
                return[false, err]
            }
        }
        return [true, responses]
    }

    /**
     * @description Creates a new branch from the main branch.
     * @function createBranchFromMain
     * @async
     * @returns {Promise<[boolean, string, object]>} A promise that resolves to an array containing a boolean indicating success, a success message, and the response from the GitHub API.
     * @throws {Error} If an error occurs while getting the main branch reference or creating the new branch.
     * @memberof GitHubFunctions
     */
    async createBranchFromMain() {
        // Define the branch name
        const branchName = Date.now().toString()
        try {
            // Get the SHA of the latest commit on the main branch
            const mainBranchRef = await this.octCtl.rest.git.getRef({
              owner: this.orgName,
              repo: this.repoName,
              ref: `heads/${this.mainBranchName}`,
            })
        
            // Create a new branch based on the latest commit on the main branch
            const newBranchResp = await this.octCtl.rest.git.createRef({
              owner: this.orgName,
              repo: this.repoName,
              ref: `refs/heads/${branchName}`,
              sha: mainBranchRef.data.object.sha,
            })
        
            return [true, `SUCCESS: created branch [${branchName}]`, newBranchResp]
          } catch (error) {
            return [false, `FAILED: unable to create branch [${branchName}] due to [${error.message}]`, newBranchResp]
          }

    }

    /**
     * @description Merges a specified branch into the main branch by creating a pull request.
     * @function mergeBranchToMain
     * @async
     * @param {string} branchName - The name of the branch to merge into main.
     * @param {string} mySha - The SHA of the commit to use as the head of the pull request.
     * @param {string} [commitDescription='Performed CRUD operation on objects.'] - The description of the commit.
     * @returns {Promise<[boolean, string, object]>} A promise that resolves to an array containing a boolean indicating success, a success message, and the response from the GitHub API.
     * @throws {Error} If an error occurs while creating the branch or the pull request.
     * @memberof GitHubFunctions
     */
    async mergeBranchToMain(branchName, mySha, commitDescription='Performed CRUD operation on objects.') {
        try {
            // Create a new branch
            // const createBranchResponse = await this.octCtl.rest.git.createRef({
            //   owner: this.orgName,
            //   repo: this.repoName,
            //   ref: branchName,
            //   sha: mySha,
            // })

            // console.log(createBranchResponse.data)
        
            // Create a pull request
            const createPullRequestResponse = await this.octCtl.rest.pulls.create({
              owner: this.orgName,
              repo: this.repoName,
              title: commitDescription,
              head: branchName,
              base: this.mainBranchName,
              body: commitDescription,
            })
        
            // Merge the pull request
            const mergeResponse = await this.octCtl.rest.pulls.merge({
              owner: this.orgName,
              repo: this.repoName,
              pull_number: createPullRequestResponse.data.number,
              commit_title: commitDescription,
            })
        
            return [true, 'SUCCESS: Pull request created and merged successfully', mergeResponse]
          } catch (error) {
            return [false, `FAILED: Pull request not created or merged successfully due to [${error.message}]`, null]
          }
    }

    /**
     * @description Checks to see if a container is locked.
     * @function checkForLock
     * @async
     * @param {string} containerName - The name of the container to check for a lock.
     * @returns {Promise<[boolean, string]>} A promise that resolves to an array containing a boolean indicating success and a message.
     * @throws {Error} If an error occurs while getting the latest commit or the contents of the container.
     * @memberof GitHubFunctions
     * @todo Add a check to see if the lock file is older than 24 hours and if so delete it.
    */
    async checkForLock(containerName) {

        // Get the latest commit
        const latestCommit = await this.octCtl.rest.repos.getCommit({
            owner: this.orgName,
            repo: this.repoName,
            ref: this.mainBranchName,
        })

        // Check to see if the lock file exists
        const mainContents = await this.octCtl.rest.repos.getContent({
            owner: this.orgName,
            repo: this.repoName,
            ref: latestCommit.data.sha,
            path: containerName
        })

        // Can we search for a file with an extension of .lock?
        // This is due to the fact that there are other processes that may create lock files.

        const lockExists = mainContents.data.some(
            item => item.path === `${containerName}/${this.lockFileName}`
        )

        if (lockExists) {
            return [true, {status_code: 200, status_msg: `container [${containerName}] is locked with lock file [${this.lockFileName}]`}, lockExists]
        } else {
            return [false, {status_code: 404, status_msg: `container [${containerName}] is not locked with lock file [${this.lockFileName}]`}, lockExists]
        }
    }


    /**
     * @description Locks a container by creating a lock file in the container.
     * @function lockContainer
     * @async
     * @param {string} containerName - The name of the container to lock.
     * @returns {Promise<[boolean, string, object]>} A promise that resolves to an array containing a boolean indicating success, a success message, and the response from the GitHub API.
     * @throws {Error} If an error occurs while getting the latest commit or creating the lock file.
     * @memberof GitHubFunctions
    */
    async lockContainer(containerName) {
        // Define the full path to the lockfile
        const lockFile = `${containerName}/${this.lockFileName}`

        // Get the latest commit
        const {data: latestCommit} = await this.octCtl.rest.repos.getCommit({
            owner: this.orgName,
            repo: this.repoName,
            ref: this.mainBranchName,
        })
        let lockResponse
        try {
            lockResponse = await this.octCtl.rest.repos.createOrUpdateFileContents({
                owner: this.orgName,
                repo: this.repoName,
                path: lockFile,
                content: '',
                branch: this.mainBranchName,
                message: `Locking container [${containerName}]`,
                sha: latestCommit.sha
            })
            return [true, `SUCCESS: Locked the container [${containerName}]`, lockResponse]
        } catch(err) {
            return [false, `FAILED: Unable to lock the container [${containerName}]`, err]
        }
    }

    /**
     * @description Unlocks a container by deleting the lock file in the container.
     * @function unlockContainer
     * @async
     * @param {string} containerName - The name of the container to unlock.
     * @param {string} commitSha - The SHA of the commit to use as the head of the pull request.
     * @returns {Promise<[boolean, string, object]>} A promise that resolves to an array containing a boolean indicating success, a success message, and the response from the GitHub API.
     * @throws {Error} If an error occurs while getting the latest commit or deleting the lock file.
     * @memberof GitHubFunctions
    */
    async unlockContainer(containerName, commitSha, branchName = this.mainBranchName) {
        // Define the full path to the lockfile
        const lockFile = `${containerName}/${this.lockFileName}`
        const lockExists = await this.checkForLock(containerName)

        // TODO: Change to try and catch
        if(lockExists[0]) {
            // NOTICE: DON'T USE DELETE AS THIS COMPLETELY REMOVES THE REPOSITORY WITHOUT MUCH WARNING
            const unlockResponse = await this.octCtl.rest.repos.deleteFile({
                owner: this.orgName,
                repo: this.repoName,
                path: lockFile,
                branch: branchName,
                message: `Unlocking container [${containerName}]`,
                sha: commitSha
            })
            return [true, `SUCCESS: Unlocked the container [${containerName}]`, unlockResponse]
        } else {
            return [false, `FAILED: Unable to unlock the container [${containerName}]`, null]
        }
    }

    // Create a method using the octokit called deleteBlob to delete a file from the repo
    async deleteBlob(containerName, fileName, branchName, sha) {
        // Using the github API delete a file from the container
        try {
            const deleteResponse = await this.octCtl.rest.repos.deleteFile({
                owner: this.orgName,
                repo: this.repoName,
                path: `${containerName}/${fileName}`,
                branch: branchName,
                message: `Delete object [${fileName}]`,
                sha: sha
            })
            // Return the delete response if the delete was successful or an error if not
            return [true, {status_code: 200, status_msg: `deleted object [${fileName}] from container [${containerName}]`}, deleteResponse]
        } catch (err) { 
            // Return the error
            return [false, {status_code: 503, status_msg: `unable to delete object [${fileName}] from container [${containerName}]`}, err]
        }
    }

    // Create a method using the octokit to write a file to the repo
    async writeBlob(containerName, fileName, blob, branchName, sha) {
        // Only pull in the file name
        const fileBits = fileName.split('/')
        const shortFilename = fileBits[fileBits.length - 1]
        // Using the github API write a file to the container
        let octoObj = {
            owner: this.orgName,
            repo: this.repoName,
            path: `${containerName}/${shortFilename}`,
            message: `Create object [${shortFilename}]`,
            content: blob,
            branch: branchName
        }
        if(sha) {
            octoObj.sha = sha
        }
        try {
            const writeResponse = await this.octCtl.rest.repos.createOrUpdateFileContents(octoObj)
            // Return the write response if the write was successful or an error if not
            return [true, `SUCCESS: wrote object [${fileName}] to container [${containerName}]`, writeResponse]
        } catch (err) { 
            // Return the error
            return [false, `ERROR: unable to write object [${fileName}] to container [${containerName}]`, err]
        }
    }

    /**
     * @function writeObject
     * @description Writes an object to a specified container using the GitHub API.
     * @async
     * @param {string} containerName - The name of the container to write the object to.
     * @param {object} obj - The object to write to the container.
     * @param {string} ref - The reference to use when writing the object.
     * @returns {Promise<string>} A promise that resolves to the response from the GitHub API.
     * @throws {Error} If an error occurs while writing the object.
     * @memberof GitHubFunctions
     * @todo Add a check to see if the container is locked and if so return an error.
    */
    async writeObject(containerName, obj, ref, mySha) {
        // Using the github API write a file to the container
        try {
            const writeResponse = await this.octCtl.rest.repos.createOrUpdateFileContents({
                owner: this.orgName,
                repo: this.repoName,
                path: `${containerName}/${this.objectFiles[containerName]}`,
                message: `Create object [${this.objectFiles[containerName]}]`,
                content: Buffer.from(JSON.stringify(obj)).toString('base64'),
                branch: ref,
                sha: mySha
            })
            // Return the write response if the write was successful or an error if not
            return [true, `SUCCESS: wrote object [${this.objectFiles[containerName]}] to container [${containerName}]`, writeResponse]
        } catch (err) { 
            // Return the error
            return [false, `ERROR: unable to write object [${this.objectFiles[containerName]}] to container [${containerName}]`, err]
        }
    }


    
    /**
     * @function readObjects
     * @description Reads objects from a specified container using the GitHub API.
     * @async
     * @param {string} containerName - The name of the container to read objects from.
     * @returns {Promise<string>} A promise that resolves to the decoded contents of the objects.
     * @throws {Error} If an error occurs while getting the content or parsing it.
     * @memberof GitHubFunctions
     */
    async readObjects(containerName) {
        // Using the GitHub API get the contents of a file
        try {
            let objectContents = await this.octCtl.rest.repos.getContent({
                owner: this.orgName,
                repo: this.repoName,
                ref: this.mainBranchName,
                path: `${containerName}/${this.objectFiles[containerName]}`
            })

            // Decode the contents
            const decodedContents = Buffer.from(objectContents.data.content, 'base64').toString()

            // Parse the contents
            objectContents.mrJson = JSON.parse(decodedContents)

            // Return the contents
            return [true, `SUCCESS: read and returned [${containerName}/${this.objectFiles[containerName]}]`, objectContents]
        } catch (err) {
            // Return the error
            return [false, `ERROR: unable to read [${containerName}/${this.objectFiles[containerName]}]`, err]
        }
    }


    /**
     * @function updateObject
     * @description Reads an object from a specified container using the GitHub API.
     * @async
     * @param {string} containerName - The name of the container to read the object from.
     * @param {string} objName - The name of the object to update.
     * @param {string} key - The key of the object to update.
     * @param {string} value - The value to update the key with.
     * @param {boolean} [dontWrite=false] - A flag to indicate if the object should be written back to the container or not.
     * @param {boolean} [system=false] - A flag to indicate if the update is a system call or not.
     * @param {Array} [whiteList=[]] - A list of keys that are allowed to be updated.
     * @returns {Promise<Array>} A promise that resolves to the decoded contents of the object.
     * @memberof GitHubFunctions
     * @todo As deleteObject progresses look to see if we can improve here too
     */
    async updateObject(containerName, objName, key, value, dontWrite=false, system=false, whiteList=[]) {
        // console.log(`Updating object [${objName}] in container [${containerName}] with key [${key}] and value [${value}]`)
        // Check to see if this is a system call or not
        if(!system) {
            // Since this is not a system call check to see if the key is in the white list
            if(!whiteList.includes(key)) { 
                return [
                    false, 
                    {
                        status_code: 403, 
                        status_msg: `Updating the key [${key}] is not supported.`
                    },
                    null
                ] 
            }
        }
        // Using the method above read the objects
        const readResponse = await this.readObjects(containerName)
        // Check to see if the read was successful
        if(!readResponse[0]) { 
            return [
                false, 
                {status_code: 500, status_msg: `Unable to read source objects from GitHub.`}, 
                readResponse
            ] 
        }

        // Catch the container if needed
        let repoMetadata = {
            containers: {}, 
            branch: {}
        }
        

        // If dontWrite is true then don't catch the container
        let caught = {}
        if(!dontWrite) {
            repoMetadata.containers[containerName] = {}
            caught = await this.catchContainer(repoMetadata)
        }

        // Loop through the objects, find and update the objects matching the name
        for (const obj in readResponse[2].mrJson) {
            if(readResponse[2].mrJson[obj].name === objName) {
                readResponse[2].mrJson[obj][key] = value
                // Update the modified date of the object
                const now = new Date()
                readResponse[2].mrJson[obj].modification_date = now.toISOString()
            }
        }
        

        // If this flag is set merely return the modified object(s) to the caller
        if (dontWrite) { 
            return [
                true, 
                {
                    status_code: 200, 
                    status_msg: `Merged updates object(s) with [${containerName}] objects.`
                }, 
                readResponse[2].mrJson
            ] 
        }

        // Call the method above to write the object
        const writeResponse = await this.writeObject(
            containerName, 
            readResponse[2].mrJson, 
            caught[2].branch.name,
            caught[2].containers[containerName].objectSha)
        // Check to see if the write was successful and return the error if not
        if(!writeResponse[0]) { 
            return [
                false,
                {status_code: 503, status_msg: `Unable to write the objects.`}, 
                writeResponse
            ] 
        }

        // Release the container
        const released = await this.releaseContainer(caught[2])
        if(!released[0]) { 
            return [
                false, 
                {
                    status_code: 503,
                    status_msg: `Cannot release the container please check [${containerName}] in GitHub.`
                }, 
                released
            ] 
        }

        // Finally return success with the results of the release
        return [
            true, 
            {
                status_code: 200, 
                status_msg: `Updated [${containerName}] object of the name [${objName}] with [${key} = ${value}].`
            }, 
            released
        ]
    }

    /**
     * @function deleteObject
     * @description Deletes an object from a specified container using the GitHub API.
     * @async
     * @param {string} objName - The name of the object to delete.
     * @param {object} source - The source object that contains the from and to containers.
     * @returns {Promise<Array>} A promise that resolves to the decoded contents of the object.
     * @memberof GitHubFunctions
     */
    async deleteObject(objName, source, repoMetadata=null, catchIt=true) {
        // NOTE: source has a weakness we will have to remedy later, notably from can be Studies and Companies
        // source = {
        //     from: 'Interactions',
        //     to: ['Companies']
        // }

        // Create an object that maps the from object type to the to object type fields to be updated
        const fieldMap = {
            Interactions: {
                Companies: 'linked_interactions',
                // Studies: 'linked_interactions'
            },
            Companies: {
                Interactions: 'linked_companies',
                // Studies: 'linked_companies'
            },
            Studies: {
                Interactions: 'linked_studies',
                Companies: 'linked_studies'
            }
        }

        // Catch the container if needed
        if(catchIt) {
            repoMetadata = {
                containers: {}, 
                branch: {}
            }

            // Catch the container(s)
            repoMetadata.containers[source.from] = {}
            repoMetadata.containers[source.to[0]] = {}
            let caught = await this.catchContainer(repoMetadata)
            repoMetadata = caught[2]
        }   


        // Loop through the from objects, find and remove the objects matching the name
        for (const obj in repoMetadata.containers[source.from].objects) {
            if(repoMetadata.containers[source.from].objects[obj].name === objName) {
                // If from is Interactions then we need to delete the actual file from the repo based on objName
                if(source.from === 'Interactions') {
                    // Obtain the sha of the object to delete by obtaining the file name from the url attribute of the Interaction
                    const fileName = repoMetadata.containers[source.from].objects[obj].url
                    // Obtain the sha for fileName using octokit
                    const { data } = await this.octCtl.rest.repos.getContent({
                        owner: this.orgName,
                        repo: this.repoName,
                        path: fileName
                    })
                    // Remove the path from the file name
                    const fileBits = fileName.split('/')
                    const shortFilename = fileBits[fileBits.length - 1]
                    // Call the method above to delete the object using data.sha
                    const deleteResponse = await this.deleteBlob(
                        source.from, 
                        shortFilename, 
                        repoMetadata.branch.name,
                        data.sha
                    )
                    // Check to see if the delete was successful and return the error if not
                    if(!deleteResponse[0]) {
                        return [
                            false,
                            {status_code: 503, status_msg: `Unable to delete the [${source.from}] object [${objName}].`}, 
                            deleteResponse
                        ] 
                    }
                }
                // Remove the object from the array
                repoMetadata.containers[source.from].objects.splice(obj, 1)
            }
        }
        

        // Loop through the to objects, find and remove objName from the linked objects and update the modification date
        for (const obj in repoMetadata.containers[source.to[0]].objects) {
            if(objName in repoMetadata.containers[source.to[0]].objects[obj][fieldMap[source.from][source.to[0]]]) {
                // Delete the object from the linked objects object
                delete repoMetadata.containers[source.to[0]].objects[obj][fieldMap[source.from][source.to[0]]][objName]
                // Update the modification date of the object
                const now = new Date()
                repoMetadata.containers[source.to[0]].objects[obj].modification_date = now.toISOString()
            }
        }

        // Call getSha to get the sha of the from object
        const fromSha = await this.getSha(source.from, this.objectFiles[source.from], repoMetadata.branch.name)
        // Check to see if the sha was captured and return the error if not
        if(!fromSha[0]) {
            return [
                false,
                {status_code: 503, status_msg: `Unable to capture the [${source.from}] sha.`},
                fromSha
            ]
        }

        // Call the method above to write the from objects
        const writeResponse = await this.writeObject(
            source.from, 
            repoMetadata.containers[source.from].objects, 
            repoMetadata.branch.name,
            fromSha[2])
        // Check to see if the write was successful and return the error if not
        if(!writeResponse[0]) {
            console.log(writeResponse)
            return [
                false,
                {status_code: 503, status_msg: `Unable to write the [${source.from}] objects.`}, 
                writeResponse
            ] 
        }

        // Call getSha to get the sha of the to object
        const toSha = await this.getSha(source.to[0], this.objectFiles[source.to[0]], repoMetadata.branch.name)
        // Check to see if the sha was captured and return the error if not
        if(!toSha[0]) {
            return [
                false,
                {status_code: 503, status_msg: `Unable to capture the [${source.to[0]}] sha.`},
                toSha
            ]
        }

        // Call the method above to write the to objects
        const writeResponse2 = await this.writeObject(
            source.to, 
            repoMetadata.containers[source.to[0]].objects, 
            repoMetadata.branch.name,
            toSha[2])
        // Check to see if the write was successful and return the error if not
        if(!writeResponse2[0]) {
            return [
                false,
                {status_code: 503, status_msg: `Unable to write the [${source.to}] objects.`}, 
                writeResponse2
            ] 
        }

        // Release the container
        if(catchIt){
            const released = await this.releaseContainer(repoMetadata)
            if(!released[0]) { 
                return [
                    false, 
                    {
                        status_code: 503,
                        status_msg: `Cannot release the container please check [${source.from}] in GitHub.`
                    }, 
                    released
                ] 
            }
            // Finally return success with the results of the release
            return [
                true, 
                {
                    status_code: 200, 
                    status_msg: `Deleted [${source.from}] object of the name [${objName}], and links in associated objects.`
                }, 
                released
            ]
        } else {
            // Return success with the write reponses
            return [
                true, 
                {
                    status_code: 200, 
                    status_msg: `Deleted [${source.from}] object of the name [${objName}], and links in associated objects.`
                }, 
                [writeResponse, writeResponse2]
            ]
        }

        
    }

    /**
     * @function catchContainer
     * @description Catches a container by locking it, creating a new branch, reading the objects, and returning the metadata.
     * @param {Object} repoMetadata - The metadata object that contains the containers and branch information.
     * @returns {Promise<Array>} A promise that resolves to an array containing a boolean indicating success, a success message, and the metadata object.
     * @memberof GitHubFunctions
     */
    async catchContainer(repoMetadata) {
        // Check to see if the containers are locked
        for (const container in repoMetadata.containers) {
            // Call the method above to check for a lock
            const lockExists = await this.checkForLock(container)
            // If the lock exists return an error
            if(lockExists[0]) { return [false, {status_code: 503, status_msg:`the container [${container}] is locked unable and cannot perform creates, updates or deletes on objects.`}, lockExists] }
        }

        // Lock the containers
        for (const container in repoMetadata.containers) {
            // Call the method above to lock the container
            const locked = await this.lockContainer(container)
            // Check to see if the container was locked and return the error if not
            if(!locked[0]) { return [false, {status_code: 503, status_msg: `unable to lock [${container}] and cannot perform creates, updates or deletes on objects.`}, locked] }
            // Save the lock sha
            repoMetadata.containers[container].lockSha = locked[2].data.content.sha
        }

        
        // Call the method above createBranchFromMain to create a new branch
        const branchCreated = await this.createBranchFromMain()
        // Check to see if the branch was created
        if(!branchCreated[0]) { return [false, {status_code: 503, status_msg: `unable to create new branch`}, branchCreated] }
        // Save the branch sha into containers as a separate object
        repoMetadata.branch = {
            name: branchCreated[2].data.ref,
            sha: branchCreated[2].data.object.sha
        }

        // Read the objects from the containers
        for (const container in repoMetadata.containers) {
            // Call the method above to read the objects
            const readResponse = await this.readObjects(container)
            // Check to see if the read was successful
            if(!readResponse[0]) { return [false, {status_code: 503, status_msg: `Unable to read the source objects [${container}/${this.objectFiles[container]}].`}, readResponse] }
            // Save the object sha into containers as a separate object
            repoMetadata.containers[container].objectSha = readResponse[2].data.sha
            // Save the objects into containers as a separate object
            repoMetadata.containers[container].objects = readResponse[2].mrJson
        }

        return [true,{status_code: 200, status_msg: `${repoMetadata.containers.length} containers are ready for use.`}, repoMetadata]
    }


    /**
     * @function releaseContainer
     * @description Releases a container by unlocking it and merging the branch to main.
     * @param {Object} repoMetadata - The metadata object that contains the containers and branch information.
     * @returns {Promise<Array>} A promise that resolves to an array containing a boolean indicating success, a success message, and the response from the GitHub API.
     * @memberof GitHubFunctions
     */
    async releaseContainer(repoMetadata) {
        // Merge the branch to main
        const mergeResponse = await this.mergeBranchToMain(repoMetadata.branch.name, repoMetadata.branch.sha)
        // Check to see if the merge was successful and return the error if not
        if(!mergeResponse[0]) { return [false,{status_code:503, status_msg: `Unable to merge the branch to main.`}, mergeResponse] }

        // Unlock the containers by looping through them
        for (const container in repoMetadata.containers) {
            // Call the method above to unlock the container
            const branchUnlocked = await this.unlockContainer(
                container, 
                repoMetadata.containers[container].lockSha,
                repoMetadata.branch.name)
            if(!branchUnlocked[0]) { return [false, {status_code: 503, status_msg: `Unable to unlock the container, objects may have been written please check [${container}] for objects and the lock file.`}, branchUnlocked] }
            // Unlock main
            const mainUnlocked = await this.unlockContainer(
                container, 
                repoMetadata.containers[container].lockSha
            )
            if(!mainUnlocked[0]) { return [false, {status_code: 503, status_msg: `Unable to unlock the container, objects may have been written please check [${container}] for objects and the lock file.`}, mainUnlocked] }
        }
    
        // Return success with number of objects written
        return [true, {status_code: 200, status_msg: `Released [${repoMetadata.containers.length}] containers.`}, null]
    }

    // Use fs to read all the files in the actions directory recursively
    generateActionsManifest(dir, filelist) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        dir = dir || path.resolve(path.join(__dirname, './actions') )
        const files = fs.readdirSync(dir)
        filelist = filelist || []
        files.forEach((file) => {
            // Skip .DS_Store files and node_modules directories
            if (file === '.DS_Store' || file === 'node_modules') {
                return
            }
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                filelist = generateActionsManifest(path.join(dir, file), filelist) 
            }
            else {
                // Substitute .github for the first part of the path, in the variable dir
                // Log dir to the console including if there are any special characters
                if (dir.includes('./')) {
                    dir = dir.replace('./', '')
                }
                // This will be the repository name
                let dotGitHub = dir.replace(/.*(workflows|actions)/, '.github/$1')

                filelist.push({
                    fileName: file,
                    containerName: dotGitHub,
                    srcURL: new URL(path.join(dir, file), import.meta.url)
                })
            }
        })
        return filelist
    } 

    async installActions() {
        let actionsManifest = this.generateActionsManifest()
        // Loop through the actionsManifest and install each action
        await actionsManifest.forEach(async (action) => {
            let status = false
            let blobData
            try {
                // Read in the blob file
                blobData = fs.readFileSync(action.srcURL, 'base64')
                status = true
            } catch (err) {
                return [false, 'Unable to read file [' + action.fileName + '] because: ' + err, null]
            }
            if(status) {
                // Install the action
                const installResp = await this.writeBlob(
                    action.containerName, 
                    action.fileName, 
                    blobData, 
                    'main'
                )
            } else {
                return [false, 'Failed to read item [' + action.fileName + ']', null]
            }
        })
        return [true, 'All actions installed', null]
    }

}

export default GitHubFunctions