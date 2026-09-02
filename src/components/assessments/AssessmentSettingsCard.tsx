import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { assessmentService } from '../../services/assessments';

function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v');
      else if (parsed.pathname.startsWith('/embed/')) videoId = parsed.pathname.split('/embed/')[1];
      else if (parsed.pathname.startsWith('/shorts/')) videoId = parsed.pathname.split('/shorts/')[1];
    }

    videoId = videoId ? videoId.split('/')[0].split('?')[0] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

const AssessmentSettingsCard: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    assessmentService
      .getConfig()
      .then((data) => {
        setVideoUrl(data.intro_video_url || '');
        setSavedUrl(data.intro_video_url || '');
      })
      .catch(() => toast.error('Failed to load assessment settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await assessmentService.updateConfig(videoUrl.trim());
      setVideoUrl(data.intro_video_url || '');
      setSavedUrl(data.intro_video_url || '');
      toast.success('Assessment settings saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save assessment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => setVideoUrl('');

  const previewUrl = toEmbedUrl(videoUrl);
  const isDirty = videoUrl.trim() !== savedUrl;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Intro Video</h2>
      <p className="text-xs text-gray-500 mb-3">
        Paste a YouTube link to show above the &quot;Start Assessment&quot; button on the public assessment page. Leave empty to hide it.
      </p>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {videoUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {previewUrl && (
            <div className="w-40 aspect-square rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
              <iframe
                width="100%"
                height="100%"
                src={previewUrl}
                title="Preview"
                frameBorder="0"
                allow="encrypted-media; picture-in-picture"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentSettingsCard;
