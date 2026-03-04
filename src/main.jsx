import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

try {
  const root = document.getElementById('root')
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch(e) {
  document.body.innerHTML = '<h1 style="color:red;font-size:20px;padding:20px;">Error: ' + e.message + '<br>' + e.stack + '</h1>'
}
