import React, { useRef, useState, useEffect } from 'react';
import { saveObservation, getProjects, getObservationsList, getObservation, uploadObservationFile, deleteObservationFile } from '../services/api';
import type { Project } from '../types';
import { FileText, Upload, Plus, Trash2 } from 'lucide-react';

const Observations = () => {
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

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
    loadHistory();
  }, []);

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
      // Remove the _projXXX part for the title display
      const cleanTitle = data.filename.replace(/_proj\d+/, '').replace('.html', '');
      setTitle(cleanTitle);
      
      // Auto select the project if we can parse it from filename
      const match = data.filename.match(/_proj(\d+)\.html/);
      if (match) {
        setSelectedProjectId(match[1]);
      }
      
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
      setSaveMessage('Loaded document');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error("Failed to load document");
    }
  };

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

  const formatText = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
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
  };

  const filteredHistory = history.filter(doc => {
    if (selectedProjectId === 'all') return true;
    return doc.filename.includes(`_proj${selectedProjectId}.html`);
  });

  return (
    <div className="w-full px-6 py-6 h-full flex gap-6">
      
      {/* Sidebar History */}
      <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-100px)] shrink-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Saved Docs</h2>
          <button onClick={handleNew} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="New Document">
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-gray-400 p-2 text-center mt-4">No saved documents yet.</p>
          ) : (
            filteredHistory.map((doc, idx) => (
              <div 
                key={idx}
                onClick={() => loadDocument(doc.filename)}
                className="w-full text-left p-2 hover:bg-blue-50 rounded mb-1 flex items-start gap-2 group transition cursor-pointer"
              >
                <FileText size={16} className="text-gray-400 mt-1 group-hover:text-blue-500 shrink-0" />
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate" title={doc.filename}>{doc.filename.replace(/_proj\d+/, '').replace('.html','')}</p>
                  <p className="text-[10px] text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={(e) => handleDelete(doc.filename, e)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-100px)] min-w-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 max-w-2xl">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 hover:border-gray-300 w-full mb-2"
              placeholder="Document Title"
            />
            <div className="flex items-center gap-4">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="border border-gray-300 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">-- All Projects --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="text-gray-500 text-sm">QA observation document</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-3 mt-1">
              {saveMessage && (
                <span className={`text-sm font-medium ${saveMessage.includes('Error') || saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                  {saveMessage}
                </span>
              )}
              
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
                className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                title="Select a project first to upload a Word Document"
              >
                <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload Doc'}
              </button>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save & Extract Tasks'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 items-center flex-wrap">
            <button onClick={() => formatText('bold')} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 font-bold">B</button>
            <button onClick={() => formatText('italic')} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 italic">I</button>
            <button onClick={() => formatText('underline')} className="px-3 py-1 bg-white border rounded hover:bg-gray-100 underline">U</button>
            <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div>
            <button onClick={() => formatText('insertUnorderedList')} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">• List</button>
            <button onClick={() => formatText('insertOrderedList')} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">1. List</button>
            <div className="w-px h-6 bg-gray-300 mx-1 my-auto"></div>
            <button 
              onClick={insertObservationTag}
              className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded hover:bg-blue-200 font-semibold flex items-center gap-1 transition"
            >
              📌 Tag Observation {obsCount}
            </button>
          </div>

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
