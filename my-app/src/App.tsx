import { useState } from 'react'
import axios from 'axios'
import './App.css'

interface SpotifyData {
  name: string
  artist: string
  album_cover: string | null
  spotify_url: string
  preview_url: string | null
}

interface Recommendation {
  song: string
  genre: string
  similarity_score: number
  spotify: SpotifyData | null
}

function App() {
  const [query, setQuery] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setRecommendations([])

    try {
      const res = await axios.get('http://127.0.0.1:5000/recommend', {
        params: { song: query },
      })
      setRecommendations(res.data.recommendations)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Song not found!')
      } else {
        setError('Song not found!')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">Song Recommender</h1>
        <p className="subtitle">Type a song you love and discover similar ones</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="e.g. Blinding Lights..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          {loading ? '...' : 'Find'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <span>Finding songs...</span>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendations-container">
          <p className="recommendations-label">Recommended for you</p>
          {recommendations.map((rec, index) => (
            <div key={`${rec.song}-${index}`} className="recommendation-card">
              <div className="card-content">
                {rec.spotify?.album_cover ? (
                  <img
                    src={rec.spotify.album_cover}
                    alt={rec.spotify.name || rec.song}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className="card-icon">{index + 1}</div>
                )}
                <div className="card-info">
                  <h3>{rec.spotify?.name || rec.song}</h3>
                  <p>{rec.spotify?.artist || rec.genre}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {rec.spotify?.spotify_url && (
                  <a
                    href={rec.spotify.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#1DB954',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Open
                  </a>
                )}
                <div className="card-score">
                  <div className="score-value">{Math.round(rec.similarity_score * 100)}%</div>
                  <div className="score-label">match</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
