import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(scrypt)
const OPTIONS = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
export const SESSION_SECONDS = 3600
export const COOKIE_NAME = 'findine_admin'

export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex')
    const key = await derive(password, salt, 64, OPTIONS)
    return `scrypt:${salt}:${key.toString('hex')}`
}

export function getAdminConfig() {
    const username = process.env.ADMIN_USERNAME?.trim()
    const passwordHash = process.env.ADMIN_PASSWORD_HASH
    const secret = process.env.ADMIN_SESSION_SECRET
    if (
        !username ||
        !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash || '') ||
        !secret ||
        secret.length < 32
    ) {
        return null
    }
    return { username, passwordHash, secret }
}

function equal(a, b) {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
}

export async function verifyPassword(password, passwordHash) {
    const [, salt, expected] = passwordHash.split(':')
    const key = await derive(password, salt, 64, OPTIONS)
    return equal(key.toString('hex'), expected)
}

const sign = (value, secret) => createHmac('sha256', secret).update(value).digest('base64url')

export function createSession(config) {
    const payload = Buffer.from(
        JSON.stringify({
            username: config.username,
            expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
            credential: sign(config.passwordHash, config.secret),
            nonce: randomBytes(16).toString('hex'),
        }),
    ).toString('base64url')
    return `${payload}.${sign(payload, config.secret)}`
}

export function readSession(cookieHeader, config) {
    if (!config || typeof cookieHeader !== 'string') return null
    const token = cookieHeader
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith(`${COOKIE_NAME}=`))
        ?.slice(COOKIE_NAME.length + 1)
    if (!token || token.length > 2048) return null
    const [payload, signature, extra] = token.split('.')
    if (!payload || !signature || extra !== undefined || !equal(sign(payload, config.secret), signature))
        return null
    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
        const now = Math.floor(Date.now() / 1000)
        if (
            session.username !== config.username ||
            !Number.isSafeInteger(session.expires) ||
            session.expires <= now ||
            session.expires > now + SESSION_SECONDS ||
            !equal(String(session.credential), sign(config.passwordHash, config.secret))
        )
            return null
        return session.username
    } catch {
        return null
    }
}

export function cookieOptions(req) {
    return {
        httpOnly: true,
        sameSite: 'strict',
        secure:
            process.env.NODE_ENV === 'production' || req.secure || req.get('x-forwarded-proto') === 'https',
        path: '/api',
    }
}
