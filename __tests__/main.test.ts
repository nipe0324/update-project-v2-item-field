import { run } from '../src/main'
import * as updateProjectV2ItemFieldModule from '../src/update-project-v2-item-field'
import * as core from '@actions/core'

jest.mock('@actions/core')

const mockUpdateProjectV2ItemField = jest
  .spyOn(updateProjectV2ItemFieldModule, 'updateProjectV2ItemField')
  .mockImplementation()

describe('run', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call updateProjectV2ItemField', async () => {
    await run()
    expect(mockUpdateProjectV2ItemField).toHaveBeenCalled()
  })

  it('should handle errors', async () => {
    const error = new Error('Test error')
    mockUpdateProjectV2ItemField.mockImplementationOnce(() => {
      throw error
    })

    await run()
    expect(core.setFailed).toHaveBeenCalledWith(error.message)
  })
})
