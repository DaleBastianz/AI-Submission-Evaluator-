'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch } from '../../lib/apiClient';

interface LectureItem {
  id: string;
  moduleName: string;
  fileName: string;
}

interface VideoItem {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
  relevanceScore: number;
}

interface TopicResult {
  topic: string;
  videos: VideoItem[];
}

interface BookmarkItem {
  id: string;
  topic: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoUrl: string;
}

export default function ReferencesPage() {
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);
  const [topicResults, setTopicResults] = useState<TopicResult[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadLectures = async () => {
      const response = await apiFetch('/api/lectures');
      const data = await response.json();
      if (response.ok) {
        setLectures(data.lectures || []);
        setSelectedLectureIds(data.lectures?.slice(0, 1).map((item: LectureItem) => item.id) || []);
      }
    };
    const loadBookmarks = async () => {
      const response = await apiFetch('/api/references/bookmarks');
      const data = await response.json();
      if (response.ok) {
        setBookmarks(data.bookmarks || []);
      }
    };
    void loadLectures();
    void loadBookmarks();
  }, []);

  const toggleLecture = (lectureId: string) => {
    setSelectedLectureIds((current) =>
      current.includes(lectureId) ? current.filter((id) => id !== lectureId) : [...current, lectureId]
    );
  };

  const handleGenerate = async () => {
    setMessage('');
    setLoading(true);
    setTopicResults([]);
    setSelectedTopic('');

    try {
      if (!selectedLectureIds.length) {
        throw new Error('Select at least one lecture to generate references.');
      }

      const response = await apiFetch('/api/references/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureIds: selectedLectureIds })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Reference generation failed.');
      }
      setTopicResults(result.topicResults || []);
      setSelectedTopic(result.topicResults?.[0]?.topic || '');
    } catch (error: any) {
      setMessage(error?.message || 'Could not generate references.');
    } finally {
      setLoading(false);
    }
  };

  const saveBookmark = async (topic: string, video: VideoItem) => {
    try {
      const response = await apiFetch('/api/references/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, title: video.title, channel: video.channel, videoId: video.videoId, thumbnail: video.thumbnail, videoUrl: video.videoUrl })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Bookmark failed.');
      }
      setBookmarks((current) => [result.bookmark, ...current]);
      setMessage('Reference bookmarked successfully.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save bookmark.');
    }
  };

  const filteredResults = useMemo(
    () => (selectedTopic ? topicResults.filter((item) => item.topic === selectedTopic) : topicResults),
    [topicResults, selectedTopic]
  );

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Reference Engine</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Discover curated YouTube lessons for your study topics.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Extract key topics from your lectures, search the YouTube education library, and bookmark videos for later review.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Lecture source</p>
              <div className="mt-6 grid gap-3">
                {lectures.length === 0 ? (
                  <p className="text-slate-400">No lectures available. Upload content in Content Hub to start.</p>
                ) : (
                  lectures.map((lecture) => (
                    <button
                      key={lecture.id}
                      type="button"
                      onClick={() => toggleLecture(lecture.id)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedLectureIds.includes(lecture.id) ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950/80 text-slate-300 hover:border-cyan-400/50'}`}
                    >
                      <p className="font-semibold">{lecture.fileName}</p>
                      <p className="mt-1 text-sm text-slate-400">{lecture.moduleName}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Reference generation</p>
              <p className="mt-4 text-sm text-slate-400">Generate topics and related educational videos that match your uploaded lecture content.</p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 w-full rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Searching videos…' : 'Generate references'}
              </button>
              {message && <p className="mt-4 rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
            </div>
          </div>
        </section>

        {topicResults.length > 0 && (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {topicResults.map((item) => (
                <button
                  key={item.topic}
                  type="button"
                  onClick={() => setSelectedTopic(item.topic)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedTopic === item.topic ? 'bg-cyan-500 text-slate-950' : 'border border-white/10 text-slate-300 hover:border-cyan-400/50'}`}
                >
                  {item.topic}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTopic('')}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/50"
              >
                Show all topics
              </button>
            </div>

            <div className="space-y-8">
              {filteredResults.map((topicResult) => (
                <div key={topicResult.topic} className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Topic</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{topicResult.topic}</p>
                    </div>
                    <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">Best videos</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {topicResult.videos.map((video) => (
                      <div key={video.videoId} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
                        <div className="relative overflow-hidden rounded-3xl bg-black/40">
                          <img src={video.thumbnail} alt={video.title} className="h-44 w-full object-cover" />
                        </div>
                        <div className="mt-4">
                          <p className="text-lg font-semibold text-white">{video.title}</p>
                          <p className="mt-2 text-sm text-slate-400">{video.channel}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                          <span className="rounded-full bg-white/5 px-3 py-2">{video.duration}</span>
                          <span className="rounded-full bg-white/5 px-3 py-2">Relevance {video.relevanceScore}</span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <a href={video.videoUrl} target="_blank" rel="noreferrer" className="rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                            Watch
                          </a>
                          <button
                            type="button"
                            onClick={() => saveBookmark(topicResult.topic, video)}
                            className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50"
                          >
                            Bookmark
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {bookmarks.length > 0 && (
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Saved references</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Bookmarked videos</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <a key={bookmark.id} href={bookmark.videoUrl} target="_blank" rel="noreferrer" className="group rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-5 transition hover:border-cyan-400/50">
                  <div className="relative overflow-hidden rounded-3xl bg-black/40">
                    <img src={bookmark.thumbnail} alt={bookmark.title} className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">{bookmark.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{bookmark.channel}</p>
                  <p className="mt-3 inline-flex rounded-full bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">Topic: {bookmark.topic}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </ProtectedLayout>
  );
}
