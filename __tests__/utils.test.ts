import { mustGetOwnerTypeQuery } from '../src/utils'

describe('mustGetOwnerTypeQuery', () => {
  test('returns organization for orgs ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('orgs')

    expect(ownerTypeQuery).toEqual('organization')
  })

  test('returns user for users ownerType', async () => {
    const ownerTypeQuery = mustGetOwnerTypeQuery('users')

    expect(ownerTypeQuery).toEqual('user')
  })

  test('throws an error when an unsupported ownerType is set', async () => {
    expect(() => {
      mustGetOwnerTypeQuery('unknown')
    }).toThrow(
      `Unsupported ownerType: unknown. Must be one of 'orgs' or 'users'`
    )
  })
})
