import * as github from '@actions/github'
import { ExOctokit } from '../src/ex-octokit'

describe('fetchProjectV2Id', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetches ProjectV2 ID from organization', async () => {
    mockGraphQL({
      test: /fetchProjectV2Id/,
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
      test: /fetchProjectV2Id/,
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

describe('fetchProjectV2FieldByName', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('fetches field on ProjectV2Field', async () => {
    mockGraphQL({
      test: /fetchProjectV2FieldByName/,
      return: {
        node: {
          field: {
            __typename: 'ProjectV2Field',
            id: 'field-id',
            name: 'text-field',
            dataType: 'TEXT'
          }
        }
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Field = await exOctokit.fetchProjectV2FieldByName(
      'project-id',
      'text-field'
    )

    expect(projectV2Field).toEqual({
      __typename: 'ProjectV2Field',
      id: 'field-id',
      name: 'text-field',
      dataType: 'TEXT'
    })
  })

  it('fetches field on ProjectV2SingleSelectField', async () => {
    mockGraphQL({
      test: /fetchProjectV2FieldByName/,
      return: {
        node: {
          field: {
            __typename: 'ProjectV2SingleSelectField',
            id: 'field-id',
            name: 'select-field',
            dataType: 'SINGLE_SELECT',
            options: [
              {
                id: 'option-id',
                name: 'option-name'
              }
            ]
          }
        }
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Field = await exOctokit.fetchProjectV2FieldByName(
      'project-id',
      'select-field'
    )

    expect(projectV2Field).toEqual({
      __typename: 'ProjectV2SingleSelectField',
      id: 'field-id',
      name: 'select-field',
      dataType: 'SINGLE_SELECT',
      options: [
        {
          id: 'option-id',
          name: 'option-name'
        }
      ]
    })
  })
})

describe('addProjectV2ItemById', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns ProjectV2FieldItem', async () => {
    mockGraphQL({
      test: /addProjectV2ItemById/,
      return: {
        addProjectV2ItemById: {
          item: {
            id: 'item-id'
          }
        }
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Item = await exOctokit.addProjectV2ItemByContentId(
      'project-id',
      'content-id'
    )

    expect(projectV2Item).toEqual({
      id: 'item-id'
    })
  })

  it('returns undefined when request failed', async () => {
    mockGraphQL({
      test: /addProjectV2ItemById/,
      return: {
        addProjectV2ItemById: null
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Item = await exOctokit.addProjectV2ItemByContentId(
      'project-id',
      'content-id'
    )

    expect(projectV2Item).toBeUndefined()
  })
})

describe('updateProjectV2ItemFieldValue', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns ProjectV2FieldItem', async () => {
    mockGraphQL({
      test: /updateProjectV2ItemFieldValue/,
      return: {
        updateProjectV2ItemFieldValue: {
          projectV2Item: {
            id: 'item-id'
          }
        }
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Item = await exOctokit.updateProjectV2ItemFieldValue(
      'project-id',
      'item-id',
      'field-id',
      { singleSelectOptionId: 'option-id' }
    )

    expect(projectV2Item).toEqual({
      id: 'item-id'
    })
  })

  it('returns undefined when request failed', async () => {
    mockGraphQL({
      test: /updateProjectV2ItemFieldValue/,
      return: {
        updateProjectV2ItemFieldValue: null
      }
    })

    const exOctokit = new ExOctokit('gh_token')
    const projectV2Item = await exOctokit.updateProjectV2ItemFieldValue(
      'project-id',
      'item-id',
      'field-id',
      { singleSelectOptionId: 'option-id' }
    )

    expect(projectV2Item).toBeUndefined()
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
