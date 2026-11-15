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

    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image size must be below 10 MB.')
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
    setLensResults(null)
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

      // Google Lens reverse image search

      setLensLoading(true)

      const lensFormData = new FormData()
      lensFormData.append('image', selectedFile)

      fetch(
        'http://localhost:5000/api/images/reverse-search',
        {
          method: 'POST',
          body: lensFormData
        }
      )
        .then(async (response) => {
          const lensData = await response.json()

          if (!response.ok || !lensData.success) {
            throw new Error(
              lensData.message || 'Reverse search failed.'
            )
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

  // --------------------------------
  // EXTRACT BACKEND RESULTS
  // --------------------------------

  const analysis = results?.aiDetection?.analysis

  const aiAssessment = analysis?.ai_detection

  const visualDescription = analysis?.visual_description

  const gemini = analysis?.gemini_claim_analysis

  const claimAnalysis = gemini?.analysis

  // --------------------------------
  // AI IMAGE ASSESSMENT
  // --------------------------------

  const aiVerdict = String(
    aiAssessment?.verdict || 'uncertain'
  ).toLowerCase()

  const imageVerdict =
    aiVerdict === 'likely_camera_captured' ||
    aiVerdict === 'likely_real' ||
    aiVerdict === 'real'
      ? {
          label: 'Likely Camera-Captured',
          description:
            'Gemini identified visual characteristics that may be consistent with a camera-captured image.',
          status: 'real'
        }
      : aiVerdict === 'likely_ai_generated' ||
        aiVerdict === 'ai_generated'
      ? {
          label: 'Possible AI Generation',
          description:
            'Gemini identified visual characteristics that may be associated with AI-generated imagery.',
          status: 'ai'
        }
      : {
          label: 'Uncertain',
          description:
            'Gemini could not confidently assess whether this image was AI-generated or camera-captured.',
          status: 'uncertain'
        }

  // --------------------------------
  // CLAIM ASSESSMENT
  // --------------------------------

  const claimConsistency = String(
    claimAnalysis?.consistency || ''
  ).toLowerCase().trim()

  const informationVerdict = !claim.trim()
    ? {
        label: 'No Claim Provided',
        description:
          'You did not provide a specific claim to investigate.',
        status: 'uncertain'
      }
    : claimConsistency === 'consistent'
    ? {
        label: 'True',
        description:
          'The claim appears consistent with the visible content of the image. This does not independently establish its factual accuracy.',
        status: 'real'
      }
    : claimConsistency === 'inconsistent'
    ? {
        label: 'False',
        description:
          'The claim appears inconsistent with the visible content of the image.',
        status: 'ai'
      }
    : {
        label: 'Cannot Determine',
        description:
          'The available visual evidence is insufficient to assess this claim.',
        status: 'uncertain'
      }

  // --------------------------------
  // REUSABLE LIST COMPONENT
  // --------------------------------

  function ObservationList({ items, emptyMessage }) {
    if (!Array.isArray(items) || items.length === 0) {
      return <p>{emptyMessage}</p>
    }

    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <div className="app">

      {/* NAVBAR */}

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

            <span className="section-tag">
              01 / GET STARTED
            </span>

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
              <span>→</span>
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

          <section
            className="results-section"
            id="results"
            ref={resultsRef}
          >

            <div className="section-heading">

              <span className="section-tag">
                02 / INVESTIGATION REPORT
              </span>

              <h2>Here's what we found.</h2>

              <p>
                Results from VERITY's image investigation systems.
              </p>

            </div>

            {/* FINAL VERDICT */}

            <div className="final-verdict-section">

              <div className="verdict-heading">

                <span>VERITY'S CONCLUSION</span>

                <h3>What should you know?</h3>

                <p>
                  A summary of the findings from your investigation.
                </p>

              </div>

              <div className="verdict-grid">

                {/* IMAGE AUTHENTICITY */}

                <div className={`verdict-card ${imageVerdict.status}`}>

                  <span className="verdict-category">
                    AI IMAGE ASSESSMENT
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

                {/* CLAIM ASSESSMENT */}

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
                <strong>Important:</strong> Gemini's visual assessment
                cannot prove an image's origin. Claim consistency
                describes how a claim compares with visible content;
                it does not independently verify external facts.
              </div>

            </div>

            {/* IMAGE DESCRIPTION */}

            <div className="result-card description-card">

              <div className="card-eyebrow">
                GEMINI VISUAL ANALYSIS
              </div>

              <h3>✦ What's in this image?</h3>

              {visualDescription ? (
                <p>{visualDescription}</p>
              ) : (
                <p>
                  No visual description was returned.
                </p>
              )}

            </div>

            {/* AI IMAGE ASSESSMENT */}

            <div className="result-grid">

              <div className="result-card">

                <div className="card-eyebrow">
                  IMAGE ORIGIN
                </div>

                <h3>AI Image Assessment</h3>

                <div className={`assessment-badge ${imageVerdict.status}`}>
                  {imageVerdict.label}
                </div>

                <h4>Visual observations</h4>

                <ObservationList
                  items={aiAssessment?.observations}
                  emptyMessage="No specific visual observations were returned."
                />

                <h4>Limitations</h4>

                <ObservationList
                  items={aiAssessment?.limitations}
                  emptyMessage="No additional limitations were reported."
                />

                <p className="result-notice">
                  This is a visual assessment by Gemini, not a
                  forensic AI-image detector. Visual clues alone
                  cannot reliably establish image provenance.
                </p>

              </div>

              {/* CLAIM ANALYSIS */}

              <div className="result-card">

                <div className="card-eyebrow">
                  CLAIM INVESTIGATION
                </div>

                <h3>Claim Analysis</h3>

                {claim.trim() ? (

                  <>

                    <div className="consistency-result">

                      <span>Visual consistency</span>

                      <strong>
                        {informationVerdict.label}
                      </strong>

                    </div>

                    <h4>Submitted claim</h4>

                    <p className="claim-text">
                      {claimAnalysis?.claim || claim}
                    </p>

                    <h4>Supporting observations</h4>

                    <ObservationList
                      items={claimAnalysis?.supporting_observations}
                      emptyMessage="No supporting observations identified."
                    />

                    <h4>Contradicting observations</h4>

                    <ObservationList
                      items={claimAnalysis?.contradicting_observations}
                      emptyMessage="No contradicting observations identified."
                    />

                    <h4>What cannot be determined</h4>

                    <ObservationList
                      items={claimAnalysis?.cannot_determine}
                      emptyMessage="No additional uncertainties reported."
                    />

                    <h4>Conclusion</h4>

                    <p>
                      {claimAnalysis?.conclusion ||
                        'No conclusion was returned.'}
                    </p>

                  </>

                ) : (

                  <p>
                    No claim was provided. Add a claim when
                    uploading an image to investigate its
                    consistency with the visual content.
                  </p>

                )}

                <p className="result-notice">
                  A visually consistent claim is not necessarily
                  a factually accurate claim.
                </p>

              </div>

            </div>

            {/* GOOGLE LENS */}

            <div className="result-card lens-results-card">

              <div className="card-eyebrow">
                REVERSE IMAGE SEARCH
              </div>

              <h3>⌕ Explore Similar Images</h3>

              <p>
                Searching the web for visually similar images
                and possible sources.
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

                            {match.link && (

                              <a
                                href={match.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit original webpage ↗
                              </a>

                            )}

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

                <p>
                  Reverse image search has not returned results yet.
                </p>

              )}

              <p className="result-notice">
                Similarity percentages are experimental
                perceptual-hash comparisons of thumbnails.
                They do not prove that two images are identical
                or that an image is authentic.
              </p>

            </div>

            {/* DISCLAIMER */}

            <p className="final-disclaimer">
              VERITY provides investigative assessments, not
              definitive proof. AI predictions and visual
              comparisons can produce incorrect results.
              Independent verification is necessary.
            </p>

          </section>

        )}

        {/* ABOUT */}

        <section className="about-section" id="about">

          <div className="section-heading">

            <span className="section-tag">
              03 / WHAT WE DO
            </span>

            <h2>Look beyond what you see.</h2>

          </div>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">✦</div>

              <h3>AI Image Assessment</h3>

              <p>
                Explore visual characteristics that may be
                associated with AI-generated imagery.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">◈</div>

              <h3>Original Context</h3>

              <p>
                Explore where an image may have appeared online
                through reverse image search.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">◎</div>

              <h3>Evidence & Sources</h3>

              <p>
                Understand supporting observations,
                contradictions and limitations.
              </p>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}

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