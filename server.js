const fs = require('fs')
const http = require('http')
const path = require('path')
const querystring = require('querystring')
const request = require('request')
const express = require('express')
const app = express()

const searchHistory = loadHistory() || []

app.get('/api/imagesearch', (request, response) => {

    response.set({ 'content-type': 'application/json; charset=utf-8' })
    response.json(searchHistory)
})

app.get('/api/imagesearch/:string', (request, response) => {
    
    const searchString = request.params.string
    const offset = request.query.offset || 0 

    searchImage(searchString, offset, (error, body) => {
        if(error) {
            console.error(error)
            response.end(error.message)
            return
        }
        
        const json = parse(body)

        if(!json){
            response.end('some error occured')
            return
        }
        
        response.set({ 'content-type': 'application/json; charset=utf-8' })
        response.json(json)
        save(searchString)
    })
})

app.use(express.static(path.join(__dirname, 'public')))

const port = process.env.PORT || 8080
http.createServer(app).listen(port, () => {
    console.log('http server started at port ' + port)
})

function loadHistory() {
    const data = fs.readFileSync('statistic.json', 'utf-8')
    return JSON.parse(data)
}

function save(searchString) {
    const date = new Date().toISOString()
    const length = searchHistory.unshift({term: searchString, when: date})
    if(length >= 10) searchHistory.pop()
    fs.writeFileSync('statistic.json',JSON.stringify(searchHistory))
}


function parse(body){

    try{
        const values = JSON.parse(body).value
        return json = values.map( value => {
            return {
                url: querystring.parse(value.contentUrl).r,
                context: querystring.parse(value.hostPageUrl).r,
                thumbnail: value.thumbnailUrl,
                published: value.datePublished,
                snippet: value.name
            }
        })
    } catch(e) {
       console.error(e) 
       return null
    }
}

function searchImage(searchString, offset, callback){
    
    const query = querystring.stringify({
        q: searchString,
        count: 10,
        offset: offset || 0
    })
    const options = {
        uri: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?'+query,
        method: 'GET',
        headers:{
            'content-type': 'application/x-www-form-urlencoded',
            'Ocp-Apim-Subscription-Key': 'b87933392b884f9a86fe7d5f1dfd7e38'
        }
    }
    
    request(options, (error, response, body) =>  callback(error, body))
}
