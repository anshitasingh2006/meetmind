-- Schema for MeetMind PostgreSQL Database

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  use_case VARCHAR(50),
  company_name VARCHAR(255),
  personal_name VARCHAR(255),
  personal_role VARCHAR(255),
  personal_goal VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Business Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL
);

-- 3. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50),
  summary TEXT,
  meeting_type VARCHAR(100),
  duration VARCHAR(50),
  sentiment VARCHAR(50),
  next_meeting VARCHAR(255),
  raw_transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Meeting Participants Table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255)
);

-- 5. Key Discussion Points
CREATE TABLE IF NOT EXISTS meeting_key_points (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
  point TEXT NOT NULL
);

-- 6. Key Decisions Table
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id SERIAL PRIMARY KEY,
  meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
  decision TEXT NOT NULL
);

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  meeting_id VARCHAR(255) REFERENCES meetings(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  assignee VARCHAR(255),
  priority VARCHAR(50),
  due_date VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open'
);
