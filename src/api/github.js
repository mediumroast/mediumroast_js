import { Octokit } from "octokit"


class GitHubFunctions {
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
        let emptyJson = Buffer.from(JSON.stringify({})).toString('base64')
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

    async mergeBranchToMain(branchName, mySha, commitDescription='Performed CRUD operation on objects.') {
        try {
            // Create a new branch
            const createBranchResponse = await this.octCtl.rest.git.createRef({
              owner: this.orgName,
              repo: this.repoName,
              ref: `refs/heads/${branchName}`,
              sha: mySha,
            })
        
            // Create a pull request
            const createPullRequestResponse = await octokit.rest.pulls.create({
              owner: this.orgName,
              repo: this.repoName,
              title: commitDescription,
              head: branchName,
              base: this.mainBranchName,
              body: commitDescription,
            })
        
            // Merge the pull request
            const mergeResponse = await octokit.rest.pulls.merge({
              owner: this.orgName,
              repo: this.repoName,
              pull_number: createPullRequestResponse.data.number,
              commit_title: commitDescription,
            })
        
            return [true, 'SUCCESS: Pull request created and merged successfully', mergeResponse]
          } catch (error) {
            return [false, `FAILED: Pull request not created or merged successfully due to [${error.message}]`, mergeResponse]
          }
    }

    async checkForLock(containerName) {
        // Get the latest commit
        const {data: latestCommit} = await this.octCtl.rest.repos.getCommit({
            owner: this.orgName,
            repo: this.repoName,
            ref: this.mainBranchName,
        })

        // Check to see if the lock file exists
        const {data: mainContents} = await this.octCtl.rest.repos.getContent({
            owner: this.orgName,
            repo: this.repoName,
            ref: latestCommit.sha,
            path: containerName
        })
        
        const lockExists = mainContents.some(
            item => item.path === this.lockFileName
        )

        if (lockExists) {
            return [true, `SUCCESS: container [${containerName}] is locked with lock file [${this.lockFileName}]`]
        } else {
            return [false, `FAILED: container [${containerName}] is not locked with lock file [${this.lockFileName}]`]
        }
    }

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

    async unlockContainer(containerName, commitSha) {
        // Define the full path to the lockfile
        const lockFile = `${containerName}/${this.lockFileName}`
        const lockExists = this.checkForLock(containerName)

        // Get the latest commit
        const {data: latestCommit} = await this.octCtl.rest.repos.getCommit({
            owner: this.orgName,
            repo: this.repoName,
            ref: this.mainBranchName,
        })

        console.log(latestCommit.sha)

        if(lockExists) {
            // TODO: DON'T USE DELETE AS THIS COMPLETELY REMOVES THE REPOSITORY WITHOUT MUCH WARNING
            const unlockResponse = await this.octCtl.rest.repos.deleteFile({
                owner: this.orgName,
                repo: this.repoName,
                path: lockFile,
                branch: this.mainBranchName,
                message: `Unlocking container [${containerName}]`,
                sha: commitSha

            })
            return [true, `SUCCESS: Unlocked the container [${containerName}]`, unlockResponse]
        } else {
            return [false, `FAILED: Unable to unlock the container [${containerName}]`, unlockResponse]
        }
    }

    async readObjects(containerName) {

    }

    async deleteObjects (containerName, objs) {

    }

    async updateObject(containerName, objId, key, value) {

    }

    async createObjects(containerName, objs) {
        // Lock the container
        const locked = await this.lockContainer(containerName)
        if(!locked[0]) { return locked }
        const contentSha = locked[3].data.content.sha // NOTE: This sha is needed to perform a delete
        
        // Create a new branch


        // Get existing objects
        // Find the latest object id
        // Add N+M to the latest object id for each new object by appending on the end
        // Write objects
        // Merge the branch to main

        // Unlock the container
        const unlocked = await this.unlockContainer(containerName, contentSha)
        if(!unlocked[0]) { return unlocked }
        
        // Return success with number of objects written
        return [true, null]
    }
}

export default GitHubFunctions