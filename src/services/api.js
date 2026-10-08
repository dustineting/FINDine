const BASE = '/api/restaurants'
// Allow time for the server's 5-second connection and 8-second query budgets.
const REQUEST_TIMEOUT_MS = 20_000

async function getJSON(path = '', params = {}) {
    const query = new URLSearchParams(params).toString()
    let response
    try {
        response = await fetch(BASE + path + (query ? '?' + query : ''), {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
    } catch (error) {
        if (error.name === 'TimeoutError') throw new Error('The request took too long. Please try again.')
        throw new Error('Unable to reach the server. Please try again.')
    }
    if (!response.ok) throw new Error('Unable to load restaurant data. Please try again.')
    try {
        return await response.json()
    } catch {
        throw new Error('The server returned an unexpected response. Please try again.')
    }
}

export const fetchRestaurants = (params = {}) => getJSON('', params)
export const fetchBestRestaurants = (params = {}) => getJSON('/best', params)
export const fetchBoroughs = () => getJSON('/boroughs')
export const fetchStats = () => getJSON('/stats')
