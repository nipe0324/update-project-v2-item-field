import * as core from '@actions/core'
import * as github from '@actions/github'

import { run } from '../src/main'
import { ExOctokit } from '../src/ex-octokit'

jest.mock('@actions/core')

describe('run', () => {
  let outputs: Record<string, string>
  let info: jest.SpyInstance
  let debug: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  beforeEach(() => {
    github.context.payload = {
      issue: {
        number: 1,
        // eslint-disable-next-line camelcase
        html_url:
          'https://github.com/myorg/update-project-v2-item-field/issues/74'
      },
      repository: {
        name: 'update-project-v2-item-field',
        owner: {
          login: 'myorg'
        }
      }
    }

    info = mockInfo()
    debug = mockDebug()
    outputs = mockSetOutput()
  })

  afterEach(() => {
    github.context.payload = {}
    jest.restoreAllMocks()
  })

  it('updates project v2 TEXT item field', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field',
      'field-value': 'Hello, World!'
    })

    mockFetchProjectV2Id().mockResolvedValue('project-id')
    mockAddProjectV2ItemByContentId().mockResolvedValue({ id: 'item-id' })
    mockFetchProjectV2FieldByName().mockResolvedValue({
      id: 'field-id',
      dataType: 'TEXT'
    })
    mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

    await run()

    expect(info).toHaveBeenCalledWith('update the project V2 item field')
    expect(debug).toHaveBeenCalledWith('ProjectV2 ID: project-id')
    expect(debug).toHaveBeenCalledWith('Item ID: item-id')
    expect(debug).toHaveBeenCalledWith('Field ID: field-id')
    expect(debug).toHaveBeenCalledWith('Field Value: {"text":"Hello, World!"}')
    expect(outputs.itemId).toEqual('item-id')
  })

  it('updates project v2 SINGLE_SELECT item field', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Status',
      'field-value': 'Done'
    })

    mockFetchProjectV2Id().mockResolvedValue('project-id')
    mockAddProjectV2ItemByContentId().mockResolvedValue({ id: 'item-id' })
    mockFetchProjectV2FieldByName().mockResolvedValue({
      id: 'field-id',
      dataType: 'SINGLE_SELECT',
      options: [
        { id: '1', name: 'To Do' },
        { id: '2', name: 'In Progress' },
        { id: '3', name: 'Done' }
      ]
    })
    mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

    await run()

    expect(info).toHaveBeenCalledWith('update the project V2 item field')
    expect(debug).toHaveBeenCalledWith('ProjectV2 ID: project-id')
    expect(debug).toHaveBeenCalledWith('Item ID: item-id')
    expect(debug).toHaveBeenCalledWith('Field ID: field-id')
    expect(debug).toHaveBeenCalledWith(
      'Field Value: {"singleSelectOptionId":"3"}'
    )
    expect(outputs.itemId).toEqual('item-id')
  })

  it('updates project v2 ITERATION item field', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Iteration',
      'field-value': 'Iteration 2'
    })

    mockFetchProjectV2Id().mockResolvedValue('project-id')
    mockAddProjectV2ItemByContentId().mockResolvedValue({ id: 'item-id' })
    mockFetchProjectV2FieldByName().mockResolvedValue({
      id: 'field-id',
      dataType: 'ITERATION',
      configuration: {
        completedIterations: [],
        iterations: [
          { id: '1', title: 'Iteration 1' },
          { id: '2', title: 'Iteration 2' }
        ]
      }
    })
    mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

    await run()

    expect(info).toHaveBeenCalledWith('update the project V2 item field')
    expect(debug).toHaveBeenCalledWith('ProjectV2 ID: project-id')
    expect(debug).toHaveBeenCalledWith('Item ID: item-id')
    expect(debug).toHaveBeenCalledWith('Field ID: field-id')
    expect(debug).toHaveBeenCalledWith('Field Value: {"iterationId":"2"}')
    expect(outputs.itemId).toEqual('item-id')
  })

  it('updates project v2 DATE item field by field-value-script', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'My Date Field',
      'field-value-script': `
        const date = new Date(item.fieldValues['My Date Field'])
        date.setDate(date.getDate() + 1)
        return date.toISOString().split('T')[0]
      `
    })

    mockFetchProjectV2Id().mockResolvedValue('project-id')
    mockAddProjectV2ItemByContentId().mockResolvedValue({
      id: 'item-id',
      fieldValues: {
        nodes: [
          {
            __typename: 'ProjectV2ItemFieldDateValue',
            field: {
              name: 'My Date Field'
            },
            date: '2024-02-01'
          }
        ]
      }
    })
    mockFetchProjectV2FieldByName().mockResolvedValue({
      id: 'field-id',
      dataType: 'DATE'
    })
    mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

    await run()

    expect(info).toHaveBeenCalledWith('update the project V2 item field')
    expect(debug).toHaveBeenCalledWith('ProjectV2 ID: project-id')
    expect(debug).toHaveBeenCalledWith('Item ID: item-id')
    expect(debug).toHaveBeenCalledWith('Field ID: field-id')
    expect(debug).toHaveBeenCalledWith(`Field Value: {"date":"2024-02-02"}`)
    expect(outputs.itemId).toEqual('item-id')
  })

  it('skip to update project v2 item field when condition-script is false', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field',
      'field-value': 'Hello, World!',
      'skip-update-script': 'return true'
    })

    mockFetchProjectV2Id().mockResolvedValue('project-id')
    mockAddProjectV2ItemByContentId().mockResolvedValue({ id: 'item-id' })
    mockFetchProjectV2FieldByName().mockResolvedValue({
      id: 'field-id',
      dataType: 'TEXT'
    })
    mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

    await run()

    expect(info).toHaveBeenCalledWith(
      '`skip-update-script` returns true. Skip updating the field'
    )
    expect(outputs.itemId).toEqual('item-id')
  })

  it(`throws an error when field-value and field-value-script are blank`, async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field'
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      '`field-value` or `field-value-script` is required.'
    )
  })

  it(`throws an error when url isn't a valid project url`, async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/repositories',
      'github-token': 'gh_token',
      'field-name': 'Text Input Field',
      'field-value': 'Hello, World!'
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid project URL: https://github.com/orgs/github/repositories.'
    )
  })
})

function mockGetInput(mocks: Record<string, string>): jest.SpyInstance {
  const mock = (key: string): string => mocks[key] ?? ''
  return jest.spyOn(core, 'getInput').mockImplementation(mock)
}

function mockSetOutput(): Record<string, string> {
  const output: Record<string, string> = {}
  jest
    .spyOn(core, 'setOutput')
    .mockImplementation((key, value) => (output[key] = value))
  return output
}

function mockInfo(): jest.SpyInstance {
  return jest.spyOn(core, 'info').mockImplementation()
}

function mockDebug(): jest.SpyInstance {
  return jest.spyOn(core, 'debug').mockImplementation()
}

function mockFetchProjectV2Id(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'fetchProjectV2Id')
}

function mockAddProjectV2ItemByContentId(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'addProjectV2ItemByContentId')
}

function mockFetchProjectV2FieldByName(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'fetchProjectV2FieldByName')
}

function mockUpdateProjectV2ItemFieldValue(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'updateProjectV2ItemFieldValue')
}
