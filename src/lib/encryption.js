import crypto from 'crypto'

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-here!!'
const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} The encrypted text in format iv:encrypted
 */
export function encrypt(text) {
    if (!text) return null
    try {
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        return iv.toString('hex') + ':' + encrypted
    } catch (error) {
        console.error('Encryption error:', error)
        throw error
    }
}

/**
 * Decrypts text using AES-256-CBC
 * @param {string} text - The encrypted text in format iv:encrypted
 * @returns {string} The decrypted text
 */
export function decrypt(text) {
    if (!text) return null
    try {
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
        const parts = text.split(':')
        if (parts.length !== 2) return text // Fallback if not encrypted

        const iv = Buffer.from(parts[0], 'hex')
        const encryptedText = parts[1]

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Decryption error:', error)
        // If decryption fails, it might not be encrypted
        return text
    }
}
