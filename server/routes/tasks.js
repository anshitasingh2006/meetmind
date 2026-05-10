const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// 1. Get all tasks for workspace user
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const tasksResult = await db.query(
      'SELECT id, title, assignee, priority, due_date as "dueDate", status, meeting_id as "meetingId" FROM tasks WHERE user_id = $1',
      [userId]
    );
    res.json(tasksResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving tasks' });
  }
});

// 2. Update task details/status
router.put('/:id', auth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { status, title, assignee, priority, dueDate } = req.body;

  try {
    // Check ownership
    const check = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or task not found' });
    }

    // Build update query dynamically
    const fields = [];
    const values = [];
    let idx = 1;

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (assignee !== undefined) {
      fields.push(`assignee = $${idx++}`);
      values.push(assignee);
    }
    if (priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (dueDate !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(dueDate);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(taskId);
    values.push(userId);

    const queryText = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx++} RETURNING *`;
    const result = await db.query(queryText, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

module.exports = router;
