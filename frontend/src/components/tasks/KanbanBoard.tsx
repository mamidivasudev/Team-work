import { DndContext, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { CalendarClock } from 'lucide-react';
import type { Task, Project } from '../../types';
import { priorityStyles, statusLabels, KANBAN_STATUSES, isOverdue } from './taskStyles';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: number, status: string) => void;
}

const columnHeaderStyles: Record<string, string> = {
  TODO: 'text-slate-500',
  IN_PROGRESS: 'text-blue-600',
  REVIEW: 'text-purple-600',
  BLOCKED: 'text-red-600',
  COMPLETED: 'text-green-600',
};

const avatarColors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

const KanbanCard = ({ task, projectName, onOpenTask }: { task: Task; projectName: string; onOpenTask: (task: Task) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpenTask(task)}
      className={`card p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
      <p className="text-xs text-slate-400 mt-1 truncate">{projectName}</p>
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map(tag => (
            <span key={tag.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color + '20', color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className={`badge ${priorityStyles[task.priority] || 'bg-slate-100 text-slate-600'}`}>{task.priority}</span>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] ${isOverdue(task) ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
              {isOverdue(task) && <CalendarClock size={11} />}
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 2).map((a, idx) => (
                <div key={a.id} title={a.name} className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white ${avatarColors[idx % avatarColors.length]}`}>
                  {a.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tasks, projects, onOpenTask }: { status: string; tasks: Task[]; projects: Project[]; onOpenTask: (task: Task) => void }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || '—';

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50 rounded-xl border p-3 flex flex-col min-h-[400px] transition-colors ${isOver ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200'}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={`text-xs font-bold uppercase tracking-wide ${columnHeaderStyles[status]}`}>{statusLabels[status]}</h3>
        <span className="text-xs font-semibold text-slate-400 bg-white border border-slate-200 rounded-full px-1.5 py-0.5">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-300 text-center py-8">No tasks</p>
        ) : (
          tasks.map(t => <KanbanCard key={t.id} task={t} projectName={getProjectName(t.project_id)} onOpenTask={onOpenTask} />)
        )}
      </div>
    </div>
  );
};

const KanbanBoard = ({ tasks, projects, onOpenTask, onStatusChange }: KanbanBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as string;
    const taskId = active.id as number;
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {KANBAN_STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            projects={projects}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
