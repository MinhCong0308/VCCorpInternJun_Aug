module.exports = {
    secret : process.env.JWT_SECRET || 'secret',
    ttl: '1h' // time take live, jwt secrets will live 1h before unavailable
}
