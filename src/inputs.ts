import * as core from '@actions/core'
import { mustGetOwnerTypeQuery } from './utils'
import { ExOctokit } from './ex-octokit'

const urlParse =
  /\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

export interface Inputs {
  projectUrl: string
  ghToken: string
  fieldName: string
  fieldValue: string
  fieldValueScript: string
}

export function getInputs(): Inputs {
  const projectUrl = core.getInput('project-url', { required: true })
  const ghToken = core.getInput('github-token', { required: true })
  const fieldName = core.getInput('field-name', { required: true })
  const fieldValue = core.getInput('field-value', { required: false })
  const fieldValueScript = core.getInput('field-value-script', {
    required: false
  })

  return {
    projectUrl,
    ghToken,
    fieldName,
    fieldValue,
    fieldValueScript
  }
}

export async function fetchProjectV2Id(
  inputs: Inputs,
  exOctokit: ExOctokit
): Promise<string> {
  const urlMatch = inputs.projectUrl.match(urlParse)
  if (!urlMatch) {
    throw new Error(`Invalid project URL: ${inputs.projectUrl}.`)
  }

  const projectOwnerName = urlMatch.groups?.ownerName
  if (!projectOwnerName) {
    throw new Error(`ownerName is undefined.`)
  }
  const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
  const ownerType = urlMatch.groups?.ownerType

  // Fetch the project node ID
  const ownerTypeQuery = mustGetOwnerTypeQuery(ownerType)
  const projectV2Id = await exOctokit.fetchProjectV2Id(
    ownerTypeQuery,
    projectOwnerName,
    projectNumber
  )
  if (!projectV2Id) {
    throw new Error(`ProjectV2 ID is undefined`)
  }

  return projectV2Id
}
