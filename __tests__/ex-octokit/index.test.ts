import * as github from '@actions/github'
import { ExOctokit } from '../../src/ex-octokit'

describe('fetchProjectV2Id', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetches ProjectV2 ID from organization', async () => {
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

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Id = await exOctokit.fetchProjectV2Id(
      'organization',
      'myorg',
      1
    )

    expect(projectV2Id).toEqual('project-id')
  })

  it('fetches ProjectV2 ID from user', async () => {
    mockGraphQL({
      test: /getProject/,
      return: {
        user: {
          projectV2: {
            id: 'project-id'
          }
        }
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Id = await exOctokit.fetchProjectV2Id('user', 'nipe0324', 1)

    expect(projectV2Id).toEqual('project-id')
  })
})

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
