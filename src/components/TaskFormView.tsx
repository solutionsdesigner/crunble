import React, { useState, useEffect } from 'react';
import { Task, Priority, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../utils/timezones';
import { DateTimePickerDropdown } from './DateTimePickerDropdown';
import { ArrowLeft, Check } from 'lucide-react';

interface TaskFormViewProps {
  initialTask?: Task | null;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

export const TaskFormView: React.FC<TaskFormViewProps> = ({
  initialTask,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(initialTask && initialTask.id);

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [priority, setPriority] = useState<Priority>('medium');
  const [recurrence, setRecurrence] = useState<DayOfWeek[]>([]);
  const [doNotAutomaticallySchedule, setDoNotAutomaticallySchedule] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialTask) {
      setName(initialTask.name || '');
      setDescription(initialTask.description || '');
      setStartTime(initialTask.startTime || '09:00');
      setEndTime(initialTask.endTime || '10:00');
      setPriority(initialTask.priority || 'medium');
      setRecurrence(initialTask.recurrence || []);
      setDoNotAutomaticallySchedule(Boolean(initialTask.doNotAutomaticallySchedule));
    } else {
      // Blank form for "Add New Task"
      setName('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('10:00');
      setPriority('medium');
      setRecurrence([]);
      setDoNotAutomaticallySchedule(false);
    }
    setError('');
  }, [initialTask]);

  const toggleDayRecurrence = (day: DayOfWeek) => {
    if (recurrence.includes(day)) {
      setRecurrence(recurrence.filter((d) => d !== day));
    } else {
      setRecurrence([...recurrence, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for the task.');
      return;
    }

    const newTask: Task = {
      id: initialTask?.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      priority,
      completed: initialTask?.completed || false,
      recurrence,
      doNotAutomaticallySchedule,
      updatedAt: new Date().toISOString(),
    };

    onSave(newTask);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#faf7f2] py-10 px-6 sm:px-12 text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>cancel and return to tasks</span>
          </button>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a]">
            {isEditing ? 'Edit Task' : 'Add New Task'}
          </h1>
          <p className="text-xs text-[#6b6b6b] mt-1 tracking-wide">
            {isEditing
              ? 'Update the task parameters, schedule timings, and recurrences.'
              : 'Enter details to schedule a new task in the daily itinerary.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-xs text-red-700 underline underline-offset-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Field labeled: name of task (underlined field) */}
          <div>
            <label htmlFor="task-name" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-1">
              name of task
            </label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. System Architecture Review"
              required
              className="w-full py-2.5 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#a3a3a3] text-base font-normal outline-none focus:border-[#1a1a1a] transition-colors"
            />
          </div>

          {/* Field for description (underlined field) */}
          <div>
            <label htmlFor="task-description" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-1">
              description
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the task assigned to this time..."
              className="w-full py-2.5 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#a3a3a3] text-sm leading-relaxed outline-none focus:border-[#1a1a1a] resize-y transition-colors font-light"
            />
          </div>

          {/* Start Time & End Time in two fields with calendar dropdown & time picker above */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <DateTimePickerDropdown
              id="start-time-picker"
              label="start time"
              value={startTime}
              onChange={setStartTime}
              placeholder="09:00"
              required
            />

            <DateTimePickerDropdown
              id="end-time-picker"
              label="end time"
              value={endTime}
              onChange={setEndTime}
              placeholder="10:00"
              required
            />
          </div>

          {/* Priority Level Dropdown (low, medium, high) */}
          <div>
            <label htmlFor="priority-select" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-1">
              priority level
            </label>
            <select
              id="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full py-2.5 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] text-sm outline-none cursor-pointer focus:border-[#1a1a1a]"
            >
              <option value="low" className="bg-[#faf7f2] text-[#1a1a1a]">
                Low Priority
              </option>
              <option value="medium" className="bg-[#faf7f2] text-[#1a1a1a]">
                Medium Priority
              </option>
              <option value="high" className="bg-[#faf7f2] text-[#1a1a1a]">
                High Priority
              </option>
            </select>
          </div>

          {/* Option to assign recurrences by selecting a checkbox for each day */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-3">
              assign recurrences (select days of week)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = recurrence.includes(day);
                return (
                  <label
                    key={day}
                    className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#1a1a1a] py-1 hover:opacity-75 transition-opacity"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDayRecurrence(day)}
                      className="w-4 h-4 accent-[#1a1a1a] bg-transparent cursor-pointer"
                    />
                    <span className={isSelected ? 'font-medium underline underline-offset-2' : 'text-[#6b6b6b]'}>
                      {day}
                    </span>
                  </label>
                );
              })}
            </div>
            {recurrence.length > 0 && (
              <p className="text-[11px] text-[#6b6b6b] mt-2">
                This task repeats weekly on: {recurrence.join(', ')}
              </p>
            )}
          </div>

          {/* Checkbox labeled: Do not automatically schedule */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={doNotAutomaticallySchedule}
                onChange={(e) => setDoNotAutomaticallySchedule(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#1a1a1a] bg-transparent cursor-pointer"
              />
              <div>
                <span className="text-sm font-normal text-[#1a1a1a] underline underline-offset-4">
                  Do not automatically schedule
                </span>
                <p className="text-xs text-[#6b6b6b] mt-1 font-light">
                  Selecting this prevents the AI from moving the time for the task.
                </p>
              </div>
            </label>
          </div>

          {/* Submit button at the bottom of the page that adds the task to the itinerary */}
          <div className="pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-[#1a1a1a] hover:opacity-75 underline underline-offset-6 transition-opacity font-medium inline-flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? 'submit updated task' : 'submit task to itinerary'}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors"
            >
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
