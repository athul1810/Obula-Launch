// Labels match exactly what the pipeline prints in run_complete_for_api.py
const STAGE_LABELS = {
  queued: 'Starting…',
  processing: 'Running caption pipeline…',
  extracting_audio: 'Copying your uploaded video for processing...',
  generating_masks: 'Generating person masks (for captions-behind-person effect)...',
  transcribing: 'Transcribing audio and styling captions...',
  burning_captions: 'Applying captions (dynamic position + front/behind from video)...',
  generating_broll: 'B-roll: planning placements, building montages, burning captions, overlaying...',
  building_video: 'Adding vertical intro and exporting...',
};

// Fallback estimate (sec) per stage when backend doesn't send one
const FALLBACK_ESTIMATE = {
  queued: 120,
  processing: 100,
  extracting_audio: 95,
  generating_masks: 75,
  transcribing: 70,
  generating_broll: 25,
  building_video: 15,
  burning_captions: 40,
};

// Order matches backend's 6-step pipeline
const STAGE_ORDER = [
  'queued',
  'processing',
  'extracting_audio',
  'generating_masks',
  'transcribing',
  'burning_captions',
  'generating_broll',
  'building_video',
];

const SHORT_LABELS = {
  queued: 'Starting',
  processing: 'Initializing',
  extracting_audio: 'Preparing video',
  generating_masks: 'Detecting faces',
  transcribing: 'Transcribing',
  burning_captions: 'Adding captions',
  generating_broll: 'Adding B-roll',
  building_video: 'Exporting',
};

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `0:${s.toString().padStart(2, '0')}`;
}

function formatEstimate(seconds) {
  if (seconds == null || seconds < 0) return null;
  if (seconds >= 60) {
    const m = Math.round(seconds / 60);
    return m === 1 ? '~1 min left' : `~${m} min left`;
  }
  return seconds <= 10 ? 'Almost done…' : `~${seconds} sec left`;
}

export default function ProgressSteps({ stage, message, progress, elapsedSeconds, estimatedSecondsRemaining }) {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  // Prefer backend message (exact pipeline text) when available
  const label = stage ? (message || STAGE_LABELS[stage] || stage) : 'Processing…';
  const effectiveEstimate =
    estimatedSecondsRemaining != null
      ? estimatedSecondsRemaining
      : (stage && FALLBACK_ESTIMATE[stage]) ?? 90;
  const estimateStr = formatEstimate(effectiveEstimate);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent shrink-0" />
        <span className="text-white/90 font-medium">{label}</span>
      </div>
      {elapsedSeconds != null && elapsedSeconds >= 0 && (
        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-white/5 dark:bg-white/5 rounded-xl border border-white/10 flex-wrap">
          <span className="text-white/50 text-xs uppercase tracking-wider">Elapsed</span>
          <span className="text-primary font-mono text-xl font-bold tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-primary font-semibold text-sm">{estimateStr}</span>
        </div>
      )}
      {progress != null && (
        <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {STAGE_ORDER.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <span
              key={s}
              className={`text-xs px-2.5 py-1.5 rounded font-medium transition-all ${
                isCurrent
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-zinc-900 scale-105 shadow-lg shadow-primary/30'
                  : isDone
                    ? 'bg-primary/20 text-primary/90'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600'
              }`}
            >
              {SHORT_LABELS[s] ?? s.replace(/_/g, ' ')}
            </span>
          );
        })}
      </div>
    </div>
  );
}
