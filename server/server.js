const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes Modules
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const taskRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: 'connected' });
});

// Database Auto-Initialization
const initDatabase = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔄 Initializing PostgreSQL database tables...');
    await db.query(schemaSql);
    console.log('✅ PostgreSQL database tables initialized successfully.');

    console.log('🧹 Cleaning up database seed templates for non-demo accounts...');
    await db.query(`
      DELETE FROM meetings 
      WHERE (id LIKE 'sample-%' OR id LIKE 'meeting_fallback_%')
        AND user_id NOT IN (SELECT id FROM users WHERE email LIKE '%demo%')
    `);
    console.log('✅ Database templates cleanup complete.');
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err.message);
  }
};

const startServer = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 MeetMind server running on http://localhost:${PORT}`);
  });
};

startServer();
