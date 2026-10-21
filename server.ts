import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '2mb' }));

// In-memory persistent database for users, sessions, and tasks
interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  preferences: {
    timeZoneShorthand: string;
    notificationLeadMinutes: number;
    notificationsEnabled: boolean;
  };
  tasks: any[];
}

const usersDb = new Map<string, StoredUser>(); // email -> StoredUser
const sessionsDb = new Map<string, string>(); // token -> userId

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Authentication Middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.substring(7);
  const userId = sessionsDb.get(token);
  if (userId) {
    for (const user of usersDb.values()) {
      if (user.id === userId) {
        (req as any).user = user;
        (req as any).sessionToken = token;
        break;
      }
    }
  }
  next();
}

app.use(authMiddleware);

// Initialize GoogleGenAI server-side client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface TaskPayload {
  id: string;
  name: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  startTime?: string;
  endTime?: string;
  recurrence?: string[];
  completed?: boolean;
  doNotAutomaticallySchedule?: boolean;
}

// --- Auth Endpoints ---

app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Valid email and password required.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (usersDb.has(normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const id = `usr-${crypto.randomUUID()}`;
    const token = crypto.randomBytes(32).toString('hex');

    const newUser: StoredUser = {
      id,
      email: normalizedEmail,
      name: (name || normalizedEmail.split('@')[0]).trim(),
      passwordHash,
      salt,
      preferences: {
        timeZoneShorthand: 'PDT',
        notificationLeadMinutes: 10,
        notificationsEnabled: true,
      },
      tasks: [],
    };

    usersDb.set(normalizedEmail, newUser);
    sessionsDb.set(token, id);

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        preferences: newUser.preferences,
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// --- Endpoint: Verify Application Password Wall ---
app.post('/api/gate/verify', (req, res) => {
  const { password } = req.body;
  if (password === '20260730') {
    return res.json({ success: true, message: 'Access granted.' });
  }
  return res.status(401).json({ error: 'Incorrect secret password. Access denied.' });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = usersDb.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessionsDb.set(token, user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
        token,
      },
      tasks: user.tasks,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = (req as any).user as StoredUser | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      preferences: user.preferences,
    },
    tasks: user.tasks,
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = (req as any).sessionToken as string | undefined;
  if (token) {
    sessionsDb.delete(token);
  }
  return res.json({ success: true });
});

app.post('/api/user/preferences', (req, res) => {
  const user = (req as any).user as StoredUser | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const { timeZoneShorthand, notificationLeadMinutes, notificationsEnabled } = req.body;
  if (timeZoneShorthand !== undefined) user.preferences.timeZoneShorthand = timeZoneShorthand;
  if (notificationLeadMinutes !== undefined) user.preferences.notificationLeadMinutes = notificationLeadMinutes;
  if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;
  return res.json({ success: true, preferences: user.preferences });
});

app.post('/api/user/tasks', (req, res) => {
  const user = (req as any).user as StoredUser | undefined;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const { tasks } = req.body;
  if (Array.isArray(tasks)) {
    user.tasks = tasks;
  }
  return res.json({ success: true, count: user.tasks.length });
});

// --- Endpoint: AI Automatic Schedule Tasks ---
app.post('/api/schedule', async (req, res) => {
  try {
    const { tasks, date, timezone } = req.body as {
      tasks: TaskPayload[];
      date: string;
      timezone: string;
    };

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks provided for scheduling.' });
    }

    // Separate locked tasks ("Do not automatically schedule") vs flexible tasks
    const lockedTasks = tasks.filter((t) => t.doNotAutomaticallySchedule === true);
    const flexibleTasks = tasks.filter((t) => t.doNotAutomaticallySchedule !== true);

    // If all tasks are locked, return as is
    if (flexibleTasks.length === 0) {
      return res.json({
        success: true,
        schedule: lockedTasks.map((t) => ({
          id: t.id,
          startTime: t.startTime || '09:00',
          endTime: t.endTime || '10:00',
          recurrence: t.recurrence || [],
          rationale: 'Preserved: locked by user via "Do not automatically schedule".',
        })),
        source: 'locked-preservation',
      });
    }

    const taskListForPrompt = flexibleTasks.map((t, idx) => ({
      index: idx,
      id: t.id,
      name: t.name,
      description: t.description || '',
      priority: t.priority || 'medium',
      currentRecurrence: t.recurrence || [],
    }));

    const lockedSummary = lockedTasks.map((t) => ({
      id: t.id,
      name: t.name,
      fixedStartTime: t.startTime,
      fixedEndTime: t.endTime,
    }));

    if (ai) {
      try {
        const prompt = `You are an expert ethical and secure executive daily schedule optimizer.
Organize the flexible tasks into an optimized daily timetable for date ${date} (Timezone: ${timezone}).

IMPORTANT CONSTRAINTS:
1. FIXED/LOCKED TASKS (DO NOT MOVE THESE TIMES, SCHEDULE AROUND THEM):
${JSON.stringify(lockedSummary, null, 2)}

2. Flexible tasks to schedule:
${JSON.stringify(taskListForPrompt, null, 2)}

Rules for flexible tasks:
- High-priority tasks should ideally be scheduled during prime morning/early afternoon focus hours (09:00 - 13:00) without colliding with locked tasks.
- Medium and low-priority tasks should be arranged logically around existing fixed tasks and afternoon hours.
- Realistic durations: 30 to 90 minutes per task.
- Tasks must not overlap with each other or with any fixed tasks. Start times between 08:30 and 18:00.
- Provide start and end times in 24-hour format "HH:MM" (e.g. "09:00", "10:30").
- You may assign appropriate daily recurrences (array of day shorthands: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun") depending on the task nature.
- Return a schedule item for every flexible task. Do not include confidential, sensitive, private, or biometric information.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are an ethical, compliant, and privacy-preserving schedule planner. Output strict JSON matching the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  startTime: { type: Type.STRING, description: 'Format HH:MM' },
                  endTime: { type: Type.STRING, description: 'Format HH:MM' },
                  recurrence: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Days of week: Mon, Tue, Wed, Thu, Fri, Sat, Sun',
                  },
                  rationale: { type: Type.STRING, description: 'Brief rationale' },
                },
                required: ['id', 'startTime', 'endTime'],
              },
            },
          },
        });

        const flexibleSchedule = JSON.parse(response.text || '[]');

        // Combine locked tasks (preserving their original times) with scheduled flexible tasks
        const combinedSchedule = [
          ...lockedTasks.map((t) => ({
            id: t.id,
            startTime: t.startTime || '09:00',
            endTime: t.endTime || '10:00',
            recurrence: t.recurrence || [],
            rationale: 'Preserved: locked by user.',
          })),
          ...flexibleSchedule,
        ];

        return res.json({ success: true, schedule: combinedSchedule, source: 'gemini-3.8-flash' });
      } catch (geminiError) {
        console.warn('Gemini scheduling failed, falling back to deterministic planner:', geminiError);
      }
    }

    // Heuristic fallback respecting locked tasks
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const sorted = [...flexibleTasks].sort(
      (a, b) => (priorityWeights[b.priority] || 2) - (priorityWeights[a.priority] || 2)
    );

    let currentHour = 9;
    let currentMin = 0;

    const scheduledFlexible = sorted.map((task) => {
      const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      let durationMinutes = task.priority === 'high' ? 60 : task.priority === 'medium' ? 45 : 30;

      currentMin += durationMinutes;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour += 1;
      }

      const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += 15;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour += 1;
      }

      let recurrence = task.recurrence && task.recurrence.length > 0 ? task.recurrence : [];
      const lowerName = task.name.toLowerCase();
      if (lowerName.includes('standup') || lowerName.includes('review') || lowerName.includes('plan')) {
        recurrence = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      } else if (lowerName.includes('exercise') || lowerName.includes('workout') || lowerName.includes('walk')) {
        recurrence = ['Mon', 'Wed', 'Fri'];
      }

      return {
        id: task.id,
        startTime: startStr,
        endTime: endStr,
        recurrence,
        rationale: `Organized by priority (${task.priority}) around fixed commitments.`,
      };
    });

    const combinedSchedule = [
      ...lockedTasks.map((t) => ({
        id: t.id,
        startTime: t.startTime || '09:00',
        endTime: t.endTime || '10:00',
        recurrence: t.recurrence || [],
        rationale: 'Preserved: locked by user.',
      })),
      ...scheduledFlexible,
    ];

    return res.json({ success: true, schedule: combinedSchedule, source: 'heuristic-optimizer' });
  } catch (error) {
    console.error('Error in /api/schedule:', error);
    res.status(500).json({ error: 'Failed to automatically schedule tasks.' });
  }
});

// --- Endpoint: AI Reschedule Single Task with User Instruction ---
app.post('/api/task/reschedule', async (req, res) => {
  try {
    const { task, instruction, currentDate, currentTime, timezone } = req.body;
    if (!task || !instruction) {
      return res.status(400).json({ error: 'Task and instruction are required.' });
    }

    if (ai) {
      try {
        const prompt = `You are an ethical and secure executive daily schedule optimizer.
The user wants to reschedule the following task based on their instruction: "${instruction}".

Task to reschedule:
- ID: ${task.id}
- Name: ${task.name}
- Current Date: ${task.date || currentDate}
- Current Start Time: ${task.startTime}
- Current End Time: ${task.endTime}
- Current Recurrence: ${JSON.stringify(task.recurrence || [])}
- Priority: ${task.priority}

Context:
- Today's Date: ${currentDate}
- Current Time: ${currentTime}
- Timezone: ${timezone}

Instructions handling:
- If user requests "reschedule to later in my day" or similar: assign a new realistic start time and end time later in the day (e.g. afternoon or evening: 14:00, 15:30, 16:00, etc.) without exceeding 22:00.
- If user requests "reschedule to tomorrow" or similar: set the date to tomorrow's date (calculated from ${currentDate}) and assign an appropriate start and end time.
- If user requests "set to recur on mondays" or another day: update recurrence to include that day (e.g. ["Monday"]), retaining or assigning appropriate start and end times.
- If user requests "remove recurrence" or "clear recurrence": set recurrence to an empty array [].
- AI will automatically assign times for each task, overwriting any times inputted for a task.
- Ensure times are formatted strictly as "HH:MM" (24-hour format).
- Provide a brief 1-sentence rationale explaining the update.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an ethical, compliant assistant. Return valid JSON only.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                startTime: { type: Type.STRING, description: 'Format HH:MM' },
                endTime: { type: Type.STRING, description: 'Format HH:MM' },
                date: { type: Type.STRING, description: 'Format YYYY-MM-DD' },
                recurrence: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
                },
                rationale: { type: Type.STRING, description: 'Brief explanation of changes' },
              },
              required: ['startTime', 'endTime', 'recurrence'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        const updatedTask = {
          ...task,
          startTime: parsed.startTime || task.startTime,
          endTime: parsed.endTime || task.endTime,
          date: parsed.date !== undefined ? parsed.date : task.date,
          recurrence: parsed.recurrence !== undefined ? parsed.recurrence : task.recurrence,
          updatedAt: new Date().toISOString(),
        };

        return res.json({
          success: true,
          task: updatedTask,
          rationale: parsed.rationale || 'Task rescheduled by AI.',
          source: 'gemini-3.8-flash',
        });
      } catch (geminiError) {
        console.warn('Gemini single-task reschedule failed, using deterministic fallback:', geminiError);
      }
    }

    // Deterministic fallback for rescheduling instructions
    const lower = instruction.toLowerCase().trim();
    let newStartTime = task.startTime;
    let newEndTime = task.endTime;
    let newDate = task.date;
    let newRecurrence = Array.isArray(task.recurrence) ? [...task.recurrence] : [];
    let rationale = 'Task updated based on instruction.';

    if (lower.includes('later in') || lower.includes('later today')) {
      const [h, m] = (task.startTime || '09:00').split(':').map(Number);
      const newH = Math.min(20, Math.max(14, (h || 9) + 4));
      newStartTime = `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      newEndTime = `${String(newH + 1).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      rationale = 'Rescheduled to later in the day.';
    } else if (lower.includes('tomorrow')) {
      const d = new Date(currentDate || new Date().toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
      newDate = d.toISOString().slice(0, 10);
      newStartTime = '10:00';
      newEndTime = '11:00';
      rationale = 'Rescheduled to tomorrow.';
    } else if (lower.includes('remove recurrence') || lower.includes('no recurrence') || lower.includes('stop recurring')) {
      newRecurrence = [];
      rationale = 'Recurrence removed.';
    } else if (lower.includes('recur on') || lower.includes('recur') || lower.includes('mondays') || lower.includes('fridays')) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const matched = days.filter(
        (d) => lower.includes(d.toLowerCase()) || lower.includes(d.toLowerCase().slice(0, 3))
      );
      if (matched.length > 0) {
        newRecurrence = matched;
      } else {
        newRecurrence = ['Monday'];
      }
      rationale = `Recurrence set to ${newRecurrence.join(', ')}.`;
    }

    const updatedTask = {
      ...task,
      startTime: newStartTime,
      endTime: newEndTime,
      date: newDate,
      recurrence: newRecurrence,
      updatedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      task: updatedTask,
      rationale,
      source: 'deterministic-fallback',
    });
  } catch (err) {
    console.error('Error in /api/task/reschedule:', err);
    res.status(500).json({ error: 'Failed to reschedule task.' });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
