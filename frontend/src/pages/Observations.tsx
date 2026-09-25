import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { saveObservation, getProjects, getObservationsList, getObservation, uploadObservationFile, deleteObservationFile, renameObservationFile } from '../services/api';
import type { Project } from '../types';
import { FileText, Upload, Plus, Trash2, X, FolderOpen, Undo2, Redo2, Edit2, ChevronDown } from 'lucide-react';

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
  
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);

  // Remove Modal States
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [obsInDoc, setObsInDoc] = useState<number[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<number[]>([]);

  // Name prompt modal (shown when saving a manually typed/pasted doc with no filename)
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingDocName, setPendingDocName] = useState('');

  useEffect(() => {
    getProjects().then(p => {
      setProjects(p);
      if (p.length === 1) setSelectedProjectId(p[0].id.toString());
    }).catch(console.error);
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
  }, [title, selectedProjectId]);

  const loadHistory = async () => {
    try {
      const data = await getObservationsList();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history");
    }
  };

  const updateObsCountFromContent = (htmlContent: string) => {
    const matches = htmlContent.match(/Observation\s+(\d+)/gi);
    if (!matches || matches.length === 0) {
      setObsCount(1);
      return;
    }
    const numbers = matches.map(m => {
      const numMatch = m.match(/\d+/);
      return numMatch ? parseInt(numMatch[0]) : 0;
    });
    const maxNum = Math.max(...numbers);
    setObsCount(maxNum + 1);
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
        updateObsCountFromContent(data.content);
        
        // Scroll to specific observation if coming from Tasks link
        setTimeout(() => {
          const obsParam = searchParams.get('obs');
          if (obsParam && editorRef.current) {
            const spans = editorRef.current.querySelectorAll('span[data-qa-obs="true"]');
            for (let i = 0; i < spans.length; i++) {
              if (spans[i].textContent?.includes(obsParam)) {
                spans[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Flash yellow highlight so they spot it easily
                const el = spans[i] as HTMLElement;
                const originalBg = el.style.backgroundColor;
                el.style.backgroundColor = '#fef08a'; 
                setTimeout(() => {
                  el.style.transition = 'background-color 1s ease';
                  el.style.backgroundColor = originalBg;
                }, 1500);
                break;
              }
            }
          }
        }, 150);
      }
      setSaveMessage('Loaded document');
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
        updateObsCountFromContent(data.content);
      }
      setSaveMessage('Document uploaded! You can now tag observations.');
    } catch (err) {
      setSaveMessage('Error uploading file');
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setTimeout(() => {
      if(saveMessage === 'Error uploading file') setSaveMessage('');
    }, 10000);
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

      // Find the start of the current line/block to always insert the tag at the beginning
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.focusNode;
        if (node) {
          let blockNode = node;
          while (blockNode && blockNode.parentNode && blockNode !== editorRef.current) {
            if (blockNode.nodeType === 1) {
              const tag = (blockNode as Element).tagName;
              if (['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'TR', 'TD'].includes(tag)) {
                break;
              }
            }
            blockNode = blockNode.parentNode;
          }
          
          const range = document.createRange();
          if (blockNode && blockNode !== editorRef.current) {
            // We found a block wrapper (like a DIV or P)
            range.setStart(blockNode, 0);
          } else {
            // It's raw text/inline nodes right inside the editor root
            let topChild = node;
            while (topChild && topChild.parentNode && topChild.parentNode !== editorRef.current) {
              topChild = topChild.parentNode;
            }
            if (topChild) {
              range.setStartBefore(topChild);
            } else {
              range.setStart(editorRef.current, 0);
            }
          }
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
    
    // Insert the tag followed by a line break so the text is pushed to the next line
    const html = `<span contentEditable="false" class="group inline-flex items-center gap-1.5" style="background-color: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-bottom: 2px;" data-qa-obs="true">📌 Observation ${obsCount}<span class="delete-obs-btn opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-indigo-400 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]" title="Remove Tag" style="margin-left: 2px;">✕</span></span><br/>`;
    document.execCommand('insertHTML', false, html);
    setObsCount(prev => prev + 1);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('delete-obs-btn')) {
      const parentSpan = target.closest('span[data-qa-obs="true"]');
      if (parentSpan) {
        // Remove trailing <br> if present
        let nextNode = parentSpan.nextSibling;
        if (nextNode && nextNode.nodeName === 'BR') {
          nextNode.remove();
        }
        parentSpan.remove();
        if (editorRef.current) {
          updateObsCountFromContent(editorRef.current.innerHTML);
        }
      }
    }
  };

  const handleUndo = () => document.execCommand('undo', false);
  const handleRedo = () => document.execCommand('redo', false);

  const openRemoveModal = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const matches = content.match(/Observation\s+(\d+)/gi);
    if (!matches) {
      setObsInDoc([]);
    } else {
      const nums = matches.map(m => {
        const numMatch = m.match(/\d+/);
        return numMatch ? parseInt(numMatch[0]) : 0;
      }).filter(n => n > 0).sort((a,b) => a - b);
      setObsInDoc(Array.from(new Set(nums)));
    }
    setSelectedToRemove([]);
    setShowRemoveModal(true);
  };

  const handleRemoveSelected = () => {
    if (!editorRef.current) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current.innerHTML;
    
    // First, try removing spans that contain the observation text
    const spans = Array.from(tempDiv.querySelectorAll('span'));
    spans.forEach(span => {
      const text = span.textContent || '';
      const numMatch = text.match(/Observation\s+(\d+)/i);
      if (numMatch && selectedToRemove.includes(parseInt(numMatch[1]))) {
        span.remove();
      }
    });

    // Second, just in case there are loose text nodes (from older tags without spans)
    // we do a safer string replace on the remaining innerHTML
    let html = tempDiv.innerHTML;
    selectedToRemove.forEach(num => {
      // Matches "📌 Observation X" or "Observation X" ignoring case, and optional surrounding spaces/&nbsp;
      const regex = new RegExp(`(&nbsp;|\\s)*(📌\\s*)?Observation\\s+${num}(&nbsp;|\\s)*`, 'gi');
      html = html.replace(regex, '');
    });
    
    editorRef.current.innerHTML = html;
    updateObsCountFromContent(html);
    setShowRemoveModal(false);
    
    // Automatically trigger save so the user doesn't have to click it manually!
    setTimeout(() => {
      handleSave();
    }, 100); // Tiny delay to let the DOM settle and state update
  };

  const DEFAULT_TITLE = 'New Observation Document';

  const doSave = async (nameToUse: string) => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await saveObservation(nameToUse, content, parseInt(selectedProjectId));
      setTitle(nameToUse);
      setSaveMessage(`Saved! ${res.tasks_created} tasks created.`);
      loadHistory();
    } catch (error) {
      setSaveMessage('Failed to save document');
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(''), 10000);
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    if (!selectedProjectId || selectedProjectId === 'all') {
      window.alert('Error: Please select a specific project before saving!');
      return;
    }

    // If title is still the default (manual paste/type, no uploaded file), ask for a name
    if (title === DEFAULT_TITLE) {
      setPendingDocName('');
      setShowNameModal(true);
      return;
    }

    doSave(title);
  };

  const handleNew = () => {
    setTitle('New Observation Document');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setObsCount(1);
    setSaveMessage('');
    setShowHistory(false);
  };

  const handleDeleteDoc = async (filename?: string) => {
    const targetDoc = filename || filteredHistory.find(d => d.filename.startsWith(title))?.filename;
    if (!targetDoc) return;
    
    if (window.confirm(`Are you sure you want to delete "${targetDoc.replace(/_proj\d+/, '').replace('.html', '')}"?`)) {
      try {
        await deleteObservationFile(targetDoc);
        setSaveMessage('Document deleted successfully.');
        loadHistory();
        if (targetDoc.startsWith(title)) {
          handleNew();
        }
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (err) {
        setSaveMessage('Failed to delete document.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
  };

  const handleRenameDoc = async (filename?: string) => {
    const targetDoc = filename || filteredHistory.find(d => d.filename.startsWith(title))?.filename;
    if (!targetDoc) return;
    
    const cleanName = targetDoc.replace(/_proj\d+\.html$/, '').replace(/\.html$/, '');
    const newName = window.prompt("Enter new document name:", cleanName);
    
    if (newName && newName.trim() !== cleanName) {
      try {
        const fullNewName = `${newName.trim()}_proj${selectedProjectId}.html`;
        await renameObservationFile(targetDoc, fullNewName);
        setSaveMessage('Document renamed successfully.');
        if (targetDoc.startsWith(title)) {
          setTitle(fullNewName); // Update local title state if we're renaming the active doc
        }
        loadHistory(); // Reload dropdown
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (err) {
        setSaveMessage('Failed to rename document.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }
  };

  const filteredHistory = history.filter(doc => {
    if (selectedProjectId === 'all') return true;
    return doc.filename.includes(`_proj${selectedProjectId}.html`);
  });

  return (
    <div className="w-full px-6 pt-2 pb-6 h-full flex flex-col">

      {/* Remove Tags Modal */}
      {showRemoveModal && (
        <div className="modal-overlay">
          <div className="modal-panel flex flex-col max-h-[80vh] overflow-hidden max-w-md w-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700">Remove Observations</h2>
              <button onClick={() => setShowRemoveModal(false)} className="p-1 text-slate-400 hover:text-red-500 rounded"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {obsInDoc.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No tags found in the current document.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Select tags to remove</span>
                    <button
                      onClick={() => {
                        if (selectedToRemove.length === obsInDoc.length) setSelectedToRemove([]);
                        else setSelectedToRemove([...obsInDoc]);
                      }}
                      className="text-xs text-indigo-600 font-medium hover:underline"
                    >
                      {selectedToRemove.length === obsInDoc.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {obsInDoc.map(num => (
                      <label key={num} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition ${selectedToRemove.includes(num) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          className="accent-red-500 cursor-pointer"
                          checked={selectedToRemove.includes(num)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedToRemove(prev => [...prev, num]);
                            else setSelectedToRemove(prev => prev.filter(n => n !== num));
                          }}
                        />
                        <span className={`text-sm font-medium ${selectedToRemove.includes(num) ? 'text-red-700' : 'text-slate-700'}`}>
                          Observation {num}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowRemoveModal(false)} className="btn-secondary py-1.5 px-4 text-sm">Cancel</button>
              <button 
                onClick={handleRemoveSelected} 
                disabled={selectedToRemove.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-4 rounded font-medium text-sm disabled:opacity-50 transition"
              >
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name Prompt Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Name Your Document
              </h3>
              <button onClick={() => setShowNameModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                You are about to save manually entered observations. Please provide a name for this document.
              </p>
              <input
                type="text"
                value={pendingDocName}
                onChange={(e) => setPendingDocName(e.target.value)}
                placeholder="e.g. Q3 Design Review"
                className="input w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pendingDocName.trim()) {
                    setShowNameModal(false);
                    doSave(pendingDocName.trim() + '.html');
                  }
                }}
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowNameModal(false)} className="btn-secondary py-1.5 px-4 text-sm">Cancel</button>
              <button 
                onClick={() => {
                  setShowNameModal(false);
                  doSave(pendingDocName.trim() + '.html');
                }} 
                disabled={!pendingDocName.trim()}
                className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        
        {/* Floating Notification Toast */}
        {saveMessage && (
          <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full shadow-lg text-sm font-medium transition-all ${saveMessage.includes('Error') || saveMessage.includes('Failed') ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {saveMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-3 border-b border-slate-200 pb-3 shrink-0">
          {/* Row 1: Selectors */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-sm font-medium">Project:</p>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  handleNew(); // Reset document when switching projects
                }}
                className={`input bg-white w-48 py-1.5 text-sm truncate ${selectedProjectId === 'all' ? 'border-orange-300 ring-1 ring-orange-200' : ''}`}
                title="Choose the project this document belongs to"
              >
                <option value="all">Select a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-6 bg-slate-200"></div>

            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-sm font-medium">Document:</p>
              <div className="flex items-center gap-1 relative">
                <button
                  type="button"
                  onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
                  disabled={selectedProjectId === 'all'}
                  className="input bg-white w-64 py-1.5 px-3 text-sm flex items-center justify-between disabled:opacity-50"
                  title="Select a saved document"
                >
                  <span className="truncate">
                    {filteredHistory.some(d => d.filename.startsWith(title)) 
                      ? `📄 ${filteredHistory.find(d => d.filename.startsWith(title))?.filename.replace(/_proj\d+\.html$/, '').replace(/\.html$/, '')}` 
                      : '+ Create New Document'}
                  </span>
                  <ChevronDown size={16} className="text-slate-500 shrink-0 ml-2" />
                </button>

                {/* Custom Dropdown Menu */}
                {isDocDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsDocDropdownOpen(false)} 
                    />
                    <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[60vh]">
                      <div className="py-1 border-b border-slate-100">
                        <button
                          onClick={() => { handleNew(); setIsDocDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-medium"
                        >
                          + Create New Document
                        </button>
                        <button
                          onClick={() => { handleUploadClick(); setIsDocDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 font-medium"
                        >
                          ⬆ Upload Document...
                        </button>
                      </div>
                      
                      {filteredHistory.length > 0 && (
                        <div className="flex-1 overflow-y-auto">
                          <div className="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                            Saved Documents
                          </div>
                          <div className="py-1">
                            {filteredHistory.map((doc, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 group"
                              >
                                <button
                                  className="flex-1 text-left px-2 py-1.5 text-sm truncate text-slate-700 hover:text-slate-900"
                                  onClick={() => { loadDocument(doc.filename); setIsDocDropdownOpen(false); }}
                                >
                                  📄 {doc.filename.replace(/_proj\d+\.html$/, '').replace(/\.html$/, '')}
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRenameDoc(doc.filename); }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Rename"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.filename); }}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Row 2: Actions */}
          <div className="flex items-center gap-3 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mr-1">
              <div className="flex bg-slate-200/60 p-1 rounded-md">
                <button onClick={handleUndo} title="Undo" className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-white shadow-sm transition"><Undo2 size={16} /></button>
                <button onClick={handleRedo} title="Redo" className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-white shadow-sm transition ml-1"><Redo2 size={16} /></button>
              </div>

              <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-md text-xs font-bold shadow-sm" title="Total observations currently in document">
                {obsCount - 1} {obsCount - 1 === 1 ? 'Observation' : 'Observations'}
              </span>

              <button
                onClick={openRemoveModal}
                disabled={selectedProjectId === 'all'}
                className="bg-white text-slate-700 border border-slate-300 px-3 py-1.5 text-sm rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap font-medium"
                title="Remove specific observations"
              >
                <Trash2 size={16} />
                Remove Observations
              </button>

              <button
                onClick={insertObservationTag}
                disabled={selectedProjectId === 'all'}
                className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm hover:bg-indigo-100 transition flex items-center justify-center shadow-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                title={`Insert Tag Observation ${obsCount}`}
              >
                📌 Tag Observation
              </button>
            </div>

            <div className="w-px h-6 bg-slate-300 mx-1"></div>

            {/* Hidden File Input */}
            <input
              type="file"
              accept=".docx,.html,.txt"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <button
              onClick={handleSave}
              disabled={isSaving || selectedProjectId === 'all'}
              className="btn-primary py-2 px-5 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold whitespace-nowrap ml-auto"
            >
              {isSaving ? 'Saving...' : 'Save & Extract Tasks'}
            </button>
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Editor Canvas */}
          <div
            ref={editorRef}
            contentEditable
            onClick={handleEditorClick}
            onPaste={(e) => {
              // Only intercept if they are pasting a pure image (like a screenshot)
              const items = e.clipboardData?.items;
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = items[i].getAsFile();
                    if (blob) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result;
                        if (base64) {
                          // Insert the image wrapped in a block, and ensure there's a clickable paragraph space before AND after it
                          const htmlToInsert = `
                            <p><br/></p>
                            <div style="margin: 1rem 0;">
                              <img src="${base64}" alt="Pasted Image" style="max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />
                            </div>
                            <p><br/></p>
                          `;
                          document.execCommand('insertHTML', false, htmlToInsert);
                        }
                      };
                      reader.readAsDataURL(blob);
                    }
                    return;
                  }
                }
              }
            }}
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
