import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>Prellu</h1>
        <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>AI Communication Coach</p>
        <p style={{ marginTop: '2rem', opacity: 0.7 }}>Coming soon...</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          style={{
            marginTop: '2rem',
            padding: '12px 24px',
            fontSize: '1rem',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Count: {count}
        </button>
      </div>
    </div>
  )
}
