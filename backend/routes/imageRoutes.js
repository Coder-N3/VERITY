const express = require('express')
const multer = require('multer')
const { execFile } = require('child_process')
const { promisify } = require('util')
const fs = require('fs/promises')
const os = require('os')
const path = require('path')

const router = express.Router()
const execFileAsync = promisify(execFile)

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})

const projectRoot = path.join(__dirname, '..', '..')

const pythonPath = path.join(
    projectRoot,
    '.venv',
    'Scripts',
    'python.exe'
)

const metadataScript = path.join(
    projectRoot,
    'python_service',
    'metadata.py'
)

router.post('/upload', upload.single('image'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image.'
        })
    }

    let tempDir

    try {
        tempDir = await fs.mkdtemp(
            path.join(os.tmpdir(), 'verity-')
        )

        const extension = path.extname(req.file.originalname)
        const imagePath = path.join(tempDir, `upload${extension}`)

        await fs.writeFile(imagePath, req.file.buffer)

        // 1. Extract image metadata
        const { stdout } = await execFileAsync(
            pythonPath,
            [metadataScript, imagePath]
        )

        const metadata = JSON.parse(stdout)

        // 2. Send image to FastAPI for AI detection
        const formData = new FormData()

        formData.append(
            'file',
            new Blob([req.file.buffer]),
            req.file.originalname
        )

        // Forward the user's claim to Python
formData.append('claim', req.body.claim || '')

        const aiResponse = await fetch(
            'http://127.0.0.1:8000/analyze/ai',
            {
                method: 'POST',
                body: formData
            }
        )

        if (!aiResponse.ok) {
            throw new Error('AI detection service failed.')
        }

        const aiResult = await aiResponse.json()

        // 3. Return both results to React
        res.json({
            success: true,
            message: 'Image analysis completed!',
            metadata: metadata,
            aiDetection: aiResult
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            success: false,
            message: 'Image analysis failed.',
            error: error.message
        })

    } finally {
        if (tempDir) {
            await fs.rm(tempDir, {
                recursive: true,
                force: true
            })
        }
    }
})

// Reverse image search using Google Lens
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
            'http://127.0.0.1:8000/analyze/reverse-search',
            {
                method: 'POST',
                body: formData
            }
        )

        if (!response.ok) {
            throw new Error('Google Lens search failed.')
        }

        const result = await response.json()

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