import * as core from '@actions/core'
import * as github from '@actions/github'
import { mustGetOwnerTypeQuery } from './utils'
import { ExOctokit } from './ex-octokit'

import type { ProjectV2Field, ProjectV2FieldValue } from './ex-octokit'

const urlParse =
  /\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

export async function updateProjectV2ItemField(): Promise<void> {
  // Get the action inputs
  const projectUrl = core.getInput('project-url', { required: true })
  const ghToken = core.getInput('github-token', { required: true })
  const fieldName = core.getInput('field-name', { required: true })
  const fieldValue = core.getInput('field-value', { required: false })
  const fieldValueScript = core.getInput('field-value-script', {
    required: false
  })

  if (!fieldValue && !fieldValueScript) {
    throw new Error('`field-value` or `field-value-script` is required.')
  }

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
    throw new Error(`ownerName is undefined.`)
  }
  const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
  const ownerType = urlMatch.groups?.ownerType

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

  // Add the issue/PR to the project and get item
  const item = await exOctokit.addProjectV2ItemByContentId(
    projectV2Id,
    contentId
  )
  if (!item) {
    throw new Error(`Failed to add item to project`)
  }

  // Fetch the field node ID
  const field = await exOctokit.fetchProjectV2FieldByName(
    projectV2Id,
    fieldName
  )
  if (!field) {
    throw new Error(`Field is not found: ${fieldName}`)
  }

  // Build the value by field data type
  const value = buildFieldValue(field, fieldValue)
  const updatedItem = await exOctokit.updateProjectV2ItemFieldValue(
    projectV2Id,
    item.id,
    field.id,
    value
  )
  if (!updatedItem) {
    throw new Error(`Failed to update item field value`)
  }

  core.debug(`ProjectV2 ID: ${projectV2Id}`)
  core.debug(`Item ID: ${item.id}`)
  core.debug(`Field ID: ${field.id}`)
  core.debug(`Field Value: ${JSON.stringify(value)}`)

  // Set outputs for other workflow steps to use
  core.setOutput('itemId', updatedItem.id)
}

function buildFieldValue(
  field: ProjectV2Field,
  fieldValue: string
): ProjectV2FieldValue {
  switch (field.dataType) {
    case 'TEXT':
      return { text: fieldValue }
    case 'NUMBER':
      return { number: Number(fieldValue) }
    case 'DATE':
      return { date: fieldValue }
    case 'SINGLE_SELECT': {
      const option = field.options?.find(o => o.name === fieldValue)
      if (!option) {
        throw new Error(`Option is not found: ${fieldValue}`)
      }
      return { singleSelectOptionId: option.id }
    }
    case 'ITERATION': {
      const completedIteration = field.configuration?.completedIterations.find(
        i => i.title === fieldValue
      )
      const iteration = field.configuration?.iterations.find(
        i => i.title === fieldValue
      )
      const targetIteration = completedIteration ?? iteration
      if (!targetIteration) {
        throw new Error(`Iteration is not found: ${fieldValue}`)
      }
      return { iterationId: targetIteration.id }
    }
    default:
      throw new Error(`Unsupported field data type: ${field.dataType}`)
  }
}
