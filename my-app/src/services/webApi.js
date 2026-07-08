const API_BASE_URL = import.meta.env.VITE_META_API_URL || ''
export const apiEnabled = Boolean(API_BASE_URL)

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Meta API is not configured')
  }

  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Meta API request failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

export async function getBusinessList(ownerId) {
  return request(`/businesses?ownerId=${encodeURIComponent(ownerId)}`)
}

export async function getBusinessDetails(businessId) {
  return request(`/businesses/${encodeURIComponent(businessId)}`)
}

export async function createBusinessRecord(payload) {
  return request('/businesses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateBusinessRecord(businessId, payload) {
  return request(`/businesses/${encodeURIComponent(businessId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteBusinessRecord(businessId) {
  return request(`/businesses/${encodeURIComponent(businessId)}`, {
    method: 'DELETE',
  })
}

export async function getMetaPagePosts() {
  return request('/meta/page-posts')
}

export async function getMetaInstagramAccount() {
  return request('/meta/instagram-account')
}
