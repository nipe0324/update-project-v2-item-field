import * as core from '@actions/core'
import * as github from '@actions/github'
import { mustGetOwnerTypeQuery } from './utils'

const urlParse =
  /\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

interface ProjectV2IdResponse {
  organization?: {
    projectV2: {
      id: string
    }
  }

  user?: {
    projectV2: {
      id: string
    }
  }
}

export async function updateProjectV2ItemField(): Promise<void> {
  // Get the action inputs
  const projectUrl = core.getInput('project-url', { required: true })
  const ghToken = core.getInput('github-token', { required: true })

  // Get the issue/PR owner name and node ID from payload
  const issue =
    github.context.payload.issue ?? github.context.payload.pull_request

  // Validate and parse the project URL
  const urlMatch = projectUrl.match(urlParse)
  if (!urlMatch) {
    throw new Error(`Invalid project URL: ${projectUrl}.`)
  }

  const projectOwnerName = urlMatch.groups?.ownerName
  const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
  const ownerType = urlMatch.groups?.ownerType

  core.debug(`Project owner: ${projectOwnerName}`)
  core.debug(`Project number: ${projectNumber}`)
  core.debug(`Project owner type: ${ownerType}`)

  // Fetch the project node ID
  const octokit = github.getOctokit(ghToken)
  const ownerTypeQuery = mustGetOwnerTypeQuery(ownerType)
  const projectV2IdResponse = await octokit.graphql<ProjectV2IdResponse>(
    `query getProject($projectOwnerName: String!, $projectNumber: Int!) {
      ${ownerTypeQuery}(login: $projectOwnerName) {
        projectV2(number: $projectNumber) {
          id
        }
      }
    }`,
    {
      projectOwnerName,
      projectNumber
    }
  )
  const projectV2NodeId = projectV2IdResponse[ownerTypeQuery]?.projectV2.id
  const contentId = issue?.node_id

  core.debug(`ProjectV2 ID: ${projectV2NodeId}`)
  core.debug(`Content ID: ${contentId}`)

  // Set outputs for other workflow steps to use
  core.setOutput('projectV2Id', projectV2NodeId)
  core.setOutput('contentId', contentId)
}
