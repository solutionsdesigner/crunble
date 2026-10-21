import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Task, TimeZoneOption } from '../types';
import { formatDisplayTime, parseTimeToMinutes, getDayOfWeekName } from '../utils/timezones';
import { ArrowUpRight } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  currentTimeZone: TimeZoneOption;
  onEditTask: (task: Task) => void;
  onRescheduleTask?: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onGoToUpdateTasks: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  selectedDate,
  currentTimeZone,
  onEditTask,
  onRescheduleTask,
  onToggleComplete,
  onGoToUpdateTasks,
}) => {
  const dayOfWeek = getDayOfWeekName(selectedDate);

  const dayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.date && t.date === selectedDate) return true;
        if (t.recurrence && t.recurrence.includes(dayOfWeek)) return true;
        if (!t.date && (!t.recurrence || t.recurrence.length === 0)) return true;
        return false;
      })
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [tasks, selectedDate, dayOfWeek]);

  // Determine current minute of the day in user's selected timezone
  const nowInMinutes = useMemo(() => {
    try {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: currentTimeZone.iana,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
      return h * 60 + m;
    } catch {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }
  }, [currentTimeZone]);

  // The task index that corresponds to the CURRENT CLOCK TIME
  const currentTimeTaskIndex = useMemo(() => {
    if (dayTasks.length === 0) return -1;

    const match = dayTasks.findIndex((t) => {
      const s = parseTimeToMinutes(t.startTime);
      const e = parseTimeToMinutes(t.endTime);
      return nowInMinutes >= s && nowInMinutes <= e;
    });
    if (match !== -1) return match;

    const upcoming = dayTasks.findIndex((t) => parseTimeToMinutes(t.startTime) > nowInMinutes);
    if (upcoming !== -1) return upcoming;

    return 0;
  }, [dayTasks, nowInMinutes]);

  // Continuous floating progress index: 0.0 -> 0.35 -> 1.0 -> 2.0
  const [progress, setProgress] = useState<number>(() => {
    return currentTimeTaskIndex >= 0 ? currentTimeTaskIndex : 0;
  });

  const progressRef = useRef<number>(currentTimeTaskIndex >= 0 ? currentTimeTaskIndex : 0);
  const targetProgressRef = useRef<number>(currentTimeTaskIndex >= 0 ? currentTimeTaskIndex : 0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Jump smoothly to current time task on initial load or date change
  useEffect(() => {
    if (currentTimeTaskIndex >= 0) {
      animateToTarget(currentTimeTaskIndex, 400);
    }
  }, [currentTimeTaskIndex, selectedDate]);

  // Physics animation engine with cubic ease-out deceleration
  const animateToTarget = (toIndex: number, durationMs = 450) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const startVal = progressRef.current;
    const endVal = Math.max(0, Math.min(dayTasks.length - 1, toIndex));
    targetProgressRef.current = endVal;

    if (Math.abs(endVal - startVal) < 0.001) {
      progressRef.current = endVal;
      setProgress(endVal);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);

      // Smooth cubic-bezier ease-out curve (gracefully slowing down as next task arrives)
      const ease = 1 - Math.pow(1 - t, 3);
      const nextVal = startVal + (endVal - startVal) * ease;

      progressRef.current = nextVal;
      setProgress(nextVal);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        progressRef.current = endVal;
        setProgress(endVal);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  // Continuous touch and wheel gestures
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartProgress = useRef<number>(0);
  const touchLastY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const touchVelocities = useRef<{ y: number; time: number }[]>([]);

  // Vertical spacing between task nodes
  const SLOT_SPACING = 136;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelIdleTimer: any = null;

    // Fluid momentum step function for wheel tracking
    const runFluidWheelStep = () => {
      if (animFrameRef.current) return;

      const step = () => {
        const diff = targetProgressRef.current - progressRef.current;
        if (Math.abs(diff) > 0.001) {
          // Exponential decay lerp: silky smooth deceleration on every frame
          const nextVal = progressRef.current + diff * 0.20;
          progressRef.current = nextVal;
          setProgress(nextVal);
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          progressRef.current = targetProgressRef.current;
          setProgress(targetProgressRef.current);
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    };

    // Touch Event Handlers
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);

      const clientY = e.touches[0].clientY;
      touchStartY.current = clientY;
      touchLastY.current = clientY;
      touchStartTime.current = performance.now();
      touchStartProgress.current = progressRef.current;
      targetProgressRef.current = progressRef.current;
      touchVelocities.current = [{ y: clientY, time: performance.now() }];
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || e.touches.length !== 1) return;
      const clientY = e.touches[0].clientY;
      const deltaY = touchStartY.current - clientY; // upward drag = scroll down = progress increases

      touchVelocities.current.push({ y: clientY, time: performance.now() });
      if (touchVelocities.current.length > 5) {
        touchVelocities.current.shift();
      }

      // Continuous 1:1 real-time drag tracking
      const newProgress = touchStartProgress.current + deltaY / SLOT_SPACING;

      // Soft rubber-band damping at boundaries
      let clamped = newProgress;
      if (newProgress < 0) {
        clamped = newProgress * 0.25;
      } else if (newProgress > dayTasks.length - 1) {
        const over = newProgress - (dayTasks.length - 1);
        clamped = dayTasks.length - 1 + over * 0.25;
      }

      progressRef.current = clamped;
      targetProgressRef.current = clamped;
      setProgress(clamped);
      touchLastY.current = clientY;
    };

    const onTouchEnd = () => {
      if (touchStartY.current === null) return;

      // Calculate recent release velocity
      let velocity = 0;
      if (touchVelocities.current.length >= 2) {
        const first = touchVelocities.current[0];
        const last = touchVelocities.current[touchVelocities.current.length - 1];
        const dt = last.time - first.time;
        if (dt > 10) {
          velocity = (first.y - last.y) / dt; // px/ms
        }
      }

      const curr = progressRef.current;
      let target = Math.round(curr);

      // Launch momentum detection:
      // If user flings fast up or down, launch through multiple tasks!
      if (Math.abs(velocity) > 0.45) {
        let launchSteps = 1;
        if (Math.abs(velocity) > 1.6) {
          launchSteps = 3;
        } else if (Math.abs(velocity) > 0.9) {
          launchSteps = 2;
        }
        const signedSteps = velocity > 0 ? launchSteps : -launchSteps;
        target = Math.round(curr + signedSteps);
      } else {
        const frac = curr - Math.floor(curr);
        if (velocity > 0.1 || frac > 0.45) {
          target = Math.ceil(curr);
        } else if (velocity < -0.1 || frac < 0.55) {
          target = Math.floor(curr);
        }
      }

      target = Math.max(0, Math.min(dayTasks.length - 1, target));
      const dist = Math.abs(target - curr);
      const duration = Math.min(650, Math.max(350, dist * 220));

      animateToTarget(target, duration);
      touchStartY.current = null;
    };

    // Continuous Wheel / Trackpad Handling
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1.5) return;
      e.preventDefault();

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 20; // lines
      else if (e.deltaMode === 2) dy *= 300; // pages

      // Sensitivity: smooth responsive step
      const deltaProg = dy / 180;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      targetProgressRef.current = Math.max(
        -0.2,
        Math.min(dayTasks.length - 0.8, targetProgressRef.current + deltaProg)
      );

      runFluidWheelStep();

      // Settle gently to nearest task when user finishes scrolling
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
      wheelIdleTimer = setTimeout(() => {
        const curr = progressRef.current;
        let snap = Math.round(curr);
        snap = Math.max(0, Math.min(dayTasks.length - 1, snap));
        animateToTarget(snap, 400);
      }, 140);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        const next = Math.min(dayTasks.length - 1, Math.round(progressRef.current) + 1);
        animateToTarget(next, 400);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        const prev = Math.max(0, Math.round(progressRef.current) - 1);
        animateToTarget(prev, 400);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (wheelIdleTimer) clearTimeout(wheelIdleTimer);
    };
  }, [dayTasks.length]);

  const nearestIndex = Math.max(0, Math.min(dayTasks.length - 1, Math.round(progress)));

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className="w-full flex-1 flex flex-col justify-between px-4 sm:px-10 select-none overflow-hidden pt-1 pb-1 relative"
    >
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between overflow-hidden relative">
        {/* Subtle stepper control */}
        {dayTasks.length > 0 && (
          <div className="pt-1 pb-1 flex items-center justify-end text-[11px] text-[#6b6b6b] gap-3 flex-shrink-0 z-20">
            <span className="font-mono-nums">
              {nearestIndex + 1} of {dayTasks.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={nearestIndex === 0}
                onClick={() => animateToTarget(nearestIndex - 1, 400)}
                className="underline underline-offset-4 disabled:opacity-30 disabled:no-underline text-[#1a1a1a]"
              >
                previous
              </button>
              <button
                type="button"
                disabled={nearestIndex >= dayTasks.length - 1}
                onClick={() => animateToTarget(nearestIndex + 1, 400)}
                className="underline underline-offset-4 disabled:opacity-30 disabled:no-underline text-[#1a1a1a]"
              >
                next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {dayTasks.length === 0 ? (
          <div className="py-20 text-center my-auto">
            <p className="text-sm text-[#6b6b6b] mb-4">No tasks scheduled for this date.</p>
            <button
              type="button"
              onClick={onGoToUpdateTasks}
              className="text-xs uppercase tracking-wider text-[#1a1a1a] underline underline-offset-4 hover:opacity-75 transition-opacity"
            >
              Add Tasks to Itinerary
            </button>
          </div>
        ) : (
          /* CONTINUOUS REEL TIMELINE:
             - Continuous vertical faded line throughout entire height
             - Previous point: faded dot + previous task name above active task
             - Active point: circle (with ring if current time task) + full details in center
             - Next point: faded dot + next task name below active task
             - All transitions are 100% continuous mathematical curves with NO DOM swapping or jumping! */
          <div className="relative flex-1 w-full overflow-hidden">
            {/* Continuous Vertical Faded Line connecting all tasks */}
            <div
              className="absolute left-[20px] -translate-x-[0.75px] top-6 bottom-6 w-[1.5px] bg-[#d4d0c8] z-0 pointer-events-none"
            />

            {/* Continuous Task Track: Every task slides smoothly on Y axis */}
            <div className="relative w-full h-full">
              {dayTasks.map((task, idx) => {
                // Distance in task units from the active center (0 = center, -1 = previous, +1 = next)
                const delta = idx - progress;
                const dist = Math.abs(delta);

                // Render items within visible range; rowOpacity reaches 0 at dist = 2.0 so unmounting is invisible
                if (delta < -2.4 || delta > 2.4) return null;

                // Continuous pixel translation Y:
                // Active task shifts upward into the open blank space so it never collides with content below,
                // while faded content above (delta <= -1) and below (delta >= 1) DOES NOT move (activeShift = 0).
                const activeT = Math.max(0, 1.0 - dist);
                const activeCurve = activeT * activeT * (3 - 2 * activeT); // smoothstep
                const activeShift = -48 * activeCurve;
                const translateY = delta * SLOT_SPACING + activeShift;

                // Continuous row opacity: 1.0 when active at center, 0.42 when in previous or next slot, 0 at edges
                const rowOpacity = dist <= 1.0
                  ? 1.0 - dist * 0.58
                  : Math.max(0, 0.42 * (1.0 - (dist - 1.0)));

                // Task name opacity: 1.0 at center, 0.42 in adjacent slots, 0 at edges
                const nameOpacity = dist <= 1.0
                  ? 1.0 - dist * 0.58
                  : Math.max(0, 0.42 * (1.0 - (dist - 1.0)));

                // Details opacity: smoothstep dissolve between dist 0 and dist 0.75
                const detailsT = Math.max(0, Math.min(1.0, 1.0 - dist / 0.75));
                const detailsOpacity = detailsT * detailsT * (3 - 2 * detailsT);

                // Continuous dot radius: 6.5px at center, 4.5px in adjacent slots
                const dotR = 4.5 + Math.max(0, 1.0 - dist) * 2.0;

                const isCurrentTimeTask = idx === currentTimeTaskIndex;
                const ringR = 15.5 + Math.max(0, 1.0 - dist) * 1.5;
                const ringOpacity = Math.max(0, 1.0 - dist * 0.5);

                const isCentered = dist < 0.4;
                const isPast = delta < -0.3;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (!isCentered) {
                        animateToTarget(idx, 400);
                      }
                    }}
                    style={{
                      top: 'calc(50% - 20px)',
                      transform: `translate3d(0, ${translateY}px, 0)`,
                      opacity: rowOpacity,
                      willChange: 'transform, opacity',
                    }}
                    className={`absolute left-0 right-0 flex items-start cursor-pointer select-none ${
                      isCentered ? 'z-10' : 'z-0'
                    }`}
                  >
                    {/* Left Node: Circle at x = 20px on the continuous line */}
                    <div className="relative w-10 flex flex-col items-center mr-5 sm:mr-8 flex-shrink-0">
                      <div className="w-10 h-10 flex items-center justify-center z-10">
                        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
                          {isCurrentTimeTask ? (
                            <>
                              {/* Concentric outer ring ONLY for current clock time task */}
                              <circle
                                cx="20"
                                cy="20"
                                r={ringR}
                                stroke="#1a1a1a"
                                strokeWidth="1.5"
                                strokeOpacity={ringOpacity}
                              />
                              <circle cx="20" cy="20" r={dotR} fill="#1a1a1a" />
                            </>
                          ) : (
                            /* Regular tasks: dot smoothly grows from 4.5 to 6.5 as it centers */
                            <circle
                              cx="20"
                              cy="20"
                              r={dotR}
                              fill="#1a1a1a"
                            />
                          )}
                        </svg>
                      </div>
                    </div>

                    {/* Right Column: Title is locked at the baseline, details dissolve underneath */}
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Headline Row: 40px height to perfectly match the 40px SVG node! */}
                      <div className="h-10 flex items-center">
                        <h2
                          style={{ opacity: nameOpacity }}
                          className={`text-sm sm:text-lg font-normal tracking-tight text-[#1a1a1a] truncate max-w-xl ${
                            task.completed && isPast ? 'line-through text-[#6b6b6b]' : ''
                          }`}
                        >
                          {task.name}
                        </h2>
                      </div>

                      {/* Details Section: Positioned BELOW the title, so fading in/out NEVER shifts the title or dot */}
                      <div
                        style={{
                          opacity: detailsOpacity,
                          transform: `translate3d(0, ${(1 - detailsOpacity) * 5}px, 0)`,
                          pointerEvents: detailsOpacity > 0.6 ? 'auto' : 'none',
                          visibility: detailsOpacity < 0.01 ? 'hidden' : 'visible',
                        }}
                        className="pb-2"
                      >
                        {/* Timings line: Dissolves into view smoothly as task centers */}
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                          <span className="font-mono-nums text-xs sm:text-sm font-medium tracking-wide text-[#1a1a1a]">
                            {formatDisplayTime(task.startTime)} — {formatDisplayTime(task.endTime)}
                          </span>

                          {isCurrentTimeTask && (
                            <span className="text-[11px] font-normal tracking-wide text-[#1a1a1a] uppercase">
                              · Current Task
                            </span>
                          )}

                          <span className="text-[11px] text-[#6b6b6b] tracking-wider uppercase">
                            · {task.priority} priority
                          </span>

                          {task.completed && (
                            <span className="text-[11px] text-[#6b6b6b] tracking-wider uppercase">
                              · Completed
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs sm:text-sm text-[#383838] leading-snug sm:leading-relaxed max-w-2xl mb-1.5 font-light">
                            {task.description}
                          </p>
                        )}

                        {/* Recurrence & Actions */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6b6b6b] pt-0.5">
                          {task.recurrence && task.recurrence.length > 0 && (
                            <span className="text-[11px] text-[#6b6b6b]">
                              Recurs: {task.recurrence.map((r) => r.slice(0, 3)).join(', ')}
                            </span>
                          )}

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(task);
                              }}
                              className="text-[#1a1a1a] hover:opacity-70 underline underline-offset-4 transition-opacity"
                            >
                              {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Edit</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>

                            {onRescheduleTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRescheduleTask(task);
                                }}
                                className="text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1"
                              >
                                <span>Reschedule</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
