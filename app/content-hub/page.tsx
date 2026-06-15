'use client';

import { useEffect, useState } from 'react';
import ProtectedLayout from '../../components/ProtectedLayout';
import { apiFetch, parseApiJson } from '../../lib/apiClient';

interface LectureItem {
  id: string;
  moduleName: string;
  fileName: string;
  fileUrl: string;
  textContent: string | null;
  createdAt: string;
}

export default function ContentHubPage() {
  const [moduleName, setModuleName] = useState('');
  const [folderLink, setFolderLink] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<LectureItem[]>([]);

  const fetchLectures = async () => {
    try {
      const response = await apiFetch('/api/content-hub/list');
      const data = await parseApiJson<{ error?: string; lectures?: LectureItem[] }>(response);
      if (!response.ok) {
        throw new Error(data.error || 'Unable to retrieve lectures.');
      }
      setLectures(data.lectures || []);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to load lectures.');
    }
  };

  useEffect(() => {
    void fetchLectures();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (!moduleName.trim()) {
        throw new Error('Please provide a module name.');
      }

      const formData = new FormData();
      formData.append('moduleName', moduleName.trim());
      files.forEach((file) => formData.append('lectureFiles', file));
      if (folderLink.trim()) {
        formData.append('folderLink', folderLink.trim());
      }

      const response = await apiFetch('/api/content-hub/upload', {
        method: 'POST',
        body: formData
      });

      const result = await parseApiJson<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed.');
      }

      setMessage('Lecture content added successfully.');
      setModuleName('');
      setFolderLink('');
      setFiles([]);
      await fetchLectures();
    } catch (error: any) {
      setMessage(error?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Lecture Content Hub</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Upload lectures for study and AI modules.</h1>
              <p className="mt-4 max-w-2xl text-slate-400">Add PDFs, DOCX files, images, or Google Drive folder resources and reuse them across the whole EduAI system.</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="mt-8 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Module name</span>
                <input
                  value={moduleName}
                  onChange={(event) => setModuleName(event.target.value)}
                  placeholder="e.g. Computer Science 101"
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none transition focus:border-cyan-500/70"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Google Drive folder link</span>
                <input
                  value={folderLink}
                  onChange={(event) => setFolderLink(event.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white outline-none transition focus:border-cyan-500/70"
                />
              </label>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">Upload lecture files</p>
              <input type="file" multiple onChange={handleFileChange} className="text-sm text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">Supported: PDF, DOCX, TXT, Markdown, images, and common document formats.</p>
              {files.length > 0 && (
                <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p className="mb-2 font-semibold text-white">Selected files</p>
                  <ul className="space-y-2">
                    {files.map((file) => (
                      <li key={file.name} className="rounded-2xl bg-white/5 px-3 py-2">{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {message && <p className="rounded-3xl bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-3xl bg-cyan-500 px-8 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Uploading…' : 'Add lecture content'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-glow">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">My uploaded lectures</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Lecture library</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {lectures.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6 text-slate-400">No lectures uploaded yet. Use the upload form to add your first module.</div>
            ) : (
              lectures.map((lecture) => (
                <div key={lecture.id} className="rounded-[2rem] border border-white/10 bg-[#08111c]/90 p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{lecture.moduleName}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{lecture.fileName}</p>
                  <p className="mt-4 text-sm text-slate-400">{new Date(lecture.createdAt).toLocaleString()}</p>
                  <a href={lecture.fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-3xl bg-white/5 px-4 py-3 text-sm text-cyan-200 transition hover:bg-cyan-500/10">
                    Open file
                  </a>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </ProtectedLayout>
  );
}
