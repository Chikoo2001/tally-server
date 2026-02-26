/**
 * Converts Mongoose / MongoDB errors into user-readable messages.
 */
function formatError(err) {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    return messages.join('. ')
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    const value = err.keyValue?.[field]
    const label = field === 'name' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)
    return `${label} "${value}" already exists`
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return `Invalid value for field "${err.path}"`
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return 'Invalid token'
  if (err.name === 'TokenExpiredError') return 'Token expired, please log in again'

  return err.message || 'Something went wrong'
}

/**
 * Send a formatted error response.
 * Client errors (duplicate key, validation, cast) → 400
 * Everything else → 500
 */
function sendError(res, err) {
  const isClientError =
    err.code === 11000 ||
    ['ValidationError', 'CastError'].includes(err.name)
  const status = isClientError ? 400 : 500
  res.status(status).json({ message: formatError(err) })
}

module.exports = { formatError, sendError }
