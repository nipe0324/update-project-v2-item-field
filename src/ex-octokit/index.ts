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

interface ProjectV2Field {
  __typename: 'ProjectV2Field' | 'ProjectV2SingleSelectField'
  id: string
  name: string
  dataType: string

  options?: Array<{
    id: string
    name: string
  }>
}

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
    const projectV2IdResponse = await this.octokit.graphql<ProjectV2IdResponse>(
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

    return projectV2IdResponse[ownerTypeQuery]?.projectV2.id
  }

  // TODO: support 'ProjectV2IterationField' Type
  async fetchProjectV2FieldByName(
    projectV2Id: string,
    fieldName: string
  ): Promise<ProjectV2Field | null | undefined> {
    const projectV2FieldResponse = await this.octokit.graphql<ProjectV2FieldResponse>(
      `query fetchProjectV2FieldByName($projectOwnerName: String!, $fieldName: Int!) {
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
            }
          }
        }
      }`,
      {
        projectV2Id,
        fieldName
      }
    )

    return projectV2FieldResponse.node?.field
  }
}
