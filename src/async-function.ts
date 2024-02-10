/* eslint-disable @typescript-eslint/promise-function-async */

import { Context } from '@actions/github/lib/context'
import { Item } from './item'

const AsyncFunction = Object.getPrototypeOf(async () => null).constructor

export type AsyncFunctionArguments = {
  context: Context
  item: Item
}

export function callAsyncFunction<T>(
  args: AsyncFunctionArguments,
  source: string
): Promise<T> {
  const fn = new AsyncFunction(...Object.keys(args), source)
  return fn(...Object.values(args))
}
