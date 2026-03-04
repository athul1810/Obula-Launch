import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import LandingNav from '../components/LandingNav.jsx';
import { useMobile } from '../hooks/useMobile.js';
import PremiumUploadZone from '../components/PremiumUploadZone.jsx';
import DurationSlider from '../components/DurationSlider.jsx';
import { useVideoDuration } from '../hooks/useVideoDuration.js';
import { uploadVideo, startJob, getConfig, cancelJob, getUploadedVideoBlob } from '../api/upload.js';

const LANDING_FORM_KEY = 'obula_landing_form';
const LAST_JOB_ID_KEY = 'obula_last_job_id';
const EDITOR_SESSION_KEY = 'obula_editor_session';
const LAST_JOB_TIMESTAMP_KEY = 'obula_last_job_timestamp';
const LAST_UPLOADED_VIDEO_KEY = 'obula_last_uploaded_video'; // Stores {videoId, fileName, timestamp}

const FEATURES = [
  { id: 'captions', label: 'Captions', icon: '✍️' },
  { id: 'broll', label: 'B-Roll', icon: '🎬' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'export', label: 'Export', icon: '📤' },
];

export default function Upload() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const didProcessFileRef = useRef(false);
  const videoPreviewRef = useRef(null);
  const [step, setStep] = useState('upload');
  const [videoFile, setVideoFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [duration, setDuration] = useState('15');
  const [model, setModel] = useState('obula-pro');
  const [activeFeature, setActiveFeature] = useState('captions');
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [maxUploadMb, setMaxUploadMb] = useState(500);
  const [startingJob, setStartingJob] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // For "resume upload" feature

  useEffect(() => {
    getConfig().then((c) => setMaxUploadMb(c?.max_upload_mb ?? 500)).catch(() => {});
  }, []);

  // Check for active job on mount and redirect if found, otherwise check for pending upload
  useEffect(() => {
    const lastJobId = localStorage.getItem(LAST_JOB_ID_KEY);
    const timestamp = localStorage.getItem(LAST_JOB_TIMESTAMP_KEY);
    
    if (lastJobId && timestamp) {
      const ageHours = (Date.now() - parseInt(timestamp, 10)) / (1000 * 60 * 60);
      // If job is less than 24 hours old, redirect to processing page
      if (ageHours < 24) {
        navigate(`/upload/processing/${lastJobId}`);
        return;
      }
      // Otherwise clean up stale job
      localStorage.removeItem(LAST_JOB_ID_KEY);
      localStorage.removeItem(LAST_JOB_TIMESTAMP_KEY);
    }
    
    // No active job - check for unprocessed video to offer "resume" option
    const storedVideo = localStorage.getItem(LAST_UPLOADED_VIDEO_KEY);
    if (storedVideo) {
      try {
        const { videoId: storedVideoId, fileName, timestamp } = JSON.parse(storedVideo);
        const videoAgeHours = (Date.now() - timestamp) / (1000 * 60 * 60);
        
        // Only offer resume if less than 24 hours old
        if (storedVideoId && videoAgeHours < 24) {
          setPendingUpload({ videoId: storedVideoId, fileName, timestamp });
        } else {
          // Clean up stale video
          localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
        }
      } catch {
        localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
      }
    }
  }, [navigate]);

  // Resume pending upload
  const handleResumeUpload = () => {
    if (pendingUpload) {
      setVideoId(pendingUpload.videoId);
      // Store filename in videoFile for display, but as null blob
      // The useEffect will detect videoId + step='options' and fetch the blob from server
      setVideoFile({ name: pendingUpload.fileName, _isResumed: true });
      setStep('options');
    }
  };

  // Discard pending upload
  const handleDiscardPending = () => {
    localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
    setPendingUpload(null);
  };

  // Nuclear option - clear all obula localStorage data
  const handleClearAllStorage = () => {
    localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
    localStorage.removeItem(LAST_JOB_ID_KEY);
    localStorage.removeItem(LAST_JOB_TIMESTAMP_KEY);
    localStorage.removeItem(LANDING_FORM_KEY);
    localStorage.removeItem(EDITOR_SESSION_KEY);
    setPendingUpload(null);
    setVideoFile(null);
    setVideoId(null);
    setStep('upload');
    window.location.reload();
  };

  const handleUploadSuccess = async (file) => {
    setError(null);
    setVideoFile(file);
    setUploading(true);
    try {
      const res = await uploadVideo(file);
      setVideoId(res.video_id);
      // Save to localStorage so we can restore on page reload
      localStorage.setItem(LAST_UPLOADED_VIDEO_KEY, JSON.stringify({
        videoId: res.video_id,
        fileName: file.name,
        timestamp: Date.now()
      }));
      setStep('options');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      let msg = 'Upload failed.';
      if (err?.message === 'Network Error') {
        msg = "Couldn't reach the server.";
      } else if (status === 401) {
        msg = 'Session expired. Please sign in again.';
      } else if (Array.isArray(detail)) {
        msg = detail[0] || msg;
      } else if (typeof detail === 'string') {
        msg = detail;
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Restore from Editor (Back to Upload) - ONLY via location.state, NOT from sessionStorage
  // sessionStorage is only used for passing data TO the Editor, not FROM it
  useEffect(() => {
    const state = location.state;
    if (state?.videoId || state?.editorSettings || state?.videoFile) {
      if (state.videoFile) setVideoFile(state.videoFile);
      if (state.videoId) setVideoId(state.videoId);
      const es = state.editorSettings;
      if (es) {
        if (es.userPrompt != null) setUserPrompt(es.userPrompt);
        if (es.duration != null) setDuration(String(es.duration));
        if (es.model != null) setModel(es.model);
      }
      setStep('options');
      // Clear the location state so it doesn't restore again on refresh
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(LANDING_FORM_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.prompt) setUserPrompt(data.prompt.slice(0, 800));
        if (data.duration) setDuration(String(data.duration));
        sessionStorage.removeItem(LANDING_FORM_KEY);
      }
      if (!didProcessFileRef.current && location.state?.file instanceof File) {
        didProcessFileRef.current = true;
        const file = location.state.file;
        window.history.replaceState({}, '', location.pathname);
        handleUploadSuccess(file);
      }
    } catch {
      sessionStorage.removeItem(LANDING_FORM_KEY);
    }
  }, [location.state?.file]);

  const handleProcess = async () => {
    if (!videoId) return;
    setError(null);
    setStartingJob(true);
    let editorStored = null;
    try {
      const raw = sessionStorage.getItem(EDITOR_SESSION_KEY);
      editorStored = raw ? JSON.parse(raw) : null;
    } catch {}
    const payload = {
      video_id: videoId,
      user_prompt: userPrompt || undefined,
      caption_style: editorStored ? { text_color: editorStored.textColor || '#ffffff', bg_color: 'transparent', font_size: editorStored.fontSize ?? 58, border_width: 4 } : { text_color: '#ffffff', bg_color: 'transparent', font_size: 58, border_width: 4 },
      caption_position: editorStored?.captionPosition ?? 'auto',
      behind_person: editorStored?.behindPerson ?? true,
      duration_seconds: Number(duration) || undefined,
      aspect_ratios: ['instagram-reels'],
      model,
      style: editorStored?.style ?? 'auto',
      enable_broll: editorStored?.enableBroll ?? true,
      export_instagram: true,
      enable_noise_isolation: noiseIsolation,
      enable_red_hook: redHook,
      color_grade_lut: colorGrade || undefined,
      color_grade_intensity: 0.8,
      aspect_ratio: aspectRatio || undefined,
      rounded_corners: roundedCorners,
    };
    try {
      const { job_id } = await startJob(payload);
      localStorage.setItem(LAST_JOB_ID_KEY, job_id);
      localStorage.setItem(LAST_JOB_TIMESTAMP_KEY, Date.now().toString());
      // Clear the uploaded video since we're now processing it
      localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
      navigate(`/upload/processing/${job_id}`);
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 402) {
        navigate('/pricing', { state: { noCredits: true } });
        return;
      }
      let msg = 'Failed to start processing.';
      if (err?.message === 'Network Error') msg = "Couldn't reach the server.";
      else if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail) && detail[0]) msg = detail[0];
      setError(msg);
    } finally {
      setStartingJob(false);
    }
  };

  const [colorGrade, setColorGrade] = useState('');
  const [noiseIsolation, setNoiseIsolation] = useState(false);
  const [redHook, setRedHook] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('');
  const [roundedCorners, setRoundedCorners] = useState('none');

  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const fetchedPreviewRef = useRef(null);
  useEffect(() => {
    // If it's a real File object (from direct upload), create URL from it
    if (videoFile && videoFile instanceof File) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    // If we have a videoId and are in options step, fetch from server
    // This handles both resumed uploads and Editor navigation
    if (videoId && step === 'options') {
      let cancelled = false;
      setVideoPreviewUrl(null); // Clear while loading
      getUploadedVideoBlob(videoId)
        .then((blob) => {
          if (!cancelled) {
            const url = URL.createObjectURL(blob);
            fetchedPreviewRef.current = url;
            setVideoPreviewUrl(url);
          }
        })
        .catch(() => { if (!cancelled) setVideoPreviewUrl(null); });
      return () => {
        cancelled = true;
        if (fetchedPreviewRef.current) {
          URL.revokeObjectURL(fetchedPreviewRef.current);
          fetchedPreviewRef.current = null;
        }
      };
    }
    setVideoPreviewUrl(null);
    return () => {};
  }, [videoFile, videoId, step]);

  const { duration: videoDuration } = useVideoDuration(step === 'options' ? videoPreviewUrl : null);
  const lastAutoSetVideoId = useRef(null);

  useEffect(() => {
    if (videoDuration != null && videoDuration > 0 && videoId && lastAutoSetVideoId.current !== videoId) {
      lastAutoSetVideoId.current = videoId;
      const sec = Math.round(videoDuration);
      const rounded = Math.min(300, Math.max(5, Math.round(sec / 5) * 5));
      setDuration(String(rounded));
    }
  }, [videoDuration, videoId]);

  const maxDurationVal = videoDuration ? Math.min(300, Math.ceil(videoDuration)) : 120;

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoId(null);
    setVideoPreviewUrl(null);
    setStep('upload');
    setError(null);
    // Clear stored unprocessed video
    localStorage.removeItem(LAST_UPLOADED_VIDEO_KEY);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-body">
      <LandingNav />

      <main className={`pt-20 md:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto ${isMobile ? 'pb-24' : ''}`}>
        {/* Page header */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={isMobile ? 'mb-6' : 'mb-10'}
        >
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-display tracking-tight">
            Create your clip
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Upload your video. Our AI will find the best moments and add professional captions.
          </p>
        </m.div>

        {/* A) Video Upload Area */}
        {step === 'upload' && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl backdrop-blur-xl border border-white/[0.08] bg-white/[0.03] mb-6 md:mb-8 ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}
          >
            <PremiumUploadZone onUploadSuccess={handleUploadSuccess} disabled={uploading} maxUploadMb={maxUploadMb} compact={isMobile} />
            
            {/* Resume pending upload card */}
            {pendingUpload && !uploading && (
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 md:mt-6 p-4 rounded-xl border border-primary/30 bg-primary/5 ${isMobile ? 'rounded-xl' : ''}`}
              >
                <div className={`flex items-center gap-3 ${isMobile ? 'flex-col items-stretch sm:flex-row sm:items-center' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{pendingUpload.fileName}</p>
                      <p className="text-white/50 text-xs">Ready to process</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${isMobile ? 'flex-row justify-end' : ''}`}>
                    <button
                      onClick={handleResumeUpload}
                      className="px-4 py-2.5 md:py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors touch-manipulation min-h-[44px] md:min-h-0"
                    >
                      Resume
                    </button>
                    <button
                      onClick={handleDiscardPending}
                      className="p-2.5 md:p-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
                      title="Discard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </m.div>
            )}
            
            {uploading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-white/50">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                Uploading…
              </div>
            )}
            {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
            
            {/* Debug: Clear all stored data */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleClearAllStorage}
                className="text-white/30 hover:text-white/50 text-xs underline transition-colors"
                title="Clear all stored upload data"
              >
                Clear all saved data
              </button>
            </div>
          </m.div>
        )}

        {/* B) Video Preview Area */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: step === 'options' ? 0.1 : 0 }}
          className={`rounded-2xl border-2 border-dashed border-primary/40 p-1 overflow-hidden bg-white/[0.02] ${isMobile ? 'mb-4' : 'mb-6'}`}
        >
          <div className={`rounded-xl bg-[#0a0a0a] flex flex-col ${isMobile ? 'min-h-[200px]' : 'min-h-[320px]'}`}>
            <div className={`px-3 md:px-4 py-2.5 md:py-3 border-b border-white/[0.08] flex items-center justify-between gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Preview</span>
              <div className={`flex items-center gap-2 min-w-0 ${isMobile ? 'flex-1 justify-end min-w-0' : ''}`}>
                {(videoFile || videoId) && (
                  <span className={`text-white/60 text-sm truncate ${isMobile ? 'max-w-[100px] sm:max-w-[140px]' : 'max-w-[180px]'}`}>
                    {videoFile?.name ?? 'Uploaded video'}
                  </span>
                )}
                {step === 'options' && (
                  <>
                    <label
                      htmlFor="change-video-input"
                      className="flex items-center gap-1 px-3 py-2 md:py-1 rounded-lg text-xs font-medium text-white/70 border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.04] cursor-pointer transition-colors shrink-0 touch-manipulation min-h-[40px] md:min-h-0 justify-center"
                      title="Change video"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Change
                      <input
                        id="change-video-input"
                        type="file"
                        accept=".mp4,.mov,.avi,.webm"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { handleRemoveVideo(); setTimeout(() => handleUploadSuccess(file), 0); }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="flex items-center gap-1 px-3 py-2 md:py-1 rounded-lg text-xs font-medium text-red-400/80 border border-red-400/20 hover:border-red-400/40 hover:bg-red-400/[0.06] transition-colors shrink-0 touch-manipulation min-h-[40px] md:min-h-0 justify-center"
                      title="Remove video"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${isMobile ? 'p-4 min-h-[180px]' : 'p-6 min-h-[280px]'}`}>
              {step === 'upload' && !videoFile && (
                <p className="text-white/40 text-sm">Your video will appear here</p>
              )}
              {step === 'options' && videoPreviewUrl && (
                <>
                  {/* Video filename heading */}
                  <div className="w-full text-center">
                    <p className="text-white font-medium text-base truncate max-w-md mx-auto" title={videoFile?.name}>
                      {videoFile?.name ?? 'Uploaded video'}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Ready to process</p>
                  </div>
                  <video
                    ref={videoPreviewRef}
                    src={videoPreviewUrl}
                    controls
                    className={`max-w-full rounded-lg object-contain ${isMobile ? 'max-h-[220px]' : 'max-h-[360px]'}`}
                    playsInline
                  />
                </>
              )}
            </div>

            {/* C) Feature Cards Row */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 border-t border-white/[0.08] ${isMobile ? 'gap-2 p-3' : 'gap-3 p-4'}`}>
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFeature(f.id)}
                  className={`rounded-xl text-center transition-all duration-300 border touch-manipulation min-h-[60px] md:min-h-0 ${
                    isMobile ? 'p-3' : 'p-4'
                  } ${
                    activeFeature === f.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-xl mb-2 block">{f.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </m.div>

        {/* D) Clip Duration Controls */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-2xl backdrop-blur-xl border border-white/[0.08] bg-white/[0.03] mb-6 md:mb-8 ${isMobile ? 'p-4' : 'p-6'}`}
        >
          <DurationSlider
            value={duration}
            onChange={setDuration}
            label="Clip duration"
            maxDuration={maxDurationVal}
          />
        </m.div>

        {/* Script input (collapsed when upload) + Generate */}
        {step === 'options' && (
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={isMobile ? 'space-y-3' : 'space-y-4'}
          >
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">Script (optional)</label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                maxLength={800}
                placeholder="Paste your script for precise captions. Leave blank to auto-transcribe from audio."
                className={`w-full bg-[#1a1a1a] border border-white/[0.1] px-4 py-3 rounded-xl text-white placeholder-white/25 resize-none text-sm focus:border-primary/50 outline-none transition-colors ${isMobile ? 'min-h-[64px]' : 'min-h-[80px]'}`}
                rows={isMobile ? 2 : 3}
              />
              <span className="text-white/35 text-xs tabular-nums">{userPrompt.length}/800</span>
            </div>

            {/* Processing options */}
            <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-3 md:space-y-4 ${isMobile ? 'p-4' : 'p-5'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Processing options</p>

              {/* Color grading */}
              <div className={`flex gap-4 ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between flex-wrap'}`}>
                <div>
                  <p className="text-sm text-white/80 font-medium">Color grade</p>
                  <p className="text-xs text-white/40 mt-0.5">Apply a cinematic LUT to the final video</p>
                </div>
                <select
                  value={colorGrade}
                  onChange={(e) => setColorGrade(e.target.value)}
                  className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition appearance-none touch-manipulation min-h-[44px] md:min-h-0"
                >
                  <option value="">None</option>
                  <option value="vintage">Vintage Film</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="frosted">Frosted</option>
                  <option value="foliage">Foliage</option>
                  <option value="cross_process">Cross Process</option>
                  <option value="bw">Black &amp; White</option>
                </select>
              </div>

              {/* Red hook toggle */}
              <div className={`flex gap-4 ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between'}`}>
                <div>
                  <p className="text-sm text-white/80 font-medium">Red hook text</p>
                  <p className="text-xs text-white/40 mt-0.5">Big red captions on brand names & key phrases</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRedHook((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors touch-manipulation flex-shrink-0 ${redHook ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${redHook ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Noise isolation toggle */}
              <div className={`flex gap-4 ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between'}`}>
                <div>
                  <p className="text-sm text-white/80 font-medium">Noise isolation</p>
                  <p className="text-xs text-white/40 mt-0.5">AI removes background noise before transcription (slower)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoiseIsolation((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors touch-manipulation flex-shrink-0 ${noiseIsolation ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${noiseIsolation ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Aspect ratio */}
              <div className={`flex gap-4 ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between flex-wrap'}`}>
                <div>
                  <p className="text-sm text-white/80 font-medium">Aspect ratio</p>
                  <p className="text-xs text-white/40 mt-0.5">Convert output to a specific format (crops or adds blurred background)</p>
                </div>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition appearance-none touch-manipulation min-h-[44px] md:min-h-0"
                >
                  <option value="">Original</option>
                  <option value="9:16">9:16 (Reels / TikTok)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Portrait)</option>
                  <option value="2:3">2:3 (Tall Portrait)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                </select>
              </div>

              {/* Rounded corners */}
              <div className={`flex gap-4 ${isMobile ? 'flex-col gap-2' : 'flex-row items-center justify-between flex-wrap'}`}>
                <div>
                  <p className="text-sm text-white/80 font-medium">Rounded corners</p>
                  <p className="text-xs text-white/40 mt-0.5">Add rounded corners to the video frame</p>
                </div>
                <select
                  value={roundedCorners}
                  onChange={(e) => setRoundedCorners(e.target.value)}
                  className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-primary transition appearance-none touch-manipulation min-h-[44px] md:min-h-0"
                >
                  <option value="none">None</option>
                  <option value="subtle">Subtle</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>

            <div className={`flex gap-4 items-center ${isMobile ? 'flex-col w-full' : 'flex-wrap'}`}>
              <button
                onClick={handleProcess}
                disabled={startingJob}
                className={`px-8 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] ${isMobile ? 'w-full justify-center' : ''}`}
              >
                {startingJob ? 'Starting…' : 'Generate clip'}
              </button>
              <Link
                to="/editor"
                state={{
                  videoFile,
                  videoId,
                  editorSettings: (() => {
                    let s = null;
                    try { const r = sessionStorage.getItem(EDITOR_SESSION_KEY); s = r ? JSON.parse(r) : null; } catch { s = null; }
                    const defaults = { style: 'auto', captionPosition: 'auto', behindPerson: true, captionPreset: 'Classic', fontSize: 58, textColor: '#ffffff', sampleText: 'Your caption will look like this', enableBroll: true };
                    const useStored = s && s.videoId === videoId;
                    return {
                      ...defaults,
                      ...(useStored ? s : {}),
                      userPrompt: userPrompt ?? s?.userPrompt ?? '',
                      duration: duration ?? s?.duration ?? '15',
                      model: model ?? s?.model ?? 'obula-pro',
                    };
                  })(),
                }}
                className={`px-5 py-2.5 border border-white/20 text-white/80 hover:bg-white/5 hover:border-white/30 rounded-xl text-sm font-medium transition-colors touch-manipulation min-h-[44px] flex items-center justify-center ${isMobile ? 'w-full' : ''}`}
              >
                Advanced settings
              </Link>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </m.div>
        )}
      </main>
    </div>
  );
}
