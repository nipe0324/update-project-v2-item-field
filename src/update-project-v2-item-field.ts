import * as core from '@actions/core'
import * as github from '@actions/github'
import { mustGetOwnerTypeQuery } from './utils'
import { ExOctokit } from './ex-octokit'

const urlParse =
  /\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

export async function updateProjectV2ItemField(): Promise<void> {
  // Get the action inputs
  const projectUrl = core.getInput('project-url', { required: true })
  const ghToken = core.getInput('github-token', { required: true })
  const fieldName = core.getInput('field-name', { required: true })

  // Get the issue/PR owner name and node ID from payload
  const issue =
    github.context.payload.issue ?? github.context.payload.pull_request

  // Validate and parse the project URL
  const urlMatch = projectUrl.match(urlParse)
  if (!urlMatch) {
    throw new Error(`Invalid project URL: ${projectUrl}.`)
  }

  const projectOwnerName = urlMatch.groups?.ownerName
  if (!projectOwnerName) {
    throw new Error(`ownerName is undefined`)
  }
  const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
  const ownerType = urlMatch.groups?.ownerType

  core.debug(`Project owner: ${projectOwnerName}`)
  core.debug(`Project number: ${projectNumber}`)
  core.debug(`Project owner type: ${ownerType}`)

  // Fetch the project node ID
  const exOctokit = new ExOctokit(ghToken)
  const ownerTypeQuery = mustGetOwnerTypeQuery(ownerType)
  const projectV2Id = await exOctokit.fetchProjectV2Id(
    ownerTypeQuery,
    projectOwnerName,
    projectNumber
  )
  if (!projectV2Id) {
    throw new Error(`ProjectV2 ID is undefined`)
  }

  const contentId = issue?.node_id

  // Fetch the field node ID
  const field = await exOctokit.fetchProjectV2FieldByName(
    projectV2Id,
    fieldName
  )
  const fieldId = field?.id

  core.debug(`ProjectV2 ID: ${projectV2Id}`)
  core.debug(`Field ID: ${fieldId}`)
  core.debug(`Content ID: ${contentId}`)

  // Set outputs for other workflow steps to use
  core.setOutput('projectV2Id', projectV2Id)
  core.setOutput('contentId', contentId)
}
