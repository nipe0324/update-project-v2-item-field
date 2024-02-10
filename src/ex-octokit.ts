import { getOctokit } from '@actions/github'

interface ProjectV2IdResponse {
  organization?: {
    projectV2: {
      id: string
    }
  }

  user?: {
    projectV2: {
      id: string
    }
  }
}

interface ProjectV2FieldResponse {
  node: {
    field: ProjectV2Field | null
  } | null
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
  ): Promise<string | undefined> {
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

  async addProjectV2ItemByContentId(
    projectV2Id: string,
    contentId: string
  ): Promise<ProjectV2Item | undefined> {
    const resp = await this.octokit.graphql<AddProjectV2ItemByIdResponse>(
      `mutation addProjectV2ItemById($projectV2Id: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectV2Id, contentId: $contentId }) {
          item {
            id
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
            }
          }
        }`,
        {
          projectV2Id,
          itemId,
          fieldId,
          projectV2FieldValue
        }
      )

    return resp.updateProjectV2ItemFieldValue?.projectV2Item
  }
}
