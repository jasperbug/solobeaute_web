import { cache } from 'react'

import { API_BASE_URL } from './constants'
import type {
  BeauticianDetail,
  BeauticianDetailResponse,
  BeauticianSearchParams,
  BeauticianSearchResponse,
  BeauticianSummary,
  FeaturedBeauticianResponse,
  ShareEntityType,
  ShareableBeauticianResponse,
  ShareableSpaceResponse,
  SpaceSummary,
} from './types'

function buildQuery(params: BeauticianSearchParams) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    query.set(key, String(value))
  })

  return query.toString()
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

export async function fetchBeauticians(params: BeauticianSearchParams = {}) {
  const query = buildQuery(params)
  const url = query ? `${API_BASE_URL}/beauticians?${query}` : `${API_BASE_URL}/beauticians`
  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch beauticians (${response.status})`)
  }

  return parseJson<BeauticianSearchResponse>(response)
}

export const fetchFeaturedBeauticians = cache(async (limit = 6): Promise<BeauticianSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/beauticians/featured?limit=${limit}`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch featured beauticians (${response.status})`)
  }

  const payload = await parseJson<FeaturedBeauticianResponse>(response)
  return payload.data
})

export const fetchBeauticianBySlug = cache(async (slug: string): Promise<BeauticianDetail | null> => {
  const response = await fetch(`${API_BASE_URL}/beauticians/${slug}`, {
    next: { revalidate: 600 },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch beautician (${response.status})`)
  }

  const payload = await parseJson<BeauticianDetailResponse>(response)
  return payload.data
})

export async function fetchShareEntity(type: ShareEntityType, id: string) {
  const endpoint = type === 'space' ? 'spaces' : 'beauticians'
  const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch share entity (${response.status})`)
  }

  if (type === 'space') {
    const payload = await parseJson<ShareableSpaceResponse>(response)
    return payload.data as SpaceSummary | BeauticianDetail
  }

  const payload = await parseJson<ShareableBeauticianResponse>(response)
  return payload.data as SpaceSummary | BeauticianDetail
}
