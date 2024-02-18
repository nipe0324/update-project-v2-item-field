import * as core from '@actions/core'

export interface Inputs {
  projectUrl: string
  ghToken: string
  fieldName: string
  fieldValue: string
  fieldValueScript: string
  skipUpdateScript: string | null
}

export function getInputs(): Inputs {
  const projectUrl = core.getInput('project-url', { required: true })
  const ghToken = core.getInput('github-token', { required: true })
  const fieldName = core.getInput('field-name', { required: true })
  const fieldValue = core.getInput('field-value', { required: false })
  const fieldValueScript = core.getInput('field-value-script', {
    required: false
  })
  const skipUpdateScript = core.getInput('skip-update-script', {
    required: false
  })

  return {
    projectUrl,
    ghToken,
    fieldName,
    fieldValue,
    fieldValueScript,
    skipUpdateScript: skipUpdateScript !== '' ? skipUpdateScript : null
  }
}
