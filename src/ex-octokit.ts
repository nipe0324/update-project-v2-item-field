import * as core from '@actions/core'
import { getOctokit } from '@actions/github'

export type ProjectV2Id = string

interface ProjectV2IdResponse {
  organization?: {
    projectV2: {
      id: ProjectV2Id
    }
  }

  user?: {
    projectV2: {
      id: ProjectV2Id
    }
  }
}

interface ProjectV2FieldResponse {
  node: {
    field: ProjectV2Field | null
  } | null
}

interface ProjectV2ItemsResponse {
  node: {
    items: {
      edges: {
        node: ProjectV2Item
      }[]
      pageInfo: {
        hasNextPage: boolean
        endCursor: string
      }
    }
  }
}

interface AddProjectV2ItemByIdResponse {
  addProjectV2ItemById: {
    item: ProjectV2Item
  } | null
}

interface UpdateProjectV2ItemFieldValueResponse {
  updateProjectV2ItemFieldValue: {
    projectV2Item: ProjectV2Item
  } | null
}

export interface ProjectV2Field {
  __typename: 'ProjectV2Field' | 'ProjectV2SingleSelectField'
  id: string
  name: string
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'SINGLE_SELECT' | 'ITERATION'

  options?: {
    id: string
    name: string
  }[]

  configuration?: {
    completedIterations: {
      id: string
      title: string
    }[]
    iterations: {
      id: string
      title: string
    }[]
  }
}

export interface ProjectV2Item {
  id: string
  type: 'DRAFT_ISSUE' | 'ISSUE' | 'PULL_REQUEST' | 'REDACTED'
  fieldValues?: {
    nodes: {
      __typename:
        | 'ProjectV2ItemFieldDateValue'
        | 'ProjectV2ItemFieldIterationValue'
        | 'ProjectV2ItemFieldNumberValue'
        | 'ProjectV2ItemFieldSingleSelectValue'
        | 'ProjectV2ItemFieldTextValue'
        | string
      field?: {
        name: string
      }
      date?: string // ProjectV2ItemFieldDateValue
      title?: string // ProjectV2ItemFieldIterationValue
      number?: number // ProjectV2ItemFieldNumberValue
      name?: string // ProjectV2ItemFieldSingleSelectValue
      text?: string // ProjectV2ItemFieldTextValue
    }[]
  }
}

export type ProjectV2FieldValue =
  | { text: string }
  | { number: number }
  | { date: string }
  | { singleSelectOptionId: string }
  | { iterationId: string }

export class ExOctokit {
  octokit: ReturnType<typeof getOctokit>

  constructor(ghToken: string) {
    this.octokit = getOctokit(ghToken)
  }

  async fetchProjectV2Id(
    ownerTypeQuery: 'organization' | 'user',
    projectOwnerName: string,
    projectNumber: number
  ): Promise<ProjectV2Id | undefined> {
    const resp = await this.octokit.graphql<ProjectV2IdResponse>(
      `query fetchProjectV2Id($projectOwnerName: String!, $projectNumber: Int!) {
        ${ownerTypeQuery}(login: $projectOwnerName) {
          projectV2(number: $projectNumber) {
            id
          }
        }
      }`,
      {
        projectOwnerName,
        projectNumber
      }
    )

    return resp[ownerTypeQuery]?.projectV2.id
  }

  async fetchProjectV2FieldByName(
    projectV2Id: string,
    fieldName: string
  ): Promise<ProjectV2Field | undefined> {
    const resp = await this.octokit.graphql<ProjectV2FieldResponse>(
      `query fetchProjectV2FieldByName($projectV2Id: ID!, $fieldName: String!) {
        node(id: $projectV2Id) {
          ... on ProjectV2 {
            field(name: $fieldName) {
              __typename
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
              ... on ProjectV2IterationField {
                id
                name
                dataType
                configuration {
                  completedIterations {
                    id
                    title
                  }
                  iterations {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }`,
      {
        projectV2Id,
        fieldName
      }
    )

    return resp.node?.field ?? undefined
  }

