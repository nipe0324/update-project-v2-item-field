export function mustGetOwnerTypeQuery(
  ownerType?: string
): 'organization' | 'user' {
  const ownerTypeQuery =
    ownerType === 'orgs'
      ? 'organization'
      : ownerType === 'users'
        ? 'user'
        : null

  if (!ownerTypeQuery) {
    throw new Error(
      `Unsupported ownerType: ${ownerType}. Must be one of 'orgs' or 'users'`
    )
  }

  return ownerTypeQuery
}
