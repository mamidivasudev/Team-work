import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { saveObservation, getProjects, getObservationsList, getObservation, uploadObservationFile, deleteObservationFile } from '../services/api';
import type { Project } from '../types';
import { FileText, Upload, Plus, Trash2, X, FolderOpen } from 'lucide-react';

const Observations = () => {
  const [searchParams] = useSearchParams();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('New Observation Document');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [obsCount, setObsCount] = useState(1);
  
  const [history, setHistory] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
    loadHistory();
    // Intentionally omitting loadDocument here because loadDocument is defined later. 
    // We will handle it in a separate effect.
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-header-title', { detail: title }));
    return () => {
       window.dispatchEvent(new CustomEvent('update-header-title', { detail: '' }));
    };
  }, [title]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, selectedProjectId]); // Dependencies for handleSave closure

  const loadHistory = async () => {
    try {
      const data = await getObservationsList();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history");
    }
  };

  const loadDocument = async (filename: string) => {
    try {
      const data = await getObservation(filename);
      const cleanTitle = data.filename.replace(/_proj\d+/, '').replace('.html', '');
      setTitle(cleanTitle);
      
      const match = data.filename.match(/_proj(\d+)\.html/);
      if (match) {
        setSelectedProjectId(match[1]);
      }
      
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
      setSaveMessage('Loaded document');
      setShowHistory(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error("Failed to load document");
    }
  };

  useEffect(() => {
    const docToLoad = searchParams.get('doc');
    if (docToLoad) {
      loadDocument(docToLoad);
    }
  }, [searchParams]);

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteObservationFile(filename);
        loadHistory();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setSaveMessage('Uploading and converting...');
    try {
      const data = await uploadObservationFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
      setSaveMessage('Document uploaded! You can now tag observations.');
    } catch (err) {
      setSaveMessage('Error uploading file');
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setTimeout(() => {
      if(saveMessage === 'Error uploading file') setSaveMessage('');
    }, 4000);
  };

  const handleUploadClick = () => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      window.alert('Please select a specific project before uploading a document!');
      return;
    }
    fileInputRef.current?.click();
  };

  const insertObservationTag = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const html = `<span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: bold;" data-qa-obs="true">📌 Observation ${obsCount}</span><br/><br/>`;
    document.execCommand('insertHTML', false, html);
    setObsCount(prev => prev + 1);
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    if (!selectedProjectId || selectedProjectId === 'all') {
      window.alert('Error: Please select a specific project before saving!');
      return;
    }
    
    const content = editorRef.current.innerHTML;
    
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await saveObservation(title, content, parseInt(selectedProjectId));
      setSaveMessage(`Saved! ${res.tasks_created} tasks created.`);
      loadHistory();
    } catch (error) {
      setSaveMessage('Failed to save document');
    }
    setIsSaving(false);
    
    setTimeout(() => {
      setSaveMessage('');
    }, 4000);
  };

  const handleNew = () => {
    setTitle('New Observation Document');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setObsCount(1);
    setSaveMessage('');
    setShowHistory(false);
  };

  const filteredHistory = history.filter(doc => {
    if (selectedProjectId === 'all') return true;
    return doc.filename.includes(`_proj${selectedProjectId}.html`);
  });

  return (
    <div className="w-full px-6 pt-2 pb-6 h-full flex flex-col">
      
      {/* Saved Docs Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-gray-700">Saved Documents</h2>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="border border-gray-300 rounded p-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">-- All Projects --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleNew} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} /> New Doc
                </button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No saved documents yet.</p>
              ) : (
                filteredHistory.map((doc, idx) => (
                  <div 
                    key={idx}
                    onClick={() => loadDocument(doc.filename)}
                    className="w-full text-left p-3 hover:bg-blue-50 rounded-lg mb-2 flex items-center gap-3 group transition cursor-pointer border border-transparent hover:border-blue-100"
                  >
                    <FileText size={20} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate" title={doc.filename}>{doc.filename.replace(/_proj\d+/, '').replace('.html','')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(doc.filename, e)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2 rounded hover:bg-red-50 transition"
                      title="Delete Document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="flex-1 min-w-0 flex items-center">
            <p className="text-gray-500 text-sm truncate flex items-center gap-2 mt-1">
              QA observation document
              {selectedProjectId !== 'all' && (
                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                  Project: {projects.find(p => p.id.toString() === selectedProjectId)?.name || 'Unknown'}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 pt-1">
            <div className="flex items-center gap-2">
              {saveMessage && (
                <span className={`text-sm font-medium mr-2 ${saveMessage.includes('Error') || saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMessage}
                </span>
              )}
              
              <button 
                onClick={insertObservationTag}
                className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 text-lg rounded hover:bg-blue-200 transition flex items-center justify-center shadow-sm"
                title={`Insert Tag Observation ${obsCount}`}
              >
                📌
              </button>

              <button 
                onClick={() => setShowHistory(true)}
                className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 text-sm rounded font-medium hover:bg-gray-200 transition flex items-center gap-1.5"
                title="View Saved Documents"
              >
                <FolderOpen size={14} className="text-blue-600" /> Saved Docs
              </button>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                accept=".docx,.html,.txt" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 text-sm rounded font-medium hover:bg-gray-200 transition flex items-center gap-1.5"
                title="Select a project first to upload a Word Document"
              >
                <Upload size={14} /> {isUploading ? 'Uploading...' : 'Upload Doc'}
              </button>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save & Extract Tasks'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
          {/* Editor Canvas */}
          <div 
            ref={editorRef}
            contentEditable
            className="flex-grow p-8 outline-none prose max-w-none overflow-y-auto"
            data-placeholder="Start typing your observations here or paste screenshots (Ctrl+V)..."
          >
          </div>
        </div>
      </div>
    </div>
  );
};

export default Observations;
