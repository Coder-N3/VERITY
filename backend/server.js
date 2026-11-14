const express = require('express')
const cors = require('cors')

const imageRoutes = require('./routes/imageRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Image routes
app.use('/api/images', imageRoutes)

// Health check
app.get('/api/health', (req, res) => {

    res.json({
        status: 'success',
        message: 'VERITY backend is running!'
    })

})

const PORT = 5000

app.listen(PORT, () => {
    console.log(`VERITY server running on port ${PORT}`)
})