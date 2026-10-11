/** Validate query values before either MongoDB or the JSON fallback uses them. */
export default function restaurantQuery({ best = false } = {}) {
    return (req, res, next) => {
        const invalid = (message) => res.status(400).json({ error: message })
        const { search = '', borough = '', limit, page } = req.query
        if (typeof search !== 'string' || search.length > 200) {
            return invalid('search must be a single string of at most 200 characters')
        }
        if (!best && (typeof borough !== 'string' || borough.length > 100)) {
            return invalid('borough must be a single string of at most 100 characters')
        }

        function positiveInteger(value, fallback) {
            if (value === undefined) return fallback
            if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
            const number = Number(value)
            return Number.isSafeInteger(number) ? number : null
        }

        const parsedLimit = positiveInteger(limit, best ? 50 : 25)
        const parsedPage = best ? 1 : positiveInteger(page, 1)
        if (parsedLimit === null || parsedPage === null) {
            return invalid('limit and page must be single positive safe integers')
        }
        const cappedLimit = Math.min(parsedLimit, best ? 200 : 100)
        if (!Number.isSafeInteger((parsedPage - 1) * cappedLimit)) {
            return invalid('page is too large')
        }

        req.validatedQuery = { search, borough, limit: cappedLimit, page: parsedPage }
        next()
    }
}
