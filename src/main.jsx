import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

console.log('main.jsx loading')

const root = document.getElementById('root')
console.log('Root element:', root)

try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('React rendered successfully')
} catch(e) {
  console.error('React error:', e)
  root.innerHTML = '<h1 style="color:red">Error: '+e.message+'</h1>'
}
