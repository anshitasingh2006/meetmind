const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// 1. Get all meetings for user
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const meetingsResult = await db.query(
      'SELECT * FROM meetings WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );

    const meetings = [];

    for (const m of meetingsResult.rows) {
      // Fetch participants
      const partResult = await db.query(
        'SELECT name, role FROM meeting_participants WHERE meeting_id = $1',
        [m.id]
      );
      
      // Fetch key discussion points
      const pointsResult = await db.query(
        'SELECT point FROM meeting_key_points WHERE meeting_id = $1',
        [m.id]
      );

      // Fetch decisions
      const decResult = await db.query(
        'SELECT decision FROM meeting_decisions WHERE meeting_id = $1',
        [m.id]
      );

      // Fetch tasks
      const tasksResult = await db.query(
        'SELECT id, title, assignee, priority, due_date as "dueDate", status, meeting_id as "meetingId" FROM tasks WHERE meeting_id = $1',
        [m.id]
      );

      meetings.push({
        id: m.id,
        title: m.title,
        date: m.date,
        summary: m.summary,
        meetingType: m.meeting_type,
        duration: m.duration,
        sentiment: m.sentiment,
        nextMeeting: m.next_meeting,
        rawTranscript: m.raw_transcript,
        participants: partResult.rows,
        keyPoints: pointsResult.rows.map(r => r.point),
        decisions: decResult.rows.map(r => r.decision),
        tasks: tasksResult.rows
      });
    }

    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving meetings' });
  }
});

// 2. Save a new analyzed meeting
router.post('/', auth, async (req, res) => {
  const userId = req.user.id;
  const {
    id,
    title,
    date,
    summary,
    meetingType,
    duration,
    participants,
    keyPoints,
    decisions,
    tasks,
    sentiment,
    nextMeeting,
    rawTranscript
  } = req.body;

  if (!id || !title) {
    return res.status(400).json({ message: 'Meeting id and title are required' });
  }

  try {
    // Insert into meetings table
    await db.query(
      'INSERT INTO meetings (id, user_id, title, date, summary, meeting_type, duration, sentiment, next_meeting, raw_transcript) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, userId, title, date, summary, meetingType, duration, sentiment, nextMeeting, rawTranscript]
    );

    // Insert participants
    if (participants && participants.length > 0) {
      for (const p of participants) {
        await db.query(
          'INSERT INTO meeting_participants (meeting_id, name, role) VALUES ($1, $2, $3)',
          [id, p.name, p.role]
        );
      }
    }

    // Insert key points
    if (keyPoints && keyPoints.length > 0) {
      for (const pt of keyPoints) {
        await db.query(
          'INSERT INTO meeting_key_points (meeting_id, point) VALUES ($1, $2)',
          [id, pt]
        );
      }
    }

    // Insert decisions
    if (decisions && decisions.length > 0) {
      for (const dec of decisions) {
        await db.query(
          'INSERT INTO meeting_decisions (meeting_id, decision) VALUES ($1, $2)',
          [id, dec]
        );
      }
    }

    // Insert tasks
    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        await db.query(
          'INSERT INTO tasks (id, meeting_id, user_id, title, assignee, priority, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [t.id, id, userId, t.title, t.assignee, t.priority, t.dueDate, t.status || 'open']
        );
      }
    }

    res.status(201).json({ message: 'Meeting saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving meeting' });
  }
});

// 3. Delete a meeting
router.delete('/:id', auth, async (req, res) => {
  const meetingId = req.params.id;
  const userId = req.user.id;

  try {
    // Check ownership
    const check = await db.query('SELECT * FROM meetings WHERE id = $1 AND user_id = $2', [meetingId, userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or meeting not found' });
    }

    await db.query('DELETE FROM meetings WHERE id = $1', [meetingId]);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting meeting' });
  }
});

module.exports = router;
