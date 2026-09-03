import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';
import { statusStyles, isOverdue } from './taskStyles';

interface TaskCalendarProps {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const TaskCalendar = ({ tasks, onOpenTask }: TaskCalendarProps) => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const tasksWithDueDate = tasks.filter(t => t.due_date);
  const tasksForDay = (day: Date) => tasksWithDueDate.filter(t => sameDay(new Date(t.due_date as string), day));

  const today = new Date();

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date())} className="btn-secondary text-xs px-3 py-1.5">Today</button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
        {WEEKDAYS.map(w => (
          <div key={w} className="bg-slate-50 text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wide">
            {w}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayTasks = tasksForDay(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = sameDay(day, today);
          return (
            <div key={idx} className={`bg-white min-h-[100px] p-1.5 ${!inMonth ? 'bg-slate-50/50' : ''}`}>
              <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? 'bg-indigo-600 text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTask(t)}
                    title={t.title}
                    className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate block ${
                      isOverdue(t) ? 'bg-red-100 text-red-700 font-semibold' : statusStyles[t.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-slate-400 px-1.5">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskCalendar;
