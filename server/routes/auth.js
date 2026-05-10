const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'meetmind_super_secret_jwt_key';

const DEFAULT_MEETINGS = [
  {
    id: "sample-product-review",
    title: "Product Review - Q3 Roadmap",
    date: "2026-06-25",
    summary: "A detailed review of the Q3 product roadmap. The team aligned on database replication strategies, dashboard styling guidelines, and critical telemetry tracking for the new authentication flow. Bob will handle database infrastructure, while Charlie starts frontend views and Diana focuses on test protocols.",
    meetingType: "Product Review",
    duration: "45 mins",
    participants: [
      { name: "Alice", role: "Product Manager" },
      { name: "Bob", role: "Lead Architect" },
      { name: "Charlie", role: "Frontend Dev" },
      { name: "Diana", role: "QA Lead" }
    ],
    keyPoints: [
      "V1 release target set for mid-July",
      "Telemetry requires GDPR compliance audit",
      "DB replication lag needs to remain below 50ms"
    ],
    decisions: [
      "Approved Q3 roadmap priorities",
      "Agreed on PostgreSQL for replica target database",
      "Standardized on Outfit Google Font for interface headers"
    ],
    tasks: [
      { id: "task_pr_1", title: "Create UI mockups for new dashboard", assignee: "Charlie", priority: "High", dueDate: "2026-06-30", status: "completed" },
      { id: "task_pr_2", title: "Write API contract documentation", assignee: "Alice", priority: "Medium", dueDate: "2026-07-02", status: "in_progress" },
      { id: "task_pr_3", title: "Set up CI/CD pipeline template", assignee: "Bob", priority: "High", dueDate: "2026-07-05", status: "open" },
      { id: "task_pr_4", title: "Draft test plan for user feedback integration", assignee: "Diana", priority: "Low", dueDate: "2026-07-08", status: "open" },
      { id: "task_pr_5", title: "Set up production DB replica", assignee: "Bob", priority: "High", dueDate: "2026-06-28", status: "completed" },
      { id: "task_pr_6", title: "Implement login analytics tracking", assignee: "Charlie", priority: "Low", dueDate: "2026-07-03", status: "open" }
    ],
    sentiment: "Positive",
    nextMeeting: "Q3 Sprint Planning on 2026-07-01 at 10:00 AM",
    rawTranscript: `Alice: Hi everyone, let's start the Q3 roadmap review. Bob, how are we looking on the database replication setup?
Bob: I've started looking at the PostgreSQL replica database target. I think we can set up the production DB replica by June 28. It's high priority so I will make sure the replica lag remains below 50ms.
Alice: Excellent. Charlie, what about the new dashboard UI mockups?
Charlie: I've actually completed the UI mockups for the new dashboard! I can present them today. Next, I need to start implementing login analytics tracking. I should have that open and completed by July 3.
Diana: I've reviewed the design, and I'll draft the test plan for user feedback integration by July 8.
Bob: Sounds good. I'll also set up the CI/CD pipeline template by July 5.
Alice: Great progress. I will write the API contract documentation by July 2. We also need to make sure our telemetry is GDPR compliant. Let's make sure the V1 release is target for mid-July.
Diana: Agreed.
Alice: Perfect, let's meet for the Q3 Sprint Planning on July 1 at 10:00 AM. Thank you everyone!`
  },
  {
    id: "sample-daily-standup",
    title: "Daily Standup - Hotfix Sync",
    date: "2026-06-25",
    summary: "Quick morning synchronization to align on the v1.2 hotfix deployment. George flagged an iOS memory leak causing occasional crashes. Fiona completed the signup validation fix and Evan will update documentation today.",
    meetingType: "Daily Standup",
    duration: "15 mins",
    participants: [
      { name: "Evan", role: "Tech Lead" },
      { name: "Fiona", role: "Backend Dev" },
      { name: "George", role: "Mobile Dev" }
    ],
    keyPoints: [
      "User signup bug is blocking 5% of new users",
      "iOS build pipeline is healthy but local testing is slow"
    ],
    decisions: [
      "Deploy hotfix immediately after standup",
      "Use manual memory profiling to debug iOS sockets"
    ],
    tasks: [
      { id: "task_ds_1", title: "Fix memory leak in iOS websocket handler", assignee: "George", priority: "High", dueDate: "2026-06-26", status: "in_progress" },
      { id: "task_ds_2", title: "Deploy v1.2 hotfix for user signups", assignee: "Fiona", priority: "High", dueDate: "2026-06-25", status: "completed" },
      { id: "task_ds_3", title: "Update developer readme for local setup", assignee: "Evan", priority: "Low", dueDate: "2026-06-28", status: "open" }
    ],
    sentiment: "Neutral",
    nextMeeting: "Daily Standup on 2026-06-26 at 09:30 AM",
    rawTranscript: `Evan: Morning team, let's do the standup. Fiona, what is the status of the signup bug?
Fiona: Hi Evan, I just completed the deployment of the v1.2 hotfix for user signups! It's verified and live.
Evan: Awesome. George, how is the iOS app?
George: I am currently working on fixing the memory leak in the iOS websocket handler. I'm using manual memory profiling to debug the sockets. I should have it resolved and in progress by June 26.
Evan: Thanks. I will update the developer readme for local setup by June 28.
George: Let's make sure we test local setups.
Evan: Yes. Let's do our next daily standup tomorrow at 9:30 AM. Have a good day!`
  }
];

