/**
 * Formats a phone number and message into a WhatsApp Web URL
 * @param {string} phone - The phone number (any format)
 * @param {string} message - The message text
 * @returns {string} The WhatsApp Web URL
 */
export const formatWhatsAppUrl = (phone, message) => {
    if (!phone) return ''

    // Clean phone number: remove non-digits
    let cleanPhone = phone.replace(/\D/g, '')

    // Remove leading 0 if present (common in Israel 050...)
    if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1)
    }

    // Add country code if missing (default to Israel 972)
    if (!cleanPhone.startsWith('972')) {
        cleanPhone = '972' + cleanPhone
    }

    const encodedMessage = encodeURIComponent(message || '')
    // Use custom scheme for direct app opening
    return `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
}

/**
 * Replace placeholders in a template string
 * @param {string} template - The template string with {key} placeholders
 * @param {object} variables - Object containing values for keys
 * @returns {string} The formatted string
 */
export const formatTemplate = (template, variables) => {
    if (!template) return ''

    return template.replace(/{(\w+)}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match
    })
}
