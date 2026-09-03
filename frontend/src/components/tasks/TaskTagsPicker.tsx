import { useState } from 'react';
import { Plus, Tag as TagIcon } from 'lucide-react';
import type { Tag } from '../../types';
import { createTag } from '../../services/api';

interface TaskTagsPickerProps {
  allTags: Tag[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  onTagCreated: (tag: Tag) => void;
  isAdmin: boolean;
}

const TaskTagsPicker = ({ allTags, selectedTagIds, onChange, onTagCreated, isAdmin }: TaskTagsPickerProps) => {
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleTag = (tagId: number) => {
    if (!isAdmin) return;
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await createTag(name);
      onTagCreated(tag);
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <TagIcon size={14} /> Tags
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {allTags.length === 0 && <p className="text-xs text-slate-400">No tags yet.</p>}
        {allTags.map(tag => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              disabled={!isAdmin}
              className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:cursor-default"
              style={selected
                ? { backgroundColor: tag.color, color: 'white', borderColor: tag.color }
                : { backgroundColor: tag.color + '15', color: tag.color, borderColor: tag.color + '40' }
              }
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
            placeholder="New tag name..."
            className="input py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={creating || !newTagName.trim()}
            className="btn-secondary px-3 py-1.5"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskTagsPicker;
