const github = require('@actions/github')
const core = require('@actions/core')

async function readObjects (fileName) {
    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    const { data: file } = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: fileName,
        ref: 'main'
    })

    // check to see if the file is empty and if it is return an empty object
    if (file.size === 0) {
        return []
    }

    // Return the file content as an object
    return JSON.parse(Buffer.from(file.content, 'base64').toString())
}

async function readWorkflows () {
    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    const workflows = await octokit.rest.actions.listWorkflowRunsForRepo({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    })

    const workflowList = []
    let totalRunTimeThisMonth = 0
    for (const workflow of workflows.data.workflow_runs) {
        // Get the current month
        const currentMonth = new Date().getMonth()
        
        // Compute the runtime and if the time is less than 60s round it to 1m
        const runTime = Math.ceil((new Date(workflow.updated_at) - new Date(workflow.created_at)) / 1000 / 60) < 1 ? 1 : Math.ceil((new Date(workflow.updated_at) - new Date(workflow.created_at)) / 1000 / 60)

        // If the month of the workflow is not the current month, then skip it
        if (new Date(workflow.updated_at).getMonth() !== currentMonth) {
            continue
        }
        totalRunTimeThisMonth += runTime

        // Add the workflow to the workflowList
        workflowList.push({
            run_time_minutes: runTime,
            path: workflow.path,
            name: workflow.path.replace('.github/workflows/', '').replace('.yml', ''),
            run_time_name: workflow.name,
            conclusion: workflow.conclusion,
            created_at: workflow.created_at,
            updated_at: workflow.updated_at,
            html_url: workflow.html_url
        })
    }

    // Sort the worflowList to put the most recent workflows first
    workflowList.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    // log the length of the workflowList
    console.log(`Number of workflows: ${workflowList.length}`)
    
    return {allWorkFlows: workflowList, runTime: totalRunTimeThisMonth}
}

async function readBranches () {
    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    let { data: branches } = await octokit.rest.repos.listBranches({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    })

    // Loop through the branches to obtain the latest commit comment, author, and date added to the branch, and then add them to the branches array
    for (const branch of branches) {
        const { data: commit } = await octokit.rest.repos.getBranch({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            branch: branch.name
        })
        branch.commit = commit.commit.sha
        branch.author = commit.commit.author.name
        branch.date = commit.commit.author.date
    }

    return branches
}

// Create a function that compares the current list of companies and the associated markdown files for each company present in the repository. Should there be a markdown file for a company that is not in the current list of companies, then the file should be deleted.
async function reconcileCompanyFiles (companies) {
    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    // Get the list of company files
    const { data: companyFiles } = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: 'Companies',
        ref: 'main'
    })
    // Filter in only the markdown files that aren't the README.md
    const companyFilesFiltered = companyFiles.filter(file => file.name.endsWith('.md') && file.name !== 'README.md')

    // Using the supplied companies create a new object with the key being the company markdown and the value being the company name
    let markdownToCompanies = companies.reduce((acc, company) => {
        const markdown = company.name.replace(/[\s,.\?!]/g, '')
        acc[`${markdown}.md`] = company.name
        return acc
    }  , {})

    // Check to see if if each companyFilesFiltered is in the markdownToCompanies object, if it isn't then delete the file
    const deleteFiles = []
    for (const file of companyFilesFiltered) {
        if (!markdownToCompanies[file.name]) {
            await octokit.rest.repos.deleteFile({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                path: `Companies/${file.name}`,
                message: `Delete ${file.name} report`,
                branch: 'main'
            })
            // Add the file to the deleteFiles array
            deleteFiles.push(file.name)
        }
    }
    // Return the deleteFiles array
    return deleteFiles
}

async function saveReports (reports, inputs) {
    // Reconile the company files
    const prunedMarkdowns = await reconcileCompanyFiles(inputs.companies)

    const token = core.getInput('github-token', { required: true })
    const octokit = github.getOctokit(token)

    // Create or update each file in a single commit
    for (const report of reports) {
        // Get the sha of the file if it exists
        try {
            const { data: file } = await octokit.rest.repos.getContent({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                path: report.path,
                ref: 'main'
            })
            // If the file exists then get the sha
            if (file) {
                report.sha = file.sha
            }
        } catch (error) {
            // If the file doesn't exist then set the sha to null
            report.sha = null
        }

        // Create or update the file
        // NOTE: The file must be encoded as a base64 string
        // NOTE: Unsure how to handle the case where the file exists vs doesn't exist

        // If the file doesn't exist then create then report.sha will be null, so create the object to create the file without the sha
        let octokitContent = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            // If the file exists then update it, otherwise create it
            path: report.path,
            message: `Update ${report.name} report`,
            content: Buffer.from(report.content).toString('base64'),
            sha: report.sha, // The blob SHA of the file being replaced
            branch: 'main',
            committer: {
                name: github.context.actor,
                email: `${github.context.actor}@users.noreply.github.com`
            },
            author: {
                name: github.context.actor,
                email: `${github.context.actor}@users.noreply.github.com`
            }
        }

        // if report.sha is null delete the sha property from the object
        if (!report.sha) {
            delete octokitContent.sha
        }

        await octokit.rest.repos.createOrUpdateFileContents(octokitContent)
    }
}


module.exports = {
    readObjects,
    readWorkflows,
    readBranches,
    saveReports
}