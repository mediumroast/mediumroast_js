const core = require('@actions/core')
const github = require('@actions/github')

async function run(maxBranches) {
    try {
      const token = core.getInput('github-token', { required: true })
      const octokit = github.getOctokit(token)
  
      let { data: branches } = await octokit.rest.repos.listBranches({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
      })
      
      //   Create a variable to keep track of the number of non-number branches
      let nonNumberBranchCount = 0
      for (const branch of branches) {
        // Skip any branch is that is not a number (e.g. master, main, etc.), but keep a count of them. 
        if (isNaN(branch.name)) {
            nonNumberBranchCount++
            continue
        }

        // If the branch count is greater than the maxBranches, assuming this timestamp format 1706153906529, find all of the oldest branches greater than the maxBranches and put them in an array
        if (branches.length - nonNumberBranchCount > maxBranches) {
            const branchTimestamp = parseInt(branch.name)
            const branchesToDelete = branches.filter(b => parseInt(b.name) < branchTimestamp)
            for (const branchToDelete of branchesToDelete) {
                // Log the branch name to be deleted
                console.log(`Deleting branch ${branchToDelete.name}`)
                await octokit.rest.git.deleteRef({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    ref: `heads/${branchToDelete.name}`,
                })
                // Remove the branch from the branches array
                branches.splice(branches.indexOf(branchToDelete), 1)
            }
        }
      }
    } catch (error) {
      core.setFailed(error.message)
    }
  }

//   Set a variable maxBranches to 15
const maxBranches = 15
run(maxBranches)