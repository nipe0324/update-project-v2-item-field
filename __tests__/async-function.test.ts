/* eslint-disable @typescript-eslint/no-explicit-any */

import { callAsyncFunction } from '../src/async-function'

describe('callAsyncFunction', () => {
  test('calls the function with its arguments', async () => {
    await expect(
      callAsyncFunction({ foo: 'bar' } as any, 'return foo')
    ).resolves.toBe('bar')
  })

  test('throws on ReferenceError', async () => {
    await expect(callAsyncFunction({} as any, 'proces')).rejects.toThrow(
      'proces is not defined'
    )
  })

  test('can access process', async () => {
    await expect(callAsyncFunction({} as any, 'process')).resolves.toBe(
      undefined
    )
  })

  test('can access console', async () => {
    await expect(callAsyncFunction({} as any, 'console')).resolves.toBe(
      undefined
    )
  })
})
