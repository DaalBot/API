module.exports = {
    200: 'string',
    404: {
        error: 'Not Found',
        message: 'The event you are trying to read does not exist.'
    },
    403: {
        error: 'Forbidden',
        message: 'You do not have permission to read this event.'
    }
}