import * as core from '@actions/core'
import * as github from '@actions/github'

import { updateProjectV2ItemField } from '../src/update-project-v2-item-field'
import { ExOctokit } from '../src/ex-octokit'

describe('updateProjectV2ItemField', () => {
  let outputs: Record<string, string>

  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  beforeEach(() => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/nipe0324/projects/1',
      'github-token': 'gh_token'
    })

    outputs = mockSetOutput()
  })

  afterEach(() => {
    github.context.payload = {}
    jest.restoreAllMocks()
  })

  test('sets an issue from the same organization to the project', async () => {
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

    mockFetchProjectV2Id().mockResolvedValue('project-id')

    await updateProjectV2ItemField()

    expect(outputs.projectV2Id).toEqual('project-id')
  })

  test(`throws an error when url isn't a valid project url`, async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/github/repositories',
      'github-token': 'gh_token'
    })

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

    const infoSpy = jest.spyOn(core, 'info')
    const fetchProjectV2IdMock = mockFetchProjectV2Id()
    await expect(updateProjectV2ItemField()).rejects.toThrow(
      'Invalid project URL: https://github.com/orgs/github/repositories.'
    )
    expect(infoSpy).not.toHaveBeenCalled()
    expect(fetchProjectV2IdMock).not.toHaveBeenCalled()
  })

  test(`works with URLs that are not under the github.com domain`, async () => {
    github.context.payload = {
      issue: {
        number: 1,
        // eslint-disable-next-line camelcase
        html_url:
          'https://notgithub.com/myorg/update-project-v2-item-field/issues/74'
      },
      repository: {
        name: 'update-project-v2-item-field',
        owner: {
          login: 'myorg'
        }
      }
    }

    mockFetchProjectV2Id().mockResolvedValue('project-id')

    await updateProjectV2ItemField()

    expect(outputs.projectV2Id).toEqual('project-id')
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

function mockFetchProjectV2Id(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'fetchProjectV2Id')
}
