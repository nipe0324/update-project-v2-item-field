import * as core from '@actions/core'
import { updateProjectV2ItemField } from './update-project-v2-item-field'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    updateProjectV2ItemField()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