// 1. Register User
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check existing
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), passwordHash]
    );

    const user = newUser.rows[0];

    // Seed mock data for the user
    for (const m of DEFAULT_MEETINGS) {
      const dbMeetingId = `${m.id}_${user.id}`;
      await db.query(
        'INSERT INTO meetings (id, user_id, title, date, summary, meeting_type, duration, sentiment, next_meeting, raw_transcript) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [dbMeetingId, user.id, m.title, m.date, m.summary, m.meetingType, m.duration, m.sentiment, m.nextMeeting, m.rawTranscript]
      );
      
      for (const p of m.participants) {
        await db.query('INSERT INTO meeting_participants (meeting_id, name, role) VALUES ($1, $2, $3)', [dbMeetingId, p.name, p.role]);
      }
      
      for (const kp of m.keyPoints) {
        await db.query('INSERT INTO meeting_key_points (meeting_id, point) VALUES ($1, $2)', [dbMeetingId, kp]);
      }
      
      for (const dec of m.decisions) {
        await db.query('INSERT INTO meeting_decisions (meeting_id, decision) VALUES ($1, $2)', [dbMeetingId, dec]);
      }
      
      for (const t of m.tasks) {
        const dbTaskId = `${t.id}_${user.id}`;
        await db.query(
          'INSERT INTO tasks (id, meeting_id, user_id, title, assignee, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [dbTaskId, dbMeetingId, user.id, t.title, t.assignee, t.priority, t.dueDate, t.status]
        );
      }
    }

    // Sign Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        email: user.email,
        useCase: null,
        details: null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Get onboarding details if completed
    let details = null;
    if (user.use_case) {
      if (user.use_case === 'business') {
        const membersResult = await db.query('SELECT name, email FROM team_members WHERE user_id = $1', [user.id]);
        details = {
          companyName: user.company_name,
          members: membersResult.rows
        };
      } else {
        details = {
          name: user.personal_name,
          role: user.personal_role,
          goal: user.personal_goal
        };
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        email: user.email,
        useCase: user.use_case,
        details
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Onboard User Workspace Profile
router.post('/onboard', auth, async (req, res) => {
  const { useCase, details } = req.body;
  const userId = req.user.id;

  if (!useCase || !details) {
    return res.status(400).json({ message: 'Please provide use case and details' });
  }

  try {
    if (useCase === 'business') {
      const { companyName, members } = details;
      
      // Update user row
      await db.query(
        'UPDATE users SET use_case = $1, company_name = $2, personal_name = NULL, personal_role = NULL, personal_goal = NULL WHERE id = $3',
        [useCase, companyName, userId]
      );

      // Refresh team members
      await db.query('DELETE FROM team_members WHERE user_id = $1', [userId]);
      if (members && members.length > 0) {
        for (const m of members) {
          await db.query(
            'INSERT INTO team_members (user_id, name, email) VALUES ($1, $2, $3)',
            [userId, m.name, m.email]
          );
        }
      }
    } else {
      // Personal
      const { name, role, goal } = details;
      await db.query(
        'UPDATE users SET use_case = $1, company_name = NULL, personal_name = $2, personal_role = $3, personal_goal = $4 WHERE id = $5',
        [useCase, name, role, goal, userId]
      );
    }

    res.json({
      email: req.user.email,
      useCase,
      details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
});

// 4. Get active user profile
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    let details = null;
    if (user.use_case) {
      if (user.use_case === 'business') {
        const membersResult = await db.query('SELECT name, email FROM team_members WHERE user_id = $1', [user.id]);
        details = {
          companyName: user.company_name,
          members: membersResult.rows
        };
      } else {
        details = {
          name: user.personal_name,
          role: user.personal_role,
          goal: user.personal_goal
        };
      }
    }

    res.json({
      email: user.email,
      useCase: user.use_case,
      details
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
