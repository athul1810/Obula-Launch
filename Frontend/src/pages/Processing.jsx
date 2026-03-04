import { useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav.jsx';
import ProgressSteps from '../components/ProgressSteps.jsx';
import VideoPreview from '../components/VideoPreview.jsx';
import { useBackgroundJob, getLastActiveJobId } from '../hooks/useBackgroundJob.js';
import { cancelJob } from '../api/upload.js';

export default function Processing() {
  const { jobId: urlJobId } = useParams();
  const navigate = useNavigate();
  const redirectingRef = useRef(false);
  
  // Check for job ID - either from URL or from localStorage
  const jobId = urlJobId || getLastActiveJobId();
  
  const { job, error, elapsedSeconds, isPolling } = useBackgroundJob(jobId);

  // If no jobId in URL but we have one in localStorage, redirect to it
  useEffect(() => {
    if (!urlJobId && jobId && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate(`/upload/processing/${jobId}`, { replace: true });
    }
  }, [urlJobId, jobId, navigate]);

  // Handle manual cancellation
  const handleCancel = async () => {
    if (!jobId) return;
    try {
      await cancelJob(jobId);
    } catch {
      // Ignore errors - job might already be done
    }
  };

  if (!jobId) {
    return (
      <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
        <LandingNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-white/60">Missing job ID.</p>
          <Link to="/upload" className="ml-2 text-primary hover:underline">Back to Upload</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
        <LandingNav />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-red-400">{error}</p>
          <Link to="/upload" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (job?.status === 'completed') {
    return (
      <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
        <LandingNav />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <VideoPreview
            outputVideoUrl={job.output_video_url}
            processingTime={job.processing_time}
            overlaysAdded={job.overlays_added}
          />
          <Link
            to="/upload"
            className="mt-4 w-full max-w-2xl py-3.5 border border-white/25 text-white/90 hover:bg-white/5 font-medium rounded-xl transition-colors text-center block"
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

  if (job?.status === 'failed') {
    return (
      <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
        <LandingNav />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-red-400 text-center">{job.detail || 'Processing failed.'}</p>
          <Link to="/upload" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (job?.status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
        <LandingNav />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <p className="text-white/70">Processing was cancelled.</p>
          <Link to="/upload" className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-[#0a0a0a]">
      <LandingNav />
      <div className="flex-1 flex flex-col items-center p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-bold text-white mb-1">Creating your clip</h1>
        <p className="text-white/55 text-sm mb-6">
          Our AI is working on it. You can leave this page. Processing continues in the background.
        </p>
        <div className="w-full">
          <ProgressSteps
            stage={job?.stage}
            message={job?.message}
            progress={job?.progress}
            elapsedSeconds={elapsedSeconds}
            estimatedSecondsRemaining={job?.estimated_seconds_remaining}
          />
        </div>
        
        {/* Show polling status indicator when tab is hidden */}
        {isPolling && document.hidden && (
          <div className="mt-4 flex items-center gap-2 text-white/40 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Processing in background...
          </div>
        )}

        {/* Cancel button */}
        {(job?.status === 'queued' || job?.status === 'processing') && (
          <button
            onClick={handleCancel}
            className="mt-6 text-white/40 hover:text-white/60 text-sm underline transition-colors"
          >
            Cancel processing
          </button>
        )}
      </div>
    </div>
  );
}
