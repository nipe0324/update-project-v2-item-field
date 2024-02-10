import { Item } from '../src/item'
import { ProjectV2Item } from '../src/ex-octokit'

describe('fromGraphQL', () => {
  it('builds Item', async () => {
    const data: ProjectV2Item = {
      id: 'item-id',
      fieldValues: {
        nodes: [
          {
            __typename: 'ProjectV2ItemFieldRepositoryValue'
          },
          {
            __typename: 'ProjectV2ItemFieldDateValue',
            field: {
              name: 'Date Field'
            },
            date: '2024-02-02'
          },
          {
            __typename: 'ProjectV2ItemFieldIterationValue',
            field: {
              name: 'Iteration'
            },
            title: 'Iteration 1'
          },
          {
            __typename: 'ProjectV2ItemFieldNumberValue',
            field: {
              name: 'Number Field'
            },
            number: 100.2
          },
          {
            __typename: 'ProjectV2ItemFieldSingleSelectValue',
            field: {
              name: 'Status'
            },
            name: 'In Progress'
          },
          {
            __typename: 'ProjectV2ItemFieldTextValue',
            field: {
              name: 'Text Field'
            },
            text: 'Hello, World!'
          }
        ]
      }
    }

    const item = Item.fromGraphQL(data)
    expect(item.id).toEqual('item-id')
    expect(item.fieldValues).toEqual({
      'Date Field': '2024-02-02',
      Iteration: 'Iteration 1',
      'Number Field': 100.2,
      Status: 'In Progress',
      'Text Field': 'Hello, World!'
    })
  })
})
