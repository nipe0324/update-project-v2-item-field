/* eslint-disable @typescript-eslint/no-explicit-any */

import { ProjectV2Item } from './ex-octokit'

interface ItemFieldValues {
  [key: string]: any
}

export class Item {
  id: string
  fieldValues: ItemFieldValues

  constructor(id: string, fieldValues: ItemFieldValues) {
    this.id = id
    this.fieldValues = fieldValues
  }

  static fromGraphQL(data: ProjectV2Item): Item {
    const nodes = data.fieldValues?.nodes ?? []

    const fieldValues: ItemFieldValues = {}
    for (const node of nodes) {
      const fieldName = node.field?.name
      if (!fieldName) continue

      switch (node.__typename) {
        case 'ProjectV2ItemFieldDateValue':
          fieldValues[fieldName] = node.date
          break
        case 'ProjectV2ItemFieldIterationValue':
          fieldValues[fieldName] = node.title
          break
        case 'ProjectV2ItemFieldNumberValue':
          fieldValues[fieldName] = node.number
          break
        case 'ProjectV2ItemFieldSingleSelectValue':
          fieldValues[fieldName] = node.name
          break
        case 'ProjectV2ItemFieldTextValue':
          fieldValues[fieldName] = node.text
          break
        default:
          break // not support other types
      }
    }

    return new Item(data.id, fieldValues)
  }
}
