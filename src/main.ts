import * as core from '@actions/core'
import { Interactor } from './interactor'
import { context } from '@actions/github'
import { getInputs } from './inputs'
import { ExOctokit } from './ex-octokit'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    await updateProjectV2ItemField()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function updateProjectV2ItemField(): Promise<void> {
  const inputs = getInputs()

  const exOctokit = new ExOctokit(inputs.ghToken)

  const interactor = new Interactor(inputs, exOctokit)

  interactor.validateInputs()

  const projectV2Id = await interactor.fetchProjectV2Id()

  const field = await interactor.fetchProjectV2FieldByName(projectV2Id)

  if (inputs.allItems) {
    await interactor.updateAllItemFields(projectV2Id, field)
  } else {
    // Get the issue/PR owner name and node ID from payload
    const issue = context.payload.issue ?? context.payload.pull_request
    const contentId = issue?.node_id

    await interactor.updateSingleItemField(projectV2Id, field, contentId)
  }
}
