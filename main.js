'use strict'

const Hapi = require('@hapi/hapi')
const Nes = require('@hapi/nes')

const wordList = [
    'Hello there.',
    'I am a robot.',
    'How are you?',
    'I like blue.',
    'I eat bolts.',
    'I am very glad to get to meet you.',
]

let server

const publish = (index) => {
    console.log('publish', wordList[index])
    server.publish('/item/5', { id: 5, index, word: wordList[index] })
}
let index = 0
let intervalId = null

const handleWords = () => {
    if (index >= wordList.length) {
        index = 0
    }
    publish(index)
    index++
}

const publishWords = () => {
    if (intervalId === null) {
        intervalId = setInterval(() => {
            handleWords()
        }, 5000)
    }
}

const init = async () => {
    console.log('Starting Hapi')
    server = Hapi.server({
        port: 3001,
        host: '0.0.0.0',
        routes: {
            cors: true,
        },
    })
    console.log('Started on port 3001')
    await server.register(Nes)
    console.log('Web sockets started')
    server.route([
        {
            method: 'GET',
            path: '/api/test',
            handler: (request, h) => {
                console.log('request made /api/test')
                return { message: 'Test request' }
            },
        },
        {
            method: 'GET',
            path: '/api/hello',
            handler: (request, h) => {
                console.log('request made /api/hello')
                return { message: 'Hello World!' }
            },
        },
        {
            method: 'GET',
            path: '/ws/hello',
            config: {
                id: 'hello',
                handler: (request, h) => {
                    console.log('ws: hello')
                    return 'world!'
                },
            },
        },
        {
            method: 'GET',
            path: '/ws/start',
            config: {
                id: 'start',
                handler: (request, h) => {
                    console.log('ws: start')
                    publishWords()
                    return 'start'
                },
            },
        },
        {
            method: 'GET',
            path: '/ws/stop',
            config: {
                id: 'stop',
                handler: (request, h) => {
                    console.log('ws: stop')
                    cancelInterval(intervalId)
                    return 'stop'
                },
            },
        },
    ])

    await server.start()
    console.log('Server running on %s', server.info.uri)

    server.subscription('/item/{id}')
    console.log('Setting subscription for /item/{id}')
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
