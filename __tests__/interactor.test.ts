import * as core from '@actions/core'

import { Interactor } from '../src/interactor'
import { ExOctokit } from '../src/ex-octokit'

import type { ProjectV2Field } from '../src/ex-octokit'
import type { Inputs } from '../src/inputs'

describe('Interactor', () => {
  describe('validateInputs', () => {
    it('should throw an error if both fieldValue and fieldValueScript are empty', () => {
      const inputs = mockInputs({ fieldValue: '', fieldValueScript: '' })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      expect(() => interactor.validateInputs()).toThrow(
        '`field-value` or `field-value-script` is required.'
      )
    })

    it('should not throw an error if fieldValue is not empty', () => {
      const inputs = mockInputs({ fieldValue: 'test', fieldValueScript: '' })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      expect(() => interactor.validateInputs()).not.toThrow()
    })

    it('should not throw an error if fieldValueScript is not empty', () => {
      const inputs = mockInputs({
        fieldValue: '',
        fieldValueScript: "return 'test'"
      })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      expect(() => interactor.validateInputs()).not.toThrow()
    })
  })

  describe('fetchProjectV2Id', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should fetch project V2 ID', async () => {
      mockFetchProjectV2Id().mockResolvedValue('project-id')

      const inputs = mockInputs({
        projectUrl: 'https://github.com/orgs/nipe0324/projects/1'
      })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)
      const result = await interactor.fetchProjectV2Id()

      expect(result).toBe('project-id')
    })

    it(`should throw an error when url isn't a valid project url`, async () => {
      const inputs = mockInputs({
        projectUrl: 'https://github.com/orgs/github/repositories'
      })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      await expect(interactor.fetchProjectV2Id()).rejects.toThrow(
        'Invalid project URL: https://github.com/orgs/github/repositories.'
      )
    })

    it(`should throw an error when project V2 ID is undefinde`, async () => {
      mockFetchProjectV2Id().mockResolvedValue(undefined)

      const inputs = mockInputs({
        projectUrl: 'https://github.com/orgs/nipe0324/projects/1'
      })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      await expect(interactor.fetchProjectV2Id()).rejects.toThrow(
        'ProjectV2 ID is undefined'
      )
    })
  })

  describe('fetchProjectV2FieldByName', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should fetch project V2 field', async () => {
      mockFetchProjectV2FieldByName().mockResolvedValue({
        id: 'field-id',
        dataType: 'TEXT'
      })

      const inputs = mockInputs({ fieldName: 'field-id' })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)
      const result = await interactor.fetchProjectV2FieldByName('project-id')

      expect(result).toEqual({
        id: 'field-id',
        dataType: 'TEXT'
      })
    })

    it('should throw an error if the field is not found', async () => {
      mockFetchProjectV2FieldByName().mockResolvedValue(undefined)

      const inputs = mockInputs({ fieldName: 'not-found-field-id' })
      const exOctokit = new ExOctokit('token')

      const interactor = new Interactor(inputs, exOctokit)

      await expect(
        interactor.fetchProjectV2FieldByName('project-id')
      ).rejects.toThrow(`Field is not found: not-found-field-id`)
    })
  })

  describe('updateItemField', () => {
    let info: jest.SpyInstance

    beforeEach(() => {
      info = mockInfo()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should update project V2 item field', async () => {
      mockAddProjectV2ItemByContentId().mockResolvedValue({ id: 'item-id' })
      mockUpdateProjectV2ItemFieldValue().mockResolvedValue({ id: 'item-id' })

      const inputs = mockInputs({ fieldName: 'field-id' })
      const exOctokit = new ExOctokit('token')
      const field: ProjectV2Field = {
        __typename: 'ProjectV2Field',
        id: 'field-id',
        name: 'field-name',
        dataType: 'TEXT'
      }

      const interactor = new Interactor(inputs, exOctokit)
      const result = await interactor.updateItemField(
        'project-id',
        'content-id',
        field
      )

      expect(result).toEqual('item-id')
      expect(info).toHaveBeenCalledWith('update the project V2 item field')
    })
  })
})

/* eslint-disable @typescript-eslint/no-explicit-any */
function mockInputs(inputs: any): Inputs {
  return {
    projectUrl:
      inputs.projectUrl ?? 'https://github.com/orgs/nipe0324/projects/1',
    ghToken: inputs.ghToken ?? 'gh_token',
    fieldName: inputs.fieldName ?? 'field-name',
    fieldValue: inputs.fieldValue ?? 'field-value',
    fieldValueScript: inputs.fieldValueScript ?? 'return field-value-script',
    skipUpdateScript: inputs.skipUpdateScript ?? 'return false'
  }
}

function mockInfo(): jest.SpyInstance {
  return jest.spyOn(core, 'info').mockImplementation()
}

function mockFetchProjectV2Id(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'fetchProjectV2Id')
}

function mockAddProjectV2ItemByContentId(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'addProjectV2ItemByContentId')
}

function mockFetchProjectV2FieldByName(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'fetchProjectV2FieldByName')
}

function mockUpdateProjectV2ItemFieldValue(): jest.SpyInstance {
  return jest.spyOn(ExOctokit.prototype, 'updateProjectV2ItemFieldValue')
}
