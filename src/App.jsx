import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [image, setImage] = useState('')
  const [fileName, setFileName] = useState('')
  const [claim, setClaim] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [lensResults, setLensResults] = useState(null)
const [lensLoading, setLensLoading] = useState(false)
const resultsRef = useRef(null)

  function handleImageChange(event) {
    const file = event.target.files[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image.')
      return
    }

    setSelectedFile(file)
    setResults(null)
setLensResults(null)

    const reader = new FileReader()

    reader.onload = () => {
      setImage(reader.result)
      setFileName(file.name)
      setMessage('')
    }

    reader.readAsDataURL(file)
  }

  async function handleVerify(event) {
    event.preventDefault()

    if (!selectedFile) {
      setMessage('Please upload an image first.')
      return
    }

    setLoading(true)
    setResults(null)
    setMessage('Investigating your image...')

    try {
      const formData = new FormData()

      formData.append('image', selectedFile)
      formData.append('claim', claim)

      const response = await fetch(
        'http://localhost:5000/api/images/upload',
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Analysis failed.')
      }

      setResults(data)
      setMessage('Investigation completed!')

setTimeout(() => {
  resultsRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}, 150)

// Start Google Lens search separately
setLensLoading(true)
setLensResults(null)

const lensFormData = new FormData()
lensFormData.append('image', selectedFile)

fetch('http://localhost:5000/api/images/reverse-search', {
    method: 'POST',
    body: lensFormData
})
    .then(async (response) => {
        const lensData = await response.json()

        if (!response.ok || !lensData.success) {
            throw new Error(lensData.message || 'Reverse search failed.')
        }

        setLensResults(lensData.googleLens)
    })
    .catch((error) => {
        console.error('Google Lens error:', error)
        setLensResults({
            success: false,
            error: error.message
        })
    })
    .finally(() => {
        setLensLoading(false)
    })
      console.log('VERITY investigation:', data)

    } catch (error) {
      setMessage(error.message)

    } finally {
      setLoading(false)
    }
  }

  const analysis = results?.aiDetection?.analysis
  const gemini = analysis?.gemini_claim_analysis

// VERITY FINAL VERDICTS

const aiPrediction = analysis?.ai_detection?.prediction

const imageVerdict = !analysis?.ai_detection?.success
  ? {
      label: 'Unable to determine',
      description: 'Our AI detection system could not analyze this image.',
      status: 'uncertain'
    }
  : aiPrediction === 'real'
  ? {
      label: 'Likely Real',
      description: 'The AI detector classified this image as real. This is not proof of authenticity.',
      status: 'real'
    }
  : aiPrediction === 'ai_generated'
  ? {
      label: 'Likely AI-Generated',
      description: 'The AI detector identified signs associated with AI-generated images.',
      status: 'ai'
    }
  : {
      label: 'Uncertain',
      description: 'The detector returned an inconclusive result.',
      status: 'uncertain'
    }

const claimConsistency = gemini?.analysis?.claim_consistency
  ?.toLowerCase()
  .trim()

