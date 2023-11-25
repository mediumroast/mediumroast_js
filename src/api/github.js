import { Octokit } from "octokit"


class GitHubFunctions {
    constructor (token, org) {
        this.token = token
        this.orgName = org
        this.repoName = `${org}_mediumroast_app_repo`
        this.repoDesc = `A repository for all of the mediumroast.io application assets.`
        this.octCtl = new Octokit({auth: token})
    }

    /**
     * @function createRepository
     * @description Creates a repository, at the organization level, for keeping track of all mediumroast.io assets
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the created repo or error message.
     */
    async createRepository () {
        try {
            const response = await this.octCtl.rest.repos.createInOrg({
              org: this.orgName,
              name: this.repoName,
              description: this.repoDesc,
            })
            return [true, response.data]
          } catch (err) {
            return[false, err.message]
          }
    }

    /**
     * @function deleteRepository
     * @description Deletes a repository, at the organization level, that keeps track of all mediumroast.io assets
     * @returns {Array} An array with position 0 being boolean to signify success/failure and position 1 being the deleted repo or error message.
     */
    async deleteRepository () {
        try {
            const response = await this.octCtl.rest.repos.delete({
              owner: this.orgName,
              repo: this.repoName,
            })
            return [true, response.data]
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
                    owner: 'mediumroast',
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
}

export default GitHubFunctions