import React, { useState } from 'react';
import { Task, TimeZoneOption } from '../types';
import { formatDisplayTime } from '../utils/timezones';
import { X, Sparkles, Loader2, Clock, Calendar } from 'lucide-react';

interface RescheduleModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (task: Task, updatedTask: Task, rationale: string) => void;
  currentDate: string;
  currentTimeZone: TimeZoneOption;
}

const EXAMPLE_INSTRUCTIONS = [
  'reschedule to later in my day',
  'reschedule to tomorrow',
  'set to recur on mondays',
  'remove recurrence',
];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirmReschedule,
  currentDate,
  currentTimeZone,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) {
      setError('Please provide an instruction for how to reschedule this task.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/task/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          instruction: instruction.trim(),
          currentDate,
          currentTime: new Intl.DateTimeFormat('en-GB', {
            timeZone: currentTimeZone.iana,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date()),
          timezone: currentTimeZone.iana,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to reschedule task.');
      }

      const data = await response.json();
      if (data.success && data.task) {
        onConfirmReschedule(task, data.task, data.rationale || 'Task updated by AI.');
        onClose();
        setInstruction('');
      } else {
        throw new Error('AI could not complete the reschedule request.');
      }
    } catch (err: any) {
      console.error('Error rescheduling task:', err);
      setError(err.message || 'An error occurred while rescheduling.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-3 sm:p-6 flex items-start sm:items-center justify-center overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-[#faf7f2] border border-[#1a1a1a] p-5 sm:p-8 text-[#1a1a1a] relative my-4 sm:my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] overflow-y-auto shadow-none overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with X Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors p-1.5 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#6b6b6b] mb-1 font-mono-nums">
            <Sparkles className="w-3.5 h-3.5 text-[#1a1a1a]" />
            <span>AI Task Rescheduler</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[#1a1a1a]">
            Reschedule Task
          </h2>
          <p className="text-xs text-[#6b6b6b] mt-1">
            Specify how you would like AI to adjust the timing, date, or recurrence for this task.
          </p>
        </div>

        {/* Active Task Info Card */}
        <div className="mb-6 p-3.5 bg-[#f3efe8] border-l-2 border-[#1a1a1a] text-xs">
          <div className="font-medium text-sm text-[#1a1a1a] mb-1 truncate">{task.name}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#6b6b6b]">
            <span className="inline-flex items-center gap-1 font-mono-nums">
              <Clock className="w-3 h-3 text-[#1a1a1a]" />
              {formatDisplayTime(task.startTime)} — {formatDisplayTime(task.endTime)}
            </span>
            {task.date && (
              <span className="inline-flex items-center gap-1 font-mono-nums">
                <Calendar className="w-3 h-3 text-[#1a1a1a]" />
                {task.date}
              </span>
            )}
            {task.recurrence && task.recurrence.length > 0 && (
              <span>Recurs: {task.recurrence.map((r) => r.slice(0, 3)).join(', ')}</span>
            )}
          </div>
        </div>

        {/* Instruction Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reschedule-instruction" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-2 font-mono-nums">
              Instruction
            </label>
            <input
              id="reschedule-instruction"
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. reschedule to later in my day"
              disabled={isLoading}
              className="w-full bg-transparent border-b border-[#1a1a1a] py-2 text-sm text-[#1a1a1a] placeholder-[#8c8c8c] focus:outline-hidden focus:border-b-2"
              autoFocus
            />
          </div>

          {/* Quick Example Suggestions */}
          <div>
            <div className="text-[11px] text-[#6b6b6b] uppercase tracking-wider mb-2 font-mono-nums">
              Example Instructions:
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_INSTRUCTIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setInstruction(example)}
                  disabled={isLoading}
                  className="text-xs bg-[#ede8df] hover:bg-[#e2ddd3] text-[#1a1a1a] px-2.5 py-1.5 underline underline-offset-2 transition-colors text-left"
                >
                  “{example}”
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2.5 border border-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !instruction.trim()}
              className="w-full bg-[#1a1a1a] hover:bg-black text-[#faf7f2] py-2.5 px-4 text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Rescheduling with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reschedule Task</span>
                </>
              )}
            </button>
          </div>

          {/* Required Language Under the Submit Button */}
          <p className="text-[11px] text-[#6b6b6b] leading-relaxed pt-1 font-light border-t border-[#e2ddd3]">
            AI will automatically assign times for each task, overwriting any times inputted for a task, and providing that the AI may provide inaccurate results, the results must be reviewed by the user, the user is responsible for the results, and the user should not submit any confidential, sensitive, private, or biometric information.
          </p>
        </form>
      </div>
    </div>
  );
};
