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
      `query getProject($projectOwnerName: String!, $projectNumber: Int!) {
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
}
