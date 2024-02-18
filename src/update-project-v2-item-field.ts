import * as core from '@actions/core'
import { getInputs, Inputs, fetchProjectV2Id } from './inputs'
import { context } from '@actions/github'
import { callAsyncFunction } from './async-function'
import { ExOctokit } from './ex-octokit'
import { Item } from './item'

import type { ProjectV2Field, ProjectV2FieldValue } from './ex-octokit'

export async function updateProjectV2ItemField(): Promise<void> {
  const inputs = getInputs()

  const exOctokit = new ExOctokit(inputs.ghToken)

  if (inputs.fieldValue === '' && inputs.fieldValueScript === '') {
    throw new Error('`field-value` or `field-value-script` is required.')
  }

  const projectV2Id = await fetchProjectV2Id(inputs, exOctokit)

  const field = await exOctokit.fetchProjectV2FieldByName(
    projectV2Id,
    inputs.fieldName
  )
  if (!field) {
    throw new Error(`Field is not found: ${inputs.fieldName}`)
  }

  // Get the issue/PR owner name and node ID from payload
  const issue = context.payload.issue ?? context.payload.pull_request
  const contentId = issue?.node_id

  const itemId = await updateItemField(
    exOctokit,
    inputs,
    projectV2Id,
    contentId,
    field
  )

  // Set outputs for other workflow steps to use
  core.setOutput('itemId', itemId)
}

async function updateItemField(
  exOctokit: ExOctokit,
  inputs: Inputs,
  projectV2Id: string,
  contentId: string,
  field: ProjectV2Field
): Promise<string> {
  // Add the issue/PR to the project and get item
  const itemData = await exOctokit.addProjectV2ItemByContentId(
    projectV2Id,
    contentId
  )
  if (!itemData) {
    throw new Error(`Failed to add item to project`)
  }

  const item = Item.fromGraphQL(itemData)

  // Check the skipUpdateScript
  if (inputs.skipUpdateScript) {
    const isSkip = await callAsyncFunction(
      { context, item },
      inputs.skipUpdateScript
    )
    if (isSkip) {
      core.info('`skip-update-script` returns true. Skip updating the field')
      return item.id
    }
  }

  // Build the value by field data type
  const value =
    inputs.fieldValue !== ''
      ? inputs.fieldValue
      : String(
          await callAsyncFunction({ context, item }, inputs.fieldValueScript)
        )
  const projectV2FieldValue = buildProjectV2FieldValue(field, value)
  const updatedItem = await exOctokit.updateProjectV2ItemFieldValue(
    projectV2Id,
    item.id,
    field.id,
    projectV2FieldValue
  )
  if (!updatedItem) {
    throw new Error(`Failed to update item field value`)
  }

  core.info('update the project V2 item field')
  core.debug(`ProjectV2 ID: ${projectV2Id}`)
  core.debug(`Item ID: ${item.id}`)
  core.debug(`Field ID: ${field.id}`)
  core.debug(`Field Value: ${JSON.stringify(projectV2FieldValue)}`)

  return updatedItem.id
}

function buildProjectV2FieldValue(
  field: ProjectV2Field,
  value: string
): ProjectV2FieldValue {
  switch (field.dataType) {
    case 'TEXT':
      return { text: value }
    case 'NUMBER':
      return { number: Number(value) }
    case 'DATE':
      return { date: value }
    case 'SINGLE_SELECT': {
      const option = field.options?.find(o => o.name === value)
      if (!option) {
        throw new Error(`Option is not found: ${value}`)
      }
      return { singleSelectOptionId: option.id }
    }
    case 'ITERATION': {
      const completedIteration = field.configuration?.completedIterations.find(
        i => i.title === value
      )
      const iteration = field.configuration?.iterations.find(
        i => i.title === value
      )
      const targetIteration = completedIteration ?? iteration
      if (!targetIteration) {
        throw new Error(`Iteration is not found: ${value}`)
      }
      return { iterationId: targetIteration.id }
    }
    default:
      throw new Error(`Unsupported field data type: ${field.dataType}`)
  }
}
