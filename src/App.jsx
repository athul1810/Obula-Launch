import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">Obula</h1>
      <p className="text-xl text-white/70 mb-8">AI Clip Generator</p>
      <Link to="/upload" className="px-6 py-3 bg-[#C9A962] text-black font-semibold rounded-xl">
        Get Started
      </Link>
    </div>
  );
}

function Upload() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Upload</h1>
      <Link to="/" className="text-[#C9A962]">← Back</Link>
    </div>
  );
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#09090B]" />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}
