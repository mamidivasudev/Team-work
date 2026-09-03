import { useEffect, useRef, useState } from 'react';
import { Paperclip, Trash2, Upload, FileText } from 'lucide-react';
import type { TaskAttachment } from '../../types';
import { getTaskAttachments, uploadTaskAttachment, deleteTaskAttachment, getAttachmentDownloadUrl } from '../../services/api';

interface TaskAttachmentsPanelProps {
  taskId: number;
  isAdmin: boolean;
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TaskAttachmentsPanel = ({ taskId, isAdmin }: TaskAttachmentsPanelProps) => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => getTaskAttachments(taskId).then(setAttachments).catch(() => setAttachments([]));

  useEffect(() => { load(); }, [taskId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadTaskAttachment(taskId, file);
      load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: number) => {
    await deleteTaskAttachment(attachmentId);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0 flex items-center gap-1.5">
          <Paperclip size={14} /> Attachments
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-indigo-600 hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload file'}
        </button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </div>
      <div className="space-y-1.5">
        {attachments.length === 0 ? (
          <p className="text-xs text-slate-400">No attachments.</p>
        ) : (
          attachments.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
              <a
                href={getAttachmentDownloadUrl(a.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-700 hover:text-indigo-600 min-w-0"
              >
                <FileText size={14} className="shrink-0 text-slate-400" />
                <span className="truncate">{a.original_name}</span>
                <span className="text-slate-400 shrink-0">{formatSize(a.file_size)}</span>
              </a>
              {isAdmin && (
                <button type="button" onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskAttachmentsPanel;
