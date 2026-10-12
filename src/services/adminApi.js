async function request(path, { method = 'GET', body } = {}) {
    let response
    try {
        response = await fetch(`/api${path}`, {
            method,
            credentials: 'same-origin',
            headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(20_000),
        })
    } catch (cause) {
        throw new Error(
            cause.name === 'TimeoutError'
                ? 'The request timed out. Refresh the list before retrying a change.'
                : 'Unable to reach FINDine. Check your connection and try again.',
        )
    }
    if (response.status === 204) return null
    let data
    try {
        data = await response.json()
    } catch {
        throw new Error('The server returned an unexpected response.')
    }
    if (!response.ok) {
        const error = new Error(data.error || 'Unable to complete the request.')
        error.status = response.status
        throw error
    }
    return data
}

export const fetchSession = () => request('/admin/session')
export const login = (body) => request('/admin/login', { method: 'POST', body })
export const logout = () => request('/admin/logout', { method: 'POST' })
export const fetchManagedRestaurants = (params) =>
    request(`/admin/restaurants?${new URLSearchParams(params)}`)
export const createRestaurant = (body) => request('/restaurants', { method: 'POST', body })
export const updateRestaurant = (id, body) =>
    request(`/restaurants/${encodeURIComponent(id)}`, { method: 'PATCH', body })
export const deleteRestaurant = (id) =>
    request(`/restaurants/${encodeURIComponent(id)}`, { method: 'DELETE' })