  async fetchProjectV2ItemsWithPagination(
    projectV2Id: string
  ): Promise<ProjectV2Item[]> {
    let allItems: ProjectV2Item[] = []

    let after = ''
    for (let i = 0; i <= 12; i++) {
      core.info(`i: ${i}`)
      // 12 pages max
      const resp = await this.fetchProjectV2Items(projectV2Id, after)
      core.info(`after: ${after}`)

      const items = resp.node.items.edges.map(edge => edge.node)
      core.info(`items[0].id: ${JSON.stringify(items[0].id)}`)
      allItems = allItems.concat(items)

      const pageInfo = resp.node.items.pageInfo
      core.info(`pageInfo: ${JSON.stringify(pageInfo)}`)
      if (!pageInfo.hasNextPage) {
        return allItems
      }

      after = pageInfo.endCursor
    }

    return allItems
  }

  async fetchProjectV2Items(
    projectV2Id: string,
    after: string
  ): Promise<ProjectV2ItemsResponse> {
    const resp = await this.octokit.graphql<ProjectV2ItemsResponse>(
      `query fetchProjectV2Items($projectV2Id: ID!, $after: String) {
        node(id: $projectV2Id) {
          ... on ProjectV2 {
            items(first: 100, after: $after) {
              edges {
                node {
                  id
                  type
                  fieldValues(first: 100) {
                    nodes {
                      __typename
                      ... on ProjectV2ItemFieldDateValue {
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                        date
                      }
                      ... on ProjectV2ItemFieldIterationValue {
                        field {
                          ... on ProjectV2IterationField {
                            name
                          }
                        }
                        title
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                        number
                      }
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field {
                          ... on ProjectV2SingleSelectField {
                            name
                          }
                        }
                        name
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        field {
                          ... on ProjectV2Field {
                            name
                          }
                        }
                        text
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }`,
      {
        projectV2Id,
        after
      }
    )

    return resp
  }

  async addProjectV2ItemByContentId(
    projectV2Id: string,
    contentId: string
  ): Promise<ProjectV2Item | undefined> {
    const resp = await this.octokit.graphql<AddProjectV2ItemByIdResponse>(
      `mutation addProjectV2ItemById($projectV2Id: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectV2Id, contentId: $contentId }) {
          item {
            id
            type
            fieldValues(first: 100) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldDateValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  date
                }
                ... on ProjectV2ItemFieldIterationValue {
                  field {
                    ... on ProjectV2IterationField {
                      name
                    }
                  }
                  title
                }
                ... on ProjectV2ItemFieldNumberValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  number
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                  name
                }
                ... on ProjectV2ItemFieldTextValue {
                  field {
                    ... on ProjectV2Field {
                      name
                    }
                  }
                  text
                }
              }
            }
          }
        }
      }`,
      {
        projectV2Id,
        contentId
      }
    )

    return resp.addProjectV2ItemById?.item
  }

  async updateProjectV2ItemFieldValue(
    projectV2Id: string,
    itemId: string,
    fieldId: string,
    projectV2FieldValue: ProjectV2FieldValue
  ): Promise<ProjectV2Item | undefined> {
    const resp =
      await this.octokit.graphql<UpdateProjectV2ItemFieldValueResponse>(
        `mutation updateProjectV2ItemFieldValue(
          $projectV2Id: ID!,
          $itemId: ID!,
          $fieldId: ID!,
          $value: ProjectV2FieldValue!
        ) {
          updateProjectV2ItemFieldValue(input: {
            projectId: $projectV2Id,
            itemId: $itemId,
            fieldId: $fieldId,
            value: $value
          }) {
            projectV2Item {
              id
              type
            }
          }
        }`,
        {
          projectV2Id,
          itemId,
          fieldId,
          value: projectV2FieldValue
        }
      )

    return resp.updateProjectV2ItemFieldValue?.projectV2Item
  }
}
