import { Octokit } from "octokit"


class GitHubFunctions {
    /**
     * @constructor
     * @classdesc Core functions needed to interact with the GitHub API for mediumroast.io.
     * @param {String} token - the GitHub token for the mediumroast.io application
     * @param {String} org - the GitHub organization for the mediumroast.io application
     * @param {String} processName - the name of the process that is using the GitHub API
     * @todo Evolve as the backend improves authentication and authorization
     * @todo Add a check to see if the repo exists and if so return an error
     * @todo Add a check to see if the repo is private and if not return an error
     * 
     * @example
     * const gitHubCtl = new GitHubFunctions(accessToken, myOrgName, 'mr-cli-setup')
     * const createRepoResp = await gitHubCtl.createRepository()
     * const createContainersResp = await gitHubCtl.createContainers()
     * const createBranchResp = await gitHubCtl.createBranchFromMain()
     * const mergeBranchResp = await gitHubCtl.mergeBranchToMain(createBranchResp[2].data.ref, createBranchResp[2].data.object.sha)
     * const lockContainerResp = await gitHubCtl.lockContainer('Studies')
     * const unlockContainerResp = await gitHubCtl.unlockContainer('Studies', lockContainerResp[2].data.commit.sha)
     * const writeObjectResp = await gitHubCtl.writeObject('Studies', studies, mergeBranchResp[2].data.ref)
     * const readObjectsResp = await gitHubCtl.readObjects('Studies')
     * const updateObjectResp = await gitHubCtl.updateObject('Studies', '1', 'name', 'Updated Study Name')
     * const createObjectsResp = await gitHubCtl.createObjects('Studies', studies)
     * 
    */
    constructor (token, org, processName) {
        this.token = token
        this.orgName = org
        this.repoName = `${org}_mediumroast_app_repo`
        this.repoDesc = `A repository for all of the mediumroast.io application assets.`
        this.octCtl = new Octokit({auth: token})
        this.lockFileName = `${processName}.lock`
        this.mainBranchName = 'main'
        this.objectFiles = {
            Studies: 'Studies.json',
            Companies: 'Companies.json',
            Interactions: 'Interactions.json'
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
        
        const lockExists = mainContents.data.some(
            item => item.path === `${containerName}/${this.lockFileName}`
        )

        if (lockExists) {
            return [true, `SUCCESS: container [${containerName}] is locked with lock file [${this.lockFileName}]`]
        } else {
            return [false, `FAILED: container [${containerName}] is not locked with lock file [${this.lockFileName}]`]
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
        const lockExists = await this.checkForLock(containerName)

        // Get the latest commit
        const {data: latestCommit} = await this.octCtl.rest.repos.getCommit({
            owner: this.orgName,
            repo: this.repoName,
            ref: this.mainBranchName,
        })

        if(!lockExists[0]) {
            const lockResponse = await this.octCtl.rest.repos.createOrUpdateFileContents({
                owner: this.orgName,
                repo: this.repoName,
                path: lockFile,
                content: '',
                branch: this.mainBranchName,
                message: `Locking container [${containerName}]`,
                sha: latestCommit.sha
            })
            return [true, `SUCCESS: Locked the container [${containerName}]`, lockResponse]
        } else {
            return [false, `FAILED: Unable to lock the container [${containerName}]`, lockResponse]
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
            return [true, `SUCCESS: wrote object [${this.objectFiles[containerName]}] to [${containerName}/${this.objectFiles[containerName]}]`, writeResponse]
        } catch (err) { 
            // Return the error
            return [false, `ERROR: unable to write object [${obj.id}] to [${containerName}/${this.objectFiles[containerName]}]`, err]
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
     * @param {string} objId - The id of the object to read.
     * @returns {Promise<string>} A promise that resolves to the decoded contents of the object.
     * @throws {Error} If an error occurs while getting the content or parsing it.
     * @memberof GitHubFunctions
     * @todo Add a check to see if the container is locked and if so return an error.
     */
    async updateObject(containerName, objId, key, value) {
        // Using the method above read the objects
        const readResponse = await this.readObjects(containerName)

        // Check to see if the read was successful
        if(!readResponse[0]) { return [false, `ERROR: unable to read the source objects.`, readResponse] }

        // using objId, key and value update the object
        const updatedObj = readResponse[2][objId]
        updatedObj[key] = value

        // Call the method above to lock the container
        const locked = await this.lockContainer(containerName)
        // Check to see if the container was locked
        if(!locked[0]) { return [true, `ERROR: Unable to lock the container`, locked] }

        // Call the method above createBranchFromMain to create a new branch
        const branchCreated = await this.createBranchFromMain()
        // Check to see if the branch was created
        if(!branchCreated[0]) { return [true, `ERROR: Unable to create new branch`, branchCreated] }

        // Merge the objects with the updated object
        let mergedObjects = {...readResponse[2], ...updatedObj}
        // TODO: Test this conversion to see if it works
        // Convert the objects to and array of objects
        mergedObjects = Object.values(mergedObjects)
        // Call the method above to write the object
        const writeResponse = await this.writeObject(containerName, mergedObjects, branchCreated[2].data.ref)
        // Check to see if the write was successful and return the error if not
        if(!writeResponse[0]) { return [false,`ERROR: Unable to write the objects.`, writeResponse] }

        // Call the method above to merge the branch to main
        const mergeResponse = await this.mergeBranchToMain(branchCreated[2].data.ref, writeResponse[2].data.commit.sha)
        // Check to see if the merge was successful and return the error if not
        if(!mergeResponse[0]) { return [false,`ERROR: Unable to merge the branch to main.`, mergeResponse] }

        // Call the method above to unlock the container
        const unlocked = await this.unlockContainer(containerName, writeResponse[2].data.commit.sha)
        if(!unlocked[0]) { return unlocked }

    }


    /**
     * @function createObjects
     * @description Creates objects in a specified container using the GitHub API.
     * @async
     * @param {string} containerName - The name of the container to create the objects in.
     * @param {object} objs - The objects to create in the container.
     * @returns {Promise<string>} A promise that resolves to the decoded contents of the object.
     * @throws {Error} If an error occurs while getting the content or parsing it.
     * @memberof GitHubFunctions
     */
    async createObjects(containerName, objs) {
        // Call the method above to check for a lock
        const lockExists = await this.checkForLock(containerName)
        // If the lock exists return an error
        if(lockExists[0]) { return [false, `ERROR: The container [${containerName}] is locked unable to create objects.`] }


        // Lock the container
        const locked = await this.lockContainer(containerName)
        // Check to see if the container was locked and return the error if not
        if(!locked[0]) { return [false, `ERROR: Unable to lock [${containerName}] cannot create new objects.`, locked] }
        const lockSha = locked[2].data.content.sha
        
        // Call the method above createBranchFromMain to create a new branch
        const branchCreated = await this.createBranchFromMain()
        // Check to see if the branch was created
        if(!branchCreated[0]) { return [false, `ERROR: Unable to create new branch`, branchCreated] }
        const branchSha = branchCreated[2].data.object.sha
        const branchName = branchCreated[2].data.ref

        // Call the method above to read the objects
        const readResponse = await this.readObjects(containerName)
        // Check to see if the read was successful
        if(!readResponse[0]) { return [false, `ERROR: unable to read the source objects [${containerName}/${this.objectFiles[containerName]}].`, readResponse] }
        const objectSha = readResponse[2].data.sha

        // Merge the objects with the updated object which are an array of objects
        let mergedObjects = [...readResponse[2].mrJson, ...objs]


        // Write the objects to the new branch
        const writeResponse = await this.writeObject(containerName, mergedObjects, branchName, objectSha)
        // Check to see if the write was successful and return the error if not
        if(!writeResponse[0]) { return [false,`ERROR: Unable to write the objects to [${containerName}/${this.objectFiles[containerName]}].`, writeResponse] }

        // Merge the branch to main
        const mergeResponse = await this.mergeBranchToMain(branchName, branchSha)
        // Check to see if the merge was successful and return the error if not
        if(!mergeResponse[0]) { return [false,`ERROR: Unable to merge the branch to main.`, mergeResponse] }

        // Unlock the container
        const unlocked = await this.unlockContainer(containerName, lockSha)
        if(!unlocked[0]) { return [false, `ERROR: Unable to unlock the container, objects may have been written please check [${containerName}] for objects and the lock file.`, unlocked] }
        
        // Return success with number of objects written
        return [true, `SUCCESS: [${objs.length}] object(s) written to [${containerName}/${this.objectFiles[containerName]}].`, null]
    }
}

export default GitHubFunctions