import React from 'react';
import { Task } from '../types';
import { formatDisplayTime } from '../utils/timezones';
import { Plus, Sparkles, Loader2, Trash2, Edit3, ArrowLeft, RotateCcw, Lock, Clock } from 'lucide-react';

interface TaskTableViewProps {
  isCompletedView: boolean;
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onReschedule: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddTask: () => void;
  onAutoSchedule: () => Promise<void>;
  onUndoSchedule?: () => void;
  canUndo?: boolean;
  isScheduling: boolean;
  onBackToTimeline: () => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  isCompletedView,
  tasks,
  onToggleComplete,
  onEdit,
  onReschedule,
  onDelete,
  onAddTask,
  onAutoSchedule,
  onUndoSchedule,
  canUndo = false,
  isScheduling,
  onBackToTimeline,
}) => {
  const displayedTasks = tasks.filter((t) => (isCompletedView ? t.completed : !t.completed));

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#faf7f2] py-8 px-4 sm:px-12 text-[#1a1a1a]">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb / Back link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onBackToTimeline}
            className="text-xs text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>back to timeline</span>
          </button>
        </div>

        {/* View Title */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a]">
              {isCompletedView ? 'Completed Tasks' : 'Update Tasks'}
            </h1>
            <p className="text-xs text-[#6b6b6b] mt-1 tracking-wide">
              {isCompletedView
                ? 'Tasks marked complete. Unchecking returns them to active tasks.'
                : 'Manage, edit, reschedule, or reorder itinerary tasks.'}
            </p>
          </div>

          {/* Above the table is an add task page link / button */}
          {!isCompletedView && (
            <button
              type="button"
              onClick={onAddTask}
              className="text-xs uppercase tracking-wider text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 transition-opacity inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Task</span>
            </button>
          )}
        </div>

        {/* Task Table: Description removed, Done column moved to the LAST column */}
        {displayedTasks.length === 0 ? (
          <div className="py-20 text-center border-b border-[#d4d0c8]">
            <p className="text-sm text-[#6b6b6b] mb-4">
              {isCompletedView
                ? 'No completed tasks yet. Completed items will appear here.'
                : 'No active tasks found in the itinerary.'}
            </p>
            {!isCompletedView && (
              <button
                type="button"
                onClick={onAddTask}
                className="text-xs uppercase tracking-wider text-[#1a1a1a] underline underline-offset-4 hover:opacity-75"
              >
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-[#1a1a1a] text-[11px] uppercase tracking-wider text-[#6b6b6b]">
                  <th className="py-3 pr-4 font-normal">Name</th>
                  <th className="py-3 pr-4 font-normal w-20 sm:w-28">Priority</th>
                  <th className="py-3 pr-4 font-normal w-28 sm:w-40">Schedule</th>
                  <th className="py-3 pr-4 font-normal w-24 sm:w-28 text-right">Actions</th>
                  {/* Done column is the LAST column */}
                  <th className="py-3 pl-4 font-normal w-12 text-center">Done</th>
                </tr>
              </thead>
              <tbody>
                {displayedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[#e3dfd7] transition-colors hover:bg-[#f4efe5]"
                  >
                    {/* 1. Name only (description removed to eliminate horizontal overflow) */}
                    <td className="py-3.5 pr-4 align-middle">
                      <div className="font-normal text-sm text-[#1a1a1a]">
                        <span className={task.completed ? 'line-through text-[#6b6b6b]' : ''}>
                          {task.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8c8c8c] mt-0.5">
                        {task.recurrence && task.recurrence.length > 0 && (
                          <span>
                            {task.recurrence.map((r) => r.slice(0, 3)).join(', ')}
                          </span>
                        )}
                        {task.doNotAutomaticallySchedule && (
                          <span className="inline-flex items-center gap-1 text-[#1a1a1a]">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Fixed</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Priority Level */}
                    <td className="py-3.5 pr-4 align-middle">
                      <span className="text-xs font-normal capitalize text-[#1a1a1a]">
                        {task.priority}
                      </span>
                    </td>

                    {/* 3. Schedule Time */}
                    <td className="py-3.5 pr-4 align-middle font-mono-nums text-xs text-[#1a1a1a] whitespace-nowrap">
                      <div>{formatDisplayTime(task.startTime)}</div>
                      <div className="text-[#6b6b6b] text-[11px]">to {formatDisplayTime(task.endTime)}</div>
                    </td>

                    {/* 4. Actions: Edit, Reschedule & Delete */}
                    <td className="py-3.5 pr-4 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => onEdit(task)}
                          className="text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 transition-opacity inline-flex items-center gap-1"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReschedule(task)}
                          className="text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 transition-opacity inline-flex items-center gap-1"
                          title="Reschedule Task with AI"
                        >
                          <Clock className="w-3 h-3" />
                          <span>reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(task)}
                          className="text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>delete</span>
                        </button>
                      </div>
                    </td>

                    {/* 5. Complete Checkbox: LAST COLUMN */}
                    <td className="py-3.5 pl-4 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleComplete(task)}
                        aria-label={`Mark "${task.name}" as ${task.completed ? 'incomplete' : 'complete'}`}
                        className="w-4 h-4 accent-[#1a1a1a] cursor-pointer bg-transparent"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Below the table: automatically schedule tasks button AND adjacent undo button */}
        {!isCompletedView && (
          <div className="mt-10 pt-6 border-t border-[#1a1a1a]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={onAutoSchedule}
                  disabled={isScheduling || displayedTasks.length === 0}
                  className="text-xs uppercase tracking-wider text-[#1a1a1a] hover:opacity-75 underline underline-offset-6 transition-opacity inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling tasks with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>automatically schedule tasks</span>
                    </>
                  )}
                </button>

                {canUndo && (
                  <button
                    type="button"
                    onClick={onUndoSchedule}
                    className="text-xs uppercase tracking-wider text-[#1a1a1a] hover:opacity-75 underline underline-offset-6 transition-opacity inline-flex items-center gap-1.5 font-medium animate-in fade-in duration-200"
                    title="Revert task times to state prior to automatic scheduling"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>undo schedule</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-[#6b6b6b]">
                {displayedTasks.length} active tasks in itinerary
              </span>
            </div>

            {/* Mandatory User Notice */}
            <p className="text-xs text-[#6b6b6b] leading-relaxed max-w-3xl font-light">
              AI will automatically assign times for each task, overwriting any times inputted for a task, and providing that the AI may provide inaccurate results, the results must be reviewed by the user, the user is responsible for the results, and the user should not submit any confidential, sensitive, private, or biometric information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
