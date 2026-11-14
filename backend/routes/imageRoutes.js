const express = require('express')
const multer = require('multer')

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})

// Python API address
const PYTHON_API = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000'


// IMAGE UPLOAD AND ANALYSIS
router.post('/upload', upload.single('image'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image.'
        })
    }

    try {

        const formData = new FormData()

        formData.append(
            'file',
            new Blob([req.file.buffer]),
            req.file.originalname
        )

        formData.append('claim', req.body.claim || '')

        const response = await fetch(
            `${PYTHON_API}/analyze/ai`,
            {
                method: 'POST',
                body: formData
            }
        )

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.detail || 'Python analysis failed.')
        }

        res.json({
            success: true,
            message: 'Image analysis completed!',
            filename: result.filename,
            metadata: result.metadata,
            aiDetection: result
        })

    } catch (error) {

        console.error('IMAGE ANALYSIS ERROR:', error)

        res.status(500).json({
            success: false,
            message: 'Image analysis failed.',
            error: error.message
        })
    }
})


// REVERSE IMAGE SEARCH
router.post('/reverse-search', upload.single('image'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image.'
        })
    }

    try {

        const formData = new FormData()

        formData.append(
            'file',
            new Blob([req.file.buffer]),
            req.file.originalname
        )

        const response = await fetch(
            `${PYTHON_API}/analyze/reverse-search`,
            {
                method: 'POST',
                body: formData
            }
        )

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.detail || 'Google Lens search failed.')
        }

        res.json({
            success: true,
            googleLens: result.google_lens
        })

    } catch (error) {

        console.error('REVERSE SEARCH ERROR:', error)

        res.status(500).json({
            success: false,
            message: 'Reverse image search failed.',
            error: error.message
        })
    }
})


module.exports = router