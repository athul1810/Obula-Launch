import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Landing() {
  return (
    <div style={{minHeight: '100vh', background: '#09090B', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
      <h1 style={{fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem'}}>Obula</h1>
      <p style={{fontSize: '1.25rem', opacity: 0.7, marginBottom: '2rem'}}>AI Clip Generator</p>
      <Link to="/upload" style={{padding: '0.75rem 1.5rem', background: '#C9A962', color: 'black', fontWeight: 600, borderRadius: '0.75rem', textDecoration: 'none'}}>
        Get Started
      </Link>
    </div>
  );
}

function Upload() {
  return (
    <div style={{minHeight: '100vh', background: '#09090B', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem'}}>
      <h1 style={{fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem'}}>Upload</h1>
      <Link to="/" style={{color: '#C9A962', textDecoration: 'none'}}>← Back</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}