const informationVerdict = !gemini?.success
  ? {
      label: 'Not Verified',
      description: 'There is not enough information to assess the claim.',
      status: 'uncertain'
    }
  : claimConsistency === 'consistent'
  ? {
      label: 'Matches the Image',
      description: 'The claim appears consistent with the visual content. Its factual accuracy has not been independently established.',
      status: 'real'
    }
  : claimConsistency === 'inconsistent'
  ? {
      label: 'Does Not Match',
      description: 'The claim appears inconsistent with what is visible in the image.',
      status: 'ai'
    }
  : {
      label: 'Unclear',
      description: 'The available visual evidence is insufficient to assess the claim.',
      status: 'uncertain'
    }

  return (
    <div className="app">

      <nav className="navbar">
        <a href="#" className="logo">
          verity<span>.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#verify">Verify Image</a>
          <a href="#about">About</a>
        </div>

        <a href="#verify" className="nav-button">
          Start investigating
        </a>
      </nav>

      <main id="home">

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="eyebrow">
              <span className="live-dot"></span>
              YOUR IMAGE. OUR INVESTIGATION.
            </div>

            <h1>
              Look closer.
              <br />
              Know the <span>truth.</span>
            </h1>

            <p className="hero-description">
              Not everything you see online is what it seems.
              Investigate images, explore evidence and discover
              the truth behind what you see.
            </p>

            <a href="#verify" className="main-button">
              Verify an image
            </a>

            <p className="small-note">
              Simple. Evidence-based. Transparent.
            </p>

          </div>

          <div className="hero-visual">

            <img
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85"
              alt="Camera representing digital photography"
              className="hero-image"
            />

            <div className="floating-card">
              <span className="floating-icon">✦</span>
              <div>
                <strong>Look beyond the image.</strong>
                <p>Discover what the evidence says.</p>
              </div>
            </div>

            <div className="image-label">
              IMAGE INVESTIGATION
            </div>

          </div>

        </section>

        {/* UPLOAD SECTION */}

        <section className="verify-section" id="verify">

          <div className="section-heading">
            <span className="section-tag">01 / GET STARTED</span>
            <h2>Let's investigate.</h2>
            <p>
              Upload an image and let the investigation begin.
            </p>
          </div>

          <form className="upload-card" onSubmit={handleVerify}>

            <label className="upload-area">

              {image ? (
                <img
                  src={image}
                  alt="Selected image preview"
                  className="preview-image"
                />
              ) : (
                <>
                  <div className="upload-icon">↑</div>
                  <h3>Drop your image here</h3>
                  <p>or click to browse your files</p>
                  <span className="file-types">
                    JPG · PNG · WEBP
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

            </label>

            {fileName && (
              <p className="file-name">
                Selected: {fileName}
              </p>
            )}

            <div className="claim-section">

              <label htmlFor="claim">
                What does this image claim to show?
                <span> (Optional)</span>
              </label>

              <textarea
                id="claim"
                placeholder="Describe the image or the claim you want us to investigate..."
                value={claim}
                onChange={(event) => setClaim(event.target.value)}
              />

            </div>

            <button
              type="submit"
              className="verify-button"
              disabled={loading}
            >
              {loading ? 'Investigating...' : 'Verify Image'}
            </button>

            {message && (
              <p className="status-message" role="status">
                {message}
              </p>
            )}

            <p className="privacy-note">
              Your image is processed by VERITY's analysis services.
              Avoid uploading private or sensitive images.
            </p>

          </form>

        </section>

        {/* RESULTS DASHBOARD */}

        {results && (

          <section className="results-section" id="results"   ref={resultsRef}>

            <div className="section-heading">
              <span className="section-tag">
                02 / INVESTIGATION REPORT
              </span>

              <h2>Here's what we found.</h2>

              <p>
                Results from VERITY's image analysis systems.
              </p>

              {/* FINAL VERIFICATION VERDICT */}

<div className="final-verdict-section">

  <div className="verdict-heading">
    <span>VERITY'S CONCLUSION</span>
    <h3>What should you know?</h3>
    <p>
      Here's a simple explanation of what our investigation found.
    </p>
  </div>

  <div className="verdict-grid">

    {/* IMAGE AUTHENTICITY */}

    <div className={`verdict-card ${imageVerdict.status}`}>

      <span className="verdict-category">
        IMAGE AUTHENTICITY
      </span>

      <div className="verdict-icon">
        {imageVerdict.status === 'real'
          ? '✓'
          : imageVerdict.status === 'ai'
          ? '!'
          : '?'}
      </div>

      <h2>{imageVerdict.label}</h2>

      <p>{imageVerdict.description}</p>

    </div>

    {/* INFORMATION ACCURACY */}

    <div className={`verdict-card ${informationVerdict.status}`}>

      <span className="verdict-category">
        CLAIM ASSESSMENT
      </span>

      <div className="verdict-icon">
        {informationVerdict.status === 'real'
          ? '✓'
          : informationVerdict.status === 'ai'
          ? '!'
          : '?'}
      </div>

      <h2>{informationVerdict.label}</h2>

      <p>{informationVerdict.description}</p>

    </div>

  </div>

  <div className="verdict-note">
    <strong>Important:</strong> These are automated investigative
    assessments, not definitive proof. A claim matching an image
    does not necessarily mean the claim is factually true.
  </div>

</div>

            </div>

            {/* GEMINI RESULTS */}

            <div className="result-card">

              <h3>✦ Visual & Claim Analysis</h3>

              {gemini?.success ? (

                <>
                  <div className="consistency-result">
  <span>Does the claim match the image?</span>

  <strong>
    {claimConsistency === 'consistent'
      ? 'Yes, it appears to match'
      : claimConsistency === 'inconsistent'
      ? 'No, it appears different'
      : 'Cannot determine'}
  </strong>
</div>

                  <h4>Visual description</h4>

                  <p>
                    {gemini.analysis?.visual_description}
                  </p>

                  <h4>Supporting observations</h4>

                  {gemini.analysis?.supporting_observations?.length ? (
                    <ul>
                      {gemini.analysis.supporting_observations.map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>No supporting observations identified.</p>
                  )}

                  <h4>Contradicting observations</h4>

                  {gemini.analysis?.contradicting_observations?.length ? (
                    <ul>
                      {gemini.analysis.contradicting_observations.map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>No contradicting observations identified.</p>
                  )}

                  <h4>What cannot be determined</h4>

                  {gemini.analysis?.cannot_determine?.length ? (
                    <ul>
                      {gemini.analysis.cannot_determine.map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>Nothing additional reported.</p>
                  )}

                  <h4>Conclusion</h4>

                  <p>{gemini.analysis?.conclusion}</p>

                  <p className="result-notice">
                    {gemini.notice}
                  </p>
                </>

              ) : (

                <p>
                  {gemini?.error ||
                    'No claim analysis available. Enter a claim to use this feature.'}
                </p>

              )}

            </div>

            {/* TECHNICAL RESULTS */}

            <div className="result-grid">

<div className="result-card ai-result-card">
    <h3>AI Image Detection</h3>

    {analysis?.ai_detection?.success ? (
        <>
            <div className="ai-prediction">
                <span className="result-label">
                    Detector assessment
                </span>

                <h2>
                    {analysis.ai_detection.prediction === "real"
                        ? "Classified as Real"
                        : "Classified as AI-Generated"}
                </h2>
            </div>

            <div className="score-container">
                <div className="score-row">
                    <span>Real image score</span>
                    <strong>
                        {analysis.ai_detection.scores?.real ?? 0}%
                    </strong>
                </div>

                <div className="score-bar">
                    <div
                        className="score-fill real-fill"
                        style={{
                            width: `${analysis.ai_detection.scores?.real ?? 0}%`
                        }}
                    />
                </div>

                <div className="score-row">
                    <span>AI-generated score</span>
                    <strong>
                        {analysis.ai_detection.scores?.ai_generated ?? 0}%
                    </strong>
                </div>

                <div className="score-bar">
                    <div
                        className="score-fill ai-fill"
                        style={{
                            width: `${analysis.ai_detection.scores?.ai_generated ?? 0}%`
                        }}
                    />
                </div>
            </div>

            <p className="result-notice">
                These scores represent the detector's output,
                not guaranteed probabilities. AI detection can
                make mistakes and cannot prove authenticity.
            </p>
        </>
    ) : (
        <p>AI detection results are unavailable.</p>
    )}
</div>

             <div className="result-card">
    <h3>Error Level Analysis (ELA)</h3>

    {analysis?.ela_analysis?.success ? (
        <>
            <div className="ai-prediction">
                <span className="result-label">
                    Analysis status
                </span>

                <h2>Analysis completed</h2>
            </div>

            <p>
                ELA examines differences in image compression.
                These differences can sometimes help investigators
                identify areas that deserve closer inspection.
            </p>

            <p className="result-notice">
                ELA does not automatically prove that an image
                has been edited. Results require visual
                interpretation and can produce misleading signals.
            </p>
        </>
    ) : (
        <p>ELA analysis is unavailable.</p>
    )}
</div>


<div className="result-card">
    <h3>Copy-Move Analysis</h3>

    {analysis?.copy_move_analysis?.success ? (
        <>
            <div className="ai-prediction">
                <span className="result-label">
                    Analysis status
                </span>

                <h2>
                    {analysis.copy_move_analysis.matches === 0
                        ? "No matching regions detected"
                        : "Matching patterns detected"}
                </h2>
            </div>

            <div className="score-container">
                <div className="score-row">
                    <span>Matching feature pairs</span>
                    <strong>
                        {analysis.copy_move_analysis.matches ?? "N/A"}
                    </strong>
                </div>

                <div className="score-row">
                    <span>Image keypoints examined</span>
                    <strong>
                        {analysis.copy_move_analysis.keypoints ?? "N/A"}
                    </strong>
                </div>
            </div>

            <p className="result-notice">
                This is an experimental check for similar
                patterns within an image. It may miss edits or
                produce misleading results. Zero matches does
                not prove that an image is authentic.
            </p>
        </>
    ) : (
        <p>Copy-Move Analysis is unavailable.</p>
    )}
</div>

<div className="result-card">
    <h3>Image Information</h3>

    <div className="score-container">

        <div className="score-row">
            <span>File name</span>
            <strong>{results?.metadata?.filename || "Unknown"}</strong>
        </div>

        <div className="score-row">
            <span>Image format</span>
            <strong>{results?.metadata?.format || "Unknown"}</strong>
        </div>

        <div className="score-row">
            <span>Dimensions</span>
            <strong>
                {results?.metadata?.width && results?.metadata?.height
                    ? `${results.metadata.width} × ${results.metadata.height}`
                    : "Unknown"}
            </strong>
        </div>

        <div className="score-row">
            <span>File size</span>
            <strong>
                {results?.metadata?.size_bytes
                    ? `${(results.metadata.size_bytes / 1024).toFixed(1)} KB`
                    : "Unknown"}
            </strong>
        </div>

    </div>

    <p className="result-notice">
        This information describes the uploaded file.
        It does not establish when or where the image was created.
    </p>
</div>

            </div>

            {/* GOOGLE LENS RESULTS */}

<div className="result-card lens-results-card">

    <h3>⌕ Reverse Image Search</h3>

    <p>
        Searching the web for visually similar images and possible sources.
    </p>

    {lensLoading && (
        <div className="lens-status">
            Searching with Google Lens...
        </div>
    )}

    {!lensLoading && lensResults?.success && (

        <>

            {lensResults.matches?.length > 0 ? (

                <div className="lens-match-grid">

                    {lensResults.matches.map((match, index) => (

                        <div className="lens-match-card" key={index}>

                            <img
                                src={match.thumbnail}
                                alt={match.title || 'Visual match'}
                            />

                            <div className="lens-match-info">

                                <span className="match-type">
                                    {match.match_type}
                                </span>

                                <h4>
                                    {match.title || 'Untitled result'}
                                </h4>

                                <p>
                                    Source: {match.source || 'Unknown'}
                                </p>

                                <strong>
                                    {match.similarity}% similarity
                                </strong>

                                <a
                                    href={match.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Visit original webpage ↗
                                </a>

                            </div>

                        </div>

                    ))}

                </div>

            ) : (

                <p>
                    No results passed VERITY's 85% similarity threshold.
                </p>

            )}

        </>

    )}

    {!lensLoading && lensResults?.error && (

        <p className="result-notice">
            Reverse image search failed: {lensResults.error}
        </p>

    )}

    {!lensLoading && !lensResults && (

        <p>Reverse image search has not returned results yet.</p>

    )}

    <p className="result-notice">
        Similarity percentages are experimental perceptual-hash
        comparisons of thumbnails. They do not establish that
        two images are identical or that an image is authentic.
    </p>

</div>

            <p className="final-disclaimer">
              VERITY provides investigative signals, not definitive
              proof. AI predictions and image-analysis techniques
              can produce incorrect results. Independent verification
              is necessary.
            </p>

          </section>

        )}

        {/* ABOUT */}

        <section className="about-section" id="about">

          <div className="section-heading">
            <span className="section-tag">03 / WHAT WE DO</span>
            <h2>Look beyond what you see.</h2>
          </div>

          <div className="feature-grid">

            <div className="feature-card">
              <div className="feature-icon">⌕</div>
              <h3>Image authenticity</h3>
              <p>Investigate signs of image manipulation.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">◈</div>
              <h3>Original context</h3>
              <p>
                Explore where an image came from and how it is presented.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">◎</div>
              <h3>Evidence & sources</h3>
              <p>Understand the evidence behind every conclusion.</p>
            </div>

          </div>

        </section>

      </main>

      <footer>
        <a href="#" className="logo">
          verity<span>.</span>
        </a>

        <p>Look closer. Know the truth.</p>

        <span>© 2026 VERITY</span>
      </footer>

    </div>
  )
}

export default App
