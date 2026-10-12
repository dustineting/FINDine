const own = (object, key) => Object.hasOwn(object, key)
const object = (value) => value && typeof value === 'object' && !Array.isArray(value)

export default function restaurantBody(req, res, next) {
    const body = req.body
    const invalid = (message) => res.status(400).json({ error: message })
    if (!object(body)) return invalid('A restaurant object is required.')
    const fields = ['name', 'restaurant_id', 'borough', 'cuisine', 'address', 'grades']
    if (Object.keys(body).some((key) => !fields.includes(key)))
        return invalid('The restaurant contains unsupported fields.')
    const patch = req.method === 'PATCH'
    const result = {}
    for (const field of ['name', 'restaurant_id', 'borough', 'cuisine']) {
        if (!own(body, field)) {
            if (!patch && field !== 'restaurant_id') return invalid(`${field} is required.`)
            continue
        }
        const maxLength = field === 'borough' ? 100 : 200
        if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > maxLength)
            return invalid(`${field} must contain 1 to ${maxLength} characters.`)
        result[field] = body[field].trim()
    }
    if (own(body, 'address')) {
        if (
            !object(body.address) ||
            !Object.keys(body.address).length ||
            Object.keys(body.address).some((key) => !['building', 'street', 'zipcode'].includes(key))
        )
            return invalid('Address must contain supported fields: building, street, or zipcode.')
        result.address = {}
        for (const [key, value] of Object.entries(body.address)) {
            if (typeof value !== 'string' || value.length > 200)
                return invalid(`Address ${key} must be a string of at most 200 characters.`)
            result.address[key] = value.trim()
        }
    }
    if (own(body, 'grades')) {
        if (!Array.isArray(body.grades) || body.grades.length > 100)
            return invalid('Provide at most 100 inspection records.')
        result.grades = []
        for (const grade of body.grades) {
            if (
                !object(grade) ||
                Object.keys(grade).some((key) => !['date', 'grade', 'score'].includes(key)) ||
                typeof grade.date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/.test(grade.date) ||
                !Number.isFinite(Date.parse(grade.date)) ||
                new Date(grade.date).toISOString().slice(0, 10) !== grade.date.slice(0, 10) ||
                typeof grade.grade !== 'string' ||
                !grade.grade.trim() ||
                grade.grade.length > 30 ||
                !Number.isInteger(grade.score) ||
                grade.score < 0 ||
                grade.score > 1000
            )
                return invalid(
                    'Each inspection needs a valid date, grade, and whole-number score from 0 to 1000.',
                )
            result.grades.push({ date: new Date(grade.date), grade: grade.grade.trim(), score: grade.score })
        }
    }
    if (!Object.keys(result).length) return invalid('Provide at least one restaurant field to save.')
    req.restaurantBody = result
    next()
}
