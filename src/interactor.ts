import * as core from '@actions/core'
import { context } from '@actions/github'
import { callAsyncFunction } from './async-function'
import { ExOctokit } from './ex-octokit'
import { Item } from './item'
import { mustGetOwnerTypeQuery } from './utils'

import type { Inputs } from './inputs'
import type { ProjectV2Field, ProjectV2FieldValue } from './ex-octokit'

const urlParse =
  /\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/

export class Interactor {
  inputs: Inputs
  exOctokit: ExOctokit

  constructor(inputs: Inputs, exOctokit: ExOctokit) {
    this.inputs = inputs
    this.exOctokit = exOctokit
  }

  validateInputs(): void {
    if (this.inputs.fieldValue === '' && this.inputs.fieldValueScript === '') {
      throw new Error('`field-value` or `field-value-script` is required.')
    }
  }

  async fetchProjectV2Id(): Promise<string> {
    const urlMatch = this.inputs.projectUrl.match(urlParse)
    if (!urlMatch) {
      throw new Error(`Invalid project URL: ${this.inputs.projectUrl}.`)
    }

    const projectOwnerName = urlMatch.groups?.ownerName
    if (!projectOwnerName) {
      throw new Error(`ownerName is undefined.`)
    }
    const projectNumber = parseInt(urlMatch.groups?.projectNumber ?? '', 10)
    const ownerType = urlMatch.groups?.ownerType

    // Fetch the project node ID
    const ownerTypeQuery = mustGetOwnerTypeQuery(ownerType)
    const projectV2Id = await this.exOctokit.fetchProjectV2Id(
      ownerTypeQuery,
      projectOwnerName,
      projectNumber
    )
    if (!projectV2Id) {
      throw new Error(`ProjectV2 ID is undefined`)
    }

    return projectV2Id
  }

  async fetchProjectV2FieldByName(
    projectV2Id: string
  ): Promise<ProjectV2Field> {
    const field = await this.exOctokit.fetchProjectV2FieldByName(
      projectV2Id,
      this.inputs.fieldName
    )

    if (!field) {
      throw new Error(`Field is not found: ${this.inputs.fieldName}`)
    }

    return field
  }

  async updateItemField(
    projectV2Id: string,
    contentId: string,
    field: ProjectV2Field
  ): Promise<string> {
    // Add the issue/PR to the project and get item
    const itemData = await this.exOctokit.addProjectV2ItemByContentId(
      projectV2Id,
      contentId
    )
    if (!itemData) {
      throw new Error(`Failed to add item to project`)
    }

    const item = Item.fromGraphQL(itemData)

    // Check the skipUpdateScript
    if (this.inputs.skipUpdateScript) {
      const isSkip = await callAsyncFunction(
        { context, item },
        this.inputs.skipUpdateScript
      )
      if (isSkip) {
        core.info('`skip-update-script` returns true. Skip updating the field')
        return item.id
      }
    }

    // Build the value by field data type
    const value =
      this.inputs.fieldValue !== ''
        ? this.inputs.fieldValue
        : String(
            await callAsyncFunction(
              { context, item },
              this.inputs.fieldValueScript
            )
          )
    const projectV2FieldValue = buildProjectV2FieldValue(field, value)
    const updatedItem = await this.exOctokit.updateProjectV2ItemFieldValue(
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
