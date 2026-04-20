'use client';

import { useState, useRef } from 'react';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.75)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  washedBlue: '#6E93B5',
  washedGreen: '#4F7A6A',
  washedGreenDark: '#3E6357',
  sunset: '#E07A5F',
};

const DATA_TYPES = [
  { id: 'sar', label: 'SAR Scene', desc: 'ERS-2, Radarsat-1, Sentinel-1 GeoTIFF or .zip', color: '#2F5D8C', ext: '.tif .zip .dim' },
  { id: 'optical', label: 'Optical Imagery', desc: 'NAIP, aerial photography, multispectral GeoTIFF', color: '#4F7A6A', ext: '.tif .jp2 .img' },
  { id: 'gps', label: 'GPS / Vector Data', desc: 'Field waypoints, survey polygons, site boundaries', color: '#6E93B5', ext: '.geojson .kml .shp .gpx' },
  { id: 'field', label: 'Field Notes / Docs', desc: 'Inspection notes, photos, lab results, PDFs', color: '#E07A5F', ext: '.pdf .docx .jpg .png' },
];

type UploadFile = {
  id: string;
  file: File;
  type: string;
  lithicEarth: boolean;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
};

export default function UploadPage() {
  const [selectedType, setSelectedType] = useState('sar');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadFile[] = Array.from(incoming).map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f, type: selectedType, lithicEarth: false, progress: 0, status: 'pending',
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const updateFile = (id: string, patch: Partial<UploadFile>) => setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    for (const f of files) {
      updateFile(f.id, { status: 'uploading' });
      for (let p = 0; p <= 100; p += 20) {
        await new Promise(r => setTimeout(r, 120));
        updateFile(f.id, { progress: p });
      }
      updateFile(f.id, { status: 'done', progress: 100 });
    }
  };

  const allDone = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg }}>
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: THEME.surfaceStrong, borderBottom: `1px solid ${THEME.border}`, backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-4">
          <a href="/portal" className="text-sm font-light flex items-center gap-1.5" style={{ color: 'rgba(20,35,55,0.50)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </a>
          <span style={{ color: THEME.border }}>·</span>
          <h1 className="text-base font-light" style={{ color: THEME.ink }}>Upload Environmental Data</h1>
        </div>
        <a href="/portal/reports" className="text-sm font-light px-4 py-2 rounded-full border" style={{ color: THEME.leviBlue, borderColor: 'rgba(47,93,140,0.30)' }}>
          Generate Report
        </a>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs font-light tracking-widest uppercase mb-4" style={{ color: 'rgba(20,35,55,0.40)' }}>Data Type</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DATA_TYPES.map(t => (
              <button key={t.id} onClick={() => setSelectedType(t.id)} className="text-left p-4 rounded-2xl transition-all"
                style={{ backgroundColor: selectedType === t.id ? `${t.color}12` : THEME.surfaceStrong, border: `1px solid ${selectedType === t.id ? t.color + '45' : THEME.border}` }}>
                <div className="text-sm font-light mb-1" style={{ color: selectedType === t.id ? t.color : THEME.ink }}>{t.label}</div>
                <div className="text-xs font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>{t.ext}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl flex flex-col items-center justify-center py-14 mb-6 cursor-pointer transition-all"
          style={{ backgroundColor: dragging ? 'rgba(47,93,140,0.06)' : THEME.surfaceStrong, border: `2px dashed ${dragging ? THEME.leviBlue : 'rgba(20,35,55,0.18)'}` }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
          <svg width="36" height="36" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: dragging ? THEME.leviBlue : 'rgba(20,35,55,0.30)', marginBottom: 12 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div className="text-base font-light mb-1" style={{ color: THEME.ink }}>Drop files here or click to browse</div>
          <div className="text-sm font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>{DATA_TYPES.find(t => t.id === selectedType)?.desc}</div>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
        </div>

        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}` }}>
          <div className="text-xs font-light tracking-widest uppercase mb-4" style={{ color: 'rgba(20,35,55,0.40)' }}>Dataset Metadata</div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Project / Site Name</label>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Abilene Bamboo AOI Survey"
                className="w-full text-sm font-light px-4 py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
            </div>
            <div>
              <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Location / AOI</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Taylor County, TX · 32.4°N 99.7°W"
                className="w-full text-sm font-light px-4 py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Survey / Acquisition Date</label>
            <input type="date" value={surveyDate} onChange={e => setSurveyDate(e.target.value)}
              className="text-sm font-light px-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
          </div>
          <div>
            <label className="block text-xs font-light mb-1.5" style={{ color: 'rgba(20,35,55,0.55)' }}>Field Notes / Observations</label>
            <textarea value={globalNotes} onChange={e => setGlobalNotes(e.target.value)}
              placeholder="Describe what was observed, methodology, conditions, anomalies..." rows={4}
              className="w-full text-sm font-light px-4 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: 'rgba(20,35,55,0.04)', border: `1px solid ${THEME.border}`, color: THEME.ink }} />
          </div>
        </div>

        {files.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: THEME.surfaceStrong, border: `1px solid ${THEME.border}` }}>
            <div className="px-6 py-4 text-sm font-light" style={{ color: THEME.ink, borderBottom: `1px solid ${THEME.border}` }}>
              {files.length} file{files.length > 1 ? 's' : ''} queued
            </div>
            {files.map(f => (
              <div key={f.id} className="px-6 py-4" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-light truncate" style={{ color: THEME.ink }}>{f.file.name}</div>
                    <div className="text-xs font-light" style={{ color: 'rgba(20,35,55,0.45)' }}>{formatSize(f.file.size)}</div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-light cursor-pointer" style={{ color: 'rgba(20,35,55,0.60)' }}>
                    <input type="checkbox" checked={f.lithicEarth} onChange={e => updateFile(f.id, { lithicEarth: e.target.checked })} />
                    Flag for LithicEarth
                  </label>
                  {f.status === 'pending' && <button onClick={() => removeFile(f.id)} className="text-xs font-light" style={{ color: 'rgba(20,35,55,0.35)' }}>Remove</button>}
                  {f.status === 'done' && <span className="text-xs font-light px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(79,122,106,0.12)', color: '#4F7A6A' }}>Done</span>}
                </div>
                {f.status === 'uploading' && (
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(20,35,55,0.08)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.progress}%`, backgroundColor: THEME.leviBlue }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={handleSubmit} disabled={files.length === 0 || allDone}
            className="flex items-center gap-2 text-white px-8 py-3 rounded-full font-light text-sm disabled:opacity-40"
            style={{ backgroundColor: THEME.leviBlue }}>
            {allDone ? 'Upload Complete' : `Upload ${files.length > 0 ? files.length + ' File' + (files.length > 1 ? 's' : '') : 'Files'}`}
          </button>
          {allDone && (
            <a href="/portal/reports" className="text-sm font-light" style={{ color: THEME.leviBlue }}>
              Generate Report from this data →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
