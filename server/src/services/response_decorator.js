const { STATUS_CODES } = require('http')
const config = require('../configs')

function decorator(err, req, res, next) {

  // mongoose-unique-validator error
  if(err._message && err._message.includes('validation failed')) {
    err.statusCode = 400
    err.message = err._message
    err.data = JSON.parse(JSON.stringify(err.errors))
    console.log(' ------- ResDec - Mongoose-Unique-Validator ERROR:', err)
  }

  if(err.isBoom) {
    err.statusCode = err.output.statusCode
    err.message = err.output.payload.message
    console.log(' ------- ResDec - BOOM ERROR:', err)
  }

  if(err.joi) {
    err.statusCode = 400
    err.message = err.joi.details
    console.log(' ------- ResDec - JOI ERROR:', err)
  }

  const response = res.result ? {
    status: '',
    statusCode: res.statusCode,
    success: (typeof res.result != 'string'),
    result: res.result,
    request: {
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
      route: req.route
    }
  } : {
    statusCode: err.statusCode || (err.status || (err.code || 500)),
    message: err.message || STATUS_CODES[500],
    body: err.data || null
  }

  if(typeof response.statusCode != 'number') {
    response.status = response.statusCode
    response.statusCode = 500
    console.log(' ------- ResDec - STRING STATUS CODE:', err)
  } else delete response.status

  if(response.statusCode >= 500) console.log(' ------- ResDec - SERVER ERROR:', err)

  // Remove request info if not in Development Mode
  if(config.env.NODE_ENV !== 'development') delete response.request

  res.status(response.statusCode).json(response)
  next()
}

module.exports = decorator
