import * as core from '@actions/core'

import { getInputs } from '../src/inputs'

describe('getInputs', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns inputs', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field',
      'field-value': 'Hello, World!'
    })

    expect(getInputs()).toEqual({
      projectUrl: 'https://github.com/orgs/nipe0324/projects/1',
      ghToken: 'gh_token',
      fieldName: 'Text Input Field',
      fieldValue: 'Hello, World!',
      fieldValueScript: '',
      skipUpdateScript: null
    })
  })

  it('returns skipUpdateScript when `sckip-update-script` is present', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field',
      'field-value-script': 'return "Hello, World!"',
      'skip-update-script': 'return true'
    })

    expect(getInputs()).toEqual({
      projectUrl: 'https://github.com/orgs/nipe0324/projects/1',
      ghToken: 'gh_token',
      fieldName: 'Text Input Field',
      fieldValue: '',
      fieldValueScript: 'return "Hello, World!"',
      skipUpdateScript: 'return true'
    })
  })
})

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string): string => mocks[key] ?? ''
  return jest.spyOn(core, 'getInput').mockImplementation(mock)
}
