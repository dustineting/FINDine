import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../server/services/adminAuth.js'

if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
        'Run npm run admin:setup in your own interactive terminal. Do not pass credentials as command arguments.',
    )
    process.exit(1)
}

let muted = false
const output = new Writable({
    write(chunk, _encoding, callback) {
        if (!muted) process.stdout.write(chunk)
        callback()
    },
})
const prompt = createInterface({ input: process.stdin, output, terminal: true })
async function passwordQuestion(message) {
    process.stdout.write(message)
    muted = true
    try {
        return await prompt.question('')
    } finally {
        muted = false
        process.stdout.write('\n')
    }
}

try {
    const username = (await prompt.question('Admin Username: ')).trim()
    if (!/^[a-zA-Z0-9_.@-]{3,100}$/.test(username))
        throw new Error(
            'Use 3–100 letters, numbers, dots, underscores, @ signs, or hyphens for the username.',
        )
    const password = await passwordQuestion('Admin Password (Hidden, at least 12 characters): ')
    if (password.length < 12 || password.length > 256)
        throw new Error('Use a password between 12 and 256 characters.')
    if (password !== (await passwordQuestion('Confirm Password (Hidden): ')))
        throw new Error('Passwords did not match.')
    const file = fileURLToPath(new URL('../.env', import.meta.url))
    let content = ''
    try {
        content = await readFile(file, 'utf8')
    } catch (error) {
        if (error.code !== 'ENOENT') throw error
    }
    const values = {
        ADMIN_USERNAME: username,
        ADMIN_PASSWORD_HASH: await hashPassword(password),
        ADMIN_SESSION_SECRET: randomBytes(32).toString('base64url'),
    }
    for (const [name, value] of Object.entries(values)) {
        const pattern = new RegExp(`^${name}=.*$`, 'm')
        content = pattern.test(content)
            ? content.replace(pattern, `${name}=${value}`)
            : `${content.trimEnd()}\n${name}=${value}\n`
    }
    await writeFile(file, content, { mode: 0o600 })
    console.log(
        'Admin configuration saved in .env. Restart the server. Copy the three ADMIN_ values to Vercel for Preview/Production when ready.',
    )
    console.log('Running this command again rotates the session secret and signs out existing sessions.')
} catch (error) {
    console.error(error.message)
    process.exitCode = 1
} finally {
    prompt.close()
}
