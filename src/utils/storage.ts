import { Task } from '../types';

const PRIMARY_STORAGE_KEY = 'cronble_timeline_tasks_v1';
const LEGACY_STORAGE_KEY = 'chronos_timeline_tasks_v1';

export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Morning Architecture Briefing & Roadmap Alignment',
    description: 'Review cross-functional priorities, technical milestones, and high-impact system objectives for the day with team leads.',
    startTime: '08:30',
    endTime: '09:15',
    priority: 'high',
    completed: false,
    recurrence: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    id: 'task-2',
    name: 'Deep Work: Core Engine & Data Contract Optimization',
    description: 'Refactor high-throughput event pipeline, audit zero-copy serialization buffers, and verify security invariants.',
    startTime: '09:30',
    endTime: '11:30',
    priority: 'high',
    completed: false,
    recurrence: ['Monday', 'Wednesday', 'Friday'],
  },
  {
    id: 'task-3',
    name: 'Executive Sync & Stakeholder Review',
    description: 'Present prototype timeline progression metrics, review user journey telemetry, and sign off on release checkpoints.',
    startTime: '11:45',
    endTime: '12:30',
    priority: 'medium',
    completed: false,
    recurrence: ['Wednesday'],
  },
  {
    id: 'task-4',
    name: 'Nutritional Break & Re-centering Walk',
    description: 'Healthy lunch, step away from screens, and refresh mental cognitive clarity before afternoon sprint.',
    startTime: '12:30',
    endTime: '13:30',
    priority: 'low',
    completed: false,
    recurrence: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  {
    id: 'task-5',
    name: 'Client Interface & Usability Polish',
    description: 'Fine-tune typography contrast, test responsive fluid viewport scaling, and resolve accessibility focus markers.',
    startTime: '13:30',
    endTime: '15:00',
    priority: 'medium',
    completed: false,
    recurrence: ['Tuesday', 'Thursday'],
  },
  {
    id: 'task-6',
    name: 'Security Audit & Invariant Verification',
    description: 'Execute strict compliance boundary verification, verify ethical AI safeguards, and seal data access permissions.',
    startTime: '15:15',
    endTime: '16:30',
    priority: 'high',
    completed: false,
    recurrence: ['Wednesday'],
  },
  {
    id: 'task-7',
    name: 'Daily Retrospective & Tomorrow Planning',
    description: 'Log completed milestones, archive verified deliverables, and prepare tomorrow morning focus docket.',
    startTime: '16:45',
    endTime: '17:30',
    priority: 'low',
    completed: false,
    recurrence: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    id: 'task-8',
    name: 'Completed: Early Morning Calisthenics & Focus Meditation',
    description: 'Engage 30 minutes of physical conditioning followed by mindful breathing and mental readiness.',
    startTime: '07:00',
    endTime: '08:00',
    priority: 'medium',
    completed: true,
    recurrence: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
];

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      saveTasks(INITIAL_SAMPLE_TASKS);
      return INITIAL_SAMPLE_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveTasks(INITIAL_SAMPLE_TASKS);
    return INITIAL_SAMPLE_TASKS;
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
    return INITIAL_SAMPLE_TASKS;
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
}
