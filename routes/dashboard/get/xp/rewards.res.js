module.exports = {
    200: 'Array<{name: string, value: string, roleName: string}>',
    400: [
        { // Why is this even here this should be caught by the handler
            error: 'Missing guild query'
        }
    ]
}