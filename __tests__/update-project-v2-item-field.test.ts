import * as core from '@actions/core'
import * as github from '@actions/github'

import { updateProjectV2ItemField } from '../src/update-project-v2-item-field'

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

    mockGraphQL({
      test: /getProject/,
      return: {
        organization: {
          projectV2: {
            id: 'project-id'
          }
        }
      }
    })

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
    const gqlMock = mockGraphQL()
    await expect(updateProjectV2ItemField()).rejects.toThrow(
      'Invalid project URL: https://github.com/orgs/github/repositories.'
    )
    expect(infoSpy).not.toHaveBeenCalled()
    expect(gqlMock).not.toHaveBeenCalled()
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

    mockGraphQL({
      test: /getProject/,
      return: {
        organization: {
          projectV2: {
            id: 'project-id'
          }
        }
      }
    })

    await updateProjectV2ItemField()

    expect(outputs.projectV2Id).toEqual('project-id')
  })

  test('constructs the correct graphQL query given an organization owner', async () => {
    mockGetInput({
      'project-url': 'https://github.com/orgs/myorg/projects/1',
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

    const gqlMock = mockGraphQL({
      test: /getProject/,
      return: {
        organization: {
          projectV2: {
            id: 'project-id'
          }
        }
      }
    })

    await updateProjectV2ItemField()

    expect(gqlMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('organization(login: $projectOwnerName)'),
      {
        projectOwnerName: 'myorg',
        projectNumber: 1
      }
    )
  })

  test('constructs the correct graphQL query given a user owner', async () => {
    mockGetInput({
      'project-url': 'https://github.com/users/nipe0324/projects/1',
      'github-token': 'gh_token'
    })

    github.context.payload = {
      issue: {
        number: 1,
        // eslint-disable-next-line camelcase
        html_url:
          'https://github.com/nipe0324/update-project-v2-item-field/issues/74'
      },
      repository: {
        name: 'update-project-v2-item-field',
        owner: {
          login: 'nipe0324'
        }
      }
    }

    const gqlMock = mockGraphQL({
      test: /getProject/,
      return: {
        organization: {
          projectV2: {
            id: 'project-id'
          }
        }
      }
    })

    await updateProjectV2ItemField()

    expect(gqlMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('user(login: $projectOwnerName)'),
      {
        projectOwnerName: 'nipe0324',
        projectNumber: 1
      }
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

function mockGraphQL(...mocks: { test: RegExp; return: unknown }[]): jest.Mock {
  const mock = jest.fn().mockImplementation((query: string) => {
    const match = mocks.find(m => m.test.test(query))

    if (match) {
      return match.return
    }

    throw new Error(`Unexpected GraphQL query: ${query}`)
  })

  jest.spyOn(github, 'getOctokit').mockImplementation(() => {
    return {
      graphql: mock
    } as unknown as ReturnType<typeof github.getOctokit>
  })

  return mock
}
