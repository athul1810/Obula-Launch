import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import LandingNav from '../components/LandingNav.jsx';
import { getUploadedVideoBlob, startJob } from '../api/upload.js';

const EDITOR_SESSION_KEY = 'obula_editor_session';
const LAST_JOB_ID_KEY = 'obula_last_job_id';

const CAPTION_PRESETS = [
  { name: 'Classic', color: '#ffffff' },
  { name: 'Vibrant', color: '#fbbf24' },
  { name: 'Ocean', color: '#22d3ee' },
  { name: 'Sunset', color: '#fb923c' },
  { name: 'Forest', color: '#4ade80' },
  { name: 'Neon', color: '#a78bfa' },
  { name: 'Coral', color: '#f472b6' },
  { name: 'Mint', color: '#34d399' },
];

function toHex(c) {
  if (!c || (typeof c === 'string' && c.startsWith('#'))) return c || '#ffffff';
  const names = { white: '#ffffff', yellow: '#eab308', black: '#000000', transparent: 'transparent' };
  return names[c?.toLowerCase()] || c;
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(EDITOR_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    sessionStorage.setItem(EDITOR_SESSION_KEY, JSON.stringify(data));
  } catch {}
}

export default function Editor() {
  const location = useLocation();
  const blobUrlRef = useRef(null);

  const { videoFile: stateVideoFile, videoId: stateVideoId, editorSettings: stateEditorSettings } = location.state ?? {};
  const stored = loadSession();

  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoFileName, setVideoFileName] = useState(stateVideoFile?.name ?? stored?.videoFileName ?? null);
  const [effectiveVideoId, setEffectiveVideoId] = useState(stateVideoId ?? stored?.videoId ?? null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const [model, setModel] = useState(stateEditorSettings?.model ?? stored?.model ?? 'obula-pro');
  const [userPrompt, setUserPrompt] = useState(stateEditorSettings?.userPrompt ?? stored?.userPrompt ?? '');
  const [duration, setDuration] = useState(stateEditorSettings?.duration ?? stored?.duration ?? '15');
  const [style, setStyle] = useState(stateEditorSettings?.style ?? stored?.style ?? 'auto');
  const [captionPosition, setCaptionPosition] = useState(stateEditorSettings?.captionPosition ?? stored?.captionPosition ?? 'auto');
  const [behindPerson, setBehindPerson] = useState(stateEditorSettings?.behindPerson ?? stored?.behindPerson ?? true);
  const [captionPreset, setCaptionPreset] = useState(stateEditorSettings?.captionPreset ?? stored?.captionPreset ?? 'Classic');
  const [fontSize, setFontSize] = useState(stateEditorSettings?.fontSize ?? stored?.fontSize ?? 58);
  const [textColor, setTextColor] = useState(stateEditorSettings?.textColor ?? stored?.textColor ?? '#ffffff');
  const [sampleText, setSampleText] = useState(stateEditorSettings?.sampleText ?? stored?.sampleText ?? 'Your caption will look like this');
  const [enableBroll, setEnableBroll] = useState(stateEditorSettings?.enableBroll ?? stored?.enableBroll ?? true);

  const displayColor = textColor;

  // Persist to sessionStorage whenever settings change (always save, even without video)
  const editorData = {
    videoId: effectiveVideoId,
    videoFileName,
    model, userPrompt, duration, style, captionPosition, behindPerson,
    captionPreset, fontSize, textColor, sampleText, enableBroll,
  };
  useEffect(() => {
    saveSession(editorData);
  }, [effectiveVideoId, videoFileName, model, userPrompt, duration, style, captionPosition, behindPerson, captionPreset, fontSize, textColor, sampleText, enableBroll]);

  // Video preview: File from state, or fetch by videoId
  useEffect(() => {
    let cancelled = false;
    if (stateVideoFile instanceof File) {
      const url = URL.createObjectURL(stateVideoFile);
      blobUrlRef.current = url;
      setVideoPreviewUrl(url);
      setVideoFileName(stateVideoFile.name);
      if (stateVideoId) setEffectiveVideoId(stateVideoId);
      return () => {
        cancelled = true;
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
      };
    }
    if (effectiveVideoId) {
      getUploadedVideoBlob(effectiveVideoId)
        .then((blob) => {
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setVideoPreviewUrl(url);
        })
        .catch(() => {
          if (!cancelled) setVideoPreviewUrl(null);
        });
      return () => {
        cancelled = true;
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }
    setVideoPreviewUrl(null);
    return () => {};
  }, [stateVideoFile, stateVideoId, effectiveVideoId]);

  const handleGenerate = async () => {
    if (!effectiveVideoId) {
      setError('No video. Upload on the Upload page first.');
      return;
    }
    setError(null);
    setGenerating(true);
    const payload = {
      video_id: effectiveVideoId,
      user_prompt: userPrompt || undefined,
      caption_style: { text_color: toHex(textColor), bg_color: 'transparent', font_size: fontSize, border_width: 4 },
      caption_position: captionPosition,
      behind_person: behindPerson,
      duration_seconds: Number(duration) || undefined,
      aspect_ratios: ['instagram-reels'],
      model,
      style,
      enable_broll: enableBroll,
      export_instagram: true,
      enable_noise_isolation: false,
      enable_red_hook: true,
      color_grade_lut: undefined,
      color_grade_intensity: 0.8,
      aspect_ratio: undefined,
      rounded_corners: 'none',
    };
    try {
      const { job_id } = await startJob(payload);
      sessionStorage.setItem(LAST_JOB_ID_KEY, job_id);
      window.location.href = `/upload/processing/${job_id}`;
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const msg = err?.message === 'Network Error'
        ? "Couldn't reach the server."
        : (typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0] : 'Failed to start processing.');
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const editorStateForUpload = {
    videoFile: stateVideoFile,
    videoId: effectiveVideoId,
    editorSettings: editorData,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-body">
      <LandingNav />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Panel - Settings */}
          <div className="flex-1 max-w-xl space-y-8">
            {/* A) Header */}
            <m.div initial={false} animate={{ opacity: 1 }}>
              <h1 className="text-3xl font-bold text-primary font-display">AI Clip Generator</h1>
              <p className="text-white/50 text-sm mt-1">Edit settings • Generate</p>
            </m.div>

            {/* B) Model Selector */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-2.5 rounded-xl text-white text-sm focus:border-primary/50 outline-none transition-colors appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: 20 }}
              >
                <option value="obula-pro" className="bg-zinc-900">Obula Pro</option>
                <option value="obula-fast" className="bg-zinc-900">Obula Fast</option>
              </select>
            </m.div>

            {/* C) Duration */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Clip duration (seconds)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-2.5 rounded-xl text-white text-sm focus:border-primary/50 outline-none"
              />
            </m.div>

            {/* D) Script / Captions Input */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Your script → captions</label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                maxLength={800}
                placeholder="Paste your script. These exact words become your captions. Leave empty to transcribe from audio."
                className="w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-3 rounded-xl text-white placeholder-white/25 resize-none min-h-[100px] text-sm focus:border-primary/50 outline-none transition-colors"
                rows={4}
              />
              <span className="text-white/35 text-xs tabular-nums">{userPrompt.length}/800</span>
            </m.div>

            {/* E) Style Settings */}
            <m.div initial={false} animate={{ opacity: 1 }}  className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-2.5 rounded-xl text-white text-sm focus:border-primary/50 outline-none transition-colors"
                >
                  <option value="auto" className="bg-zinc-900">Auto</option>
                  <option value="vibrant" className="bg-zinc-900">Vibrant</option>
                  <option value="cinematic" className="bg-zinc-900">Cinematic</option>
                  <option value="minimal" className="bg-zinc-900">Minimal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Caption position</label>
                <select
                  value={captionPosition}
                  onChange={(e) => setCaptionPosition(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-2.5 rounded-xl text-white text-sm focus:border-primary/50 outline-none transition-colors"
                >
                  <option value="auto" className="bg-zinc-900">Auto (smart from video)</option>
                  <option value="left" className="bg-zinc-900">Left</option>
                  <option value="center" className="bg-zinc-900">Center</option>
                  <option value="right" className="bg-zinc-900">Right</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Text behind person</p>
                  <p className="text-white/40 text-xs mt-0.5">Weave captions behind you for a premium viral look</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={behindPerson}
                  onClick={() => setBehindPerson((v) => !v)}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    behindPerson ? 'bg-primary' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform translate-y-0.5 ${
                      behindPerson ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </m.div>

            {/* F) Caption Style Pills */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <label className="block text-xs font-medium text-white/50 mb-3 uppercase tracking-widest">Caption style</label>
              <div className="flex flex-wrap gap-2">
                {CAPTION_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => { setCaptionPreset(p.name); setTextColor(p.color); }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      captionPreset === p.name
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-white/[0.05] text-white/70 border border-white/[0.1] hover:border-white/[0.2] hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </m.div>

            {/* G) Font Controls */}
            <m.div initial={false} animate={{ opacity: 1 }}  className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Font size (30–80)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={30}
                    max={80}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-white font-bold w-10 text-right tabular-nums">{fontSize}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Text color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={toHex(displayColor)}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-2 border-white/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={toHex(displayColor)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.startsWith('#')) setTextColor(v);
                    }}
                    className="flex-1 bg-[#1a1a1a] border border-white/[0.1] px-3 py-2 rounded-lg text-white text-sm focus:border-primary/50 outline-none"
                  />
                </div>
              </div>
            </m.div>

            {/* H) Sample Caption Preview */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-widest">Sample caption</label>
              <div
                className="rounded-xl border border-white/[0.1] bg-[#1a1a1a] p-6 min-h-[120px] flex flex-col justify-end"
                style={{ backgroundColor: 'rgba(30,30,35,0.95)' }}
              >
                <p
                  className="font-bold text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                  style={{
                    color: toHex(displayColor),
                    fontSize: Math.min(Math.max(fontSize * 0.4, 14), 32),
                    WebkitTextStroke: '2px rgba(0,0,0,0.9)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {sampleText}
                </p>
                <input
                  type="text"
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value.slice(0, 50))}
                  placeholder="Type to preview…"
                  className="mt-4 w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:border-primary/50 outline-none rounded-lg"
                />
              </div>
            </m.div>

            {/* I) B-Roll Toggle */}
            <m.div initial={false} animate={{ opacity: 1 }} >
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">B-Roll</p>
                  <p className="text-white/40 text-xs mt-0.5">Add cinematic B-roll at key moments (from transcript)</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableBroll}
                  onClick={() => setEnableBroll((v) => !v)}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    enableBroll ? 'bg-primary' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow transition-transform translate-y-0.5 ${
                      enableBroll ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </m.div>

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || !effectiveVideoId}
                className="inline-flex px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Starting…' : 'Generate clip'}
              </button>
              <Link
                to="/upload"
                state={editorStateForUpload}
                className="inline-flex px-6 py-3 border border-white/20 text-white/80 hover:bg-white/5 rounded-xl font-medium transition-colors"
              >
                Back to Upload
              </Link>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {/* Right Panel - Video + Caption Preview */}
          <div className="lg:w-[400px] shrink-0">
            <m.div initial={false} animate={{ opacity: 1 }} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sticky top-28">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Video + Caption Preview</p>
              <div className="aspect-[9/16] rounded-xl bg-black border border-white/[0.08] flex items-center justify-center overflow-hidden relative">
                {videoPreviewUrl ? (
                  <>
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {/* Caption overlay on video */}
                    <div
                      className="absolute inset-0 flex items-end pointer-events-none px-4 pb-6"
                      style={{
                        justifyContent:
                          captionPosition === 'left' ? 'flex-start' :
                          captionPosition === 'right' ? 'flex-end' :
                          'center',
                      }}
                    >
                      <p
                        className={`font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-[90%] px-2 ${
                          captionPosition === 'left' ? 'text-left' :
                          captionPosition === 'right' ? 'text-right' : 'text-center'
                        }`}
                        style={{
                          color: toHex(displayColor),
                          fontSize: Math.min(Math.max(fontSize * 0.5, 16), 36),
                          WebkitTextStroke: '2px rgba(0,0,0,0.9)',
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {sampleText}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center justify-center gap-4">
                    <p className="text-white/50 text-sm font-medium">No video yet</p>
                    <p className="text-white/35 text-xs max-w-[240px]">Upload a video on the Upload page first, then open Advanced settings to edit here.</p>
                    <Link
                      to="/upload"
                      className="mt-2 px-5 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl text-sm transition-colors"
                    >
                      Go to Upload →
                    </Link>
                  </div>
                )}
              </div>
              {videoFileName && (
                <p className="text-white/40 text-xs mt-3 truncate" title={videoFileName}>
                  {videoFileName}
                </p>
              )}
            </m.div>
          </div>
        </div>
      </main>
    </div>
  );
}
