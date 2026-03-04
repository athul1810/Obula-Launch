import { useState } from 'react';
import { getOutputVideoURL } from '../api/upload.js';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function VideoPreview({ outputVideoUrl, processingTime, overlaysAdded }) {
  const src = outputVideoUrl ? getOutputVideoURL(outputVideoUrl) : null;
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const { user } = useAuth();

  const handleDownload = async () => {
    if (!src) return;
    setDownloading(true);
    setSaveError(null);
    try {
      const res = await fetch(src);
      const blob = await res.blob();

      // Save to Supabase Storage + videos table (skip if file > 200 MB)
      const MAX_CLOUD_BYTES = 200 * 1024 * 1024;
      if (user && blob.size <= MAX_CLOUD_BYTES) {
        const storagePath = `${user.id}/${Date.now()}.mp4`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('videos')
          .upload(storagePath, blob, { contentType: 'video/mp4', upsert: false });

        if (uploadErr) {
          setSaveError(`Cloud save failed: ${uploadErr.message}`);
        } else {
          await supabase.from('videos').insert({
            user_id: user.id,
            title: 'Obula Clip',
            storage_path: uploadData.path,
            file_size: blob.size,
          });
          setSaved(true);
        }
      }

      // Trigger browser download regardless
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'obula_clip.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 w-full max-w-2xl">
      <div className="text-center mb-2">
        <h3 className="text-xl font-semibold text-white">Your clip is ready</h3>
        <p className="text-sm text-white/55 mt-2">Preview and download when you're ready</p>
      </div>
      <div className="aspect-[9/16] w-full mx-auto bg-black border border-white/10 overflow-hidden rounded-xl shadow-2xl">
        {src ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            No preview
          </div>
        )}
      </div>
      {(processingTime != null || overlaysAdded != null) && (
        <div className="flex gap-4 justify-center text-sm text-white/50 flex-wrap">
          {processingTime != null && <span>Processed in {processingTime.toFixed(1)}s</span>}
          {overlaysAdded != null && (
            <span>• {overlaysAdded.replace(/,/g, ', ').replace(/^captions/, 'Captions').replace(/broll/, 'B-roll')}</span>
          )}
        </div>
      )}
      {src && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold hover:bg-primary-dark rounded-xl transition-colors text-base shadow-lg shadow-primary/25 disabled:opacity-70"
          >
            {downloading ? 'Saving & downloading…' : '↓ Download processed video'}
          </button>
          {saved && (
            <p className="text-green-400 text-sm">Saved to your account · <a href="/my-videos" className="underline hover:text-green-300">View My Videos</a></p>
          )}
          {saveError && (
            <p className="text-yellow-400 text-sm">{saveError}</p>
          )}
        </div>
      )}
    </div>
  );
}
