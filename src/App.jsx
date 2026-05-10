import React, { useState, useEffect } from 'react';

// Static Sample Transcripts
const SAMPLE_TRANSCRIPTS = {
  productReview: `Alice: Hi everyone, let's start the Q3 roadmap review. Bob, how are we looking on the database replication setup?
Bob: I've started looking at the PostgreSQL replica database target. I think we can set up the production DB replica by June 28. It's high priority so I will make sure the replica lag remains below 50ms.
Alice: Excellent. Charlie, what about the new dashboard UI mockups?
Charlie: I've actually completed the UI mockups for the new dashboard! I can present them today. Next, I need to start implementing login analytics tracking. I should have that open and completed by July 3.
Diana: I've reviewed the design, and I'll draft the test plan for user feedback integration by July 8.
Bob: Sounds good. I'll also set up the CI/CD pipeline template by July 5.
Alice: Great progress. I will write the API contract documentation by July 2. We also need to make sure our telemetry is GDPR compliant. Let's make sure the V1 release is target for mid-July.
Diana: Agreed.
Alice: Perfect, let's meet for the Q3 Sprint Planning on July 1 at 10:00 AM. Thank you everyone!`,

  dailyStandup: `Evan: Morning team, let's do the standup. Fiona, what is the status of the signup bug?
Fiona: Hi Evan, I just completed the deployment of the v1.2 hotfix for user signups! It's verified and live.
Evan: Awesome. George, how is the iOS app?
George: I am currently working on fixing the memory leak in the iOS websocket handler. I'm using manual memory profiling to debug the sockets. I should have it resolved and in progress by June 26.
Evan: Thanks. I will update the developer readme for local setup by June 28.
George: Let's make sure we test local setups.
Evan: Yes. Let's do our next daily standup tomorrow at 9:30 AM. Have a good day!`
};

// System Prompt for Claude
const SYSTEM_PROMPT = `You are a meeting intelligence assistant. Analyze the meeting transcript and return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "summary": "string",
  "meetingType": "string",
  "duration": "string",
  "participants": [{"name": "string", "role": "string"}],
  "keyPoints": ["string"],
  "decisions": ["string"],
  "tasks": [{
    "id": "string",
    "title": "string",
    "assignee": "string",
    "priority": "High" | "Medium" | "Low",
    "dueDate": "string",
    "status": "open"
  }],
  "sentiment": "Positive" | "Neutral" | "Negative",
  "nextMeeting": "string"
}`;

// Initial Default Mock Data parsed as JSON models
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
      { id: "task_pr_1", title: "Create UI mockups for new dashboard", assignee: "Charlie", priority: "High", dueDate: "2026-06-30", status: "completed", meetingId: "sample-product-review" },
      { id: "task_pr_2", title: "Write API contract documentation", assignee: "Alice", priority: "Medium", dueDate: "2026-07-02", status: "in_progress", meetingId: "sample-product-review" },
      { id: "task_pr_3", title: "Set up CI/CD pipeline template", assignee: "Bob", priority: "High", dueDate: "2026-07-05", status: "open", meetingId: "sample-product-review" },
      { id: "task_pr_4", title: "Draft test plan for user feedback integration", assignee: "Diana", priority: "Low", dueDate: "2026-07-08", status: "open", meetingId: "sample-product-review" },
      { id: "task_pr_5", title: "Set up production DB replica", assignee: "Bob", priority: "High", dueDate: "2026-06-28", status: "completed", meetingId: "sample-product-review" },
      { id: "task_pr_6", title: "Implement login analytics tracking", assignee: "Charlie", priority: "Low", dueDate: "2026-07-03", status: "open", meetingId: "sample-product-review" }
    ],
    sentiment: "Positive",
    nextMeeting: "Q3 Sprint Planning on 2026-07-01 at 10:00 AM",
    rawTranscript: SAMPLE_TRANSCRIPTS.productReview
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
      { id: "task_ds_1", title: "Fix memory leak in iOS websocket handler", assignee: "George", priority: "High", dueDate: "2026-06-26", status: "in_progress", meetingId: "sample-daily-standup" },
      { id: "task_ds_2", title: "Deploy v1.2 hotfix for user signups", assignee: "Fiona", priority: "High", dueDate: "2026-06-25", status: "completed", meetingId: "sample-daily-standup" },
      { id: "task_ds_3", title: "Update developer readme for local setup", assignee: "Evan", priority: "Low", dueDate: "2026-06-28", status: "open", meetingId: "sample-daily-standup" }
    ],
    sentiment: "Neutral",
    nextMeeting: "Daily Standup on 2026-06-26 at 09:30 AM",
    rawTranscript: SAMPLE_TRANSCRIPTS.dailyStandup
  }
];

export default function App() {
  // --- SESSION & ONBOARDING STATE ---
  const [userSession, setUserSession] = useState(null);
  const [authMode, setAuthMode] = useState('register'); // 'login' | 'register'
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: Auth, 2: UseCase selection, 3: Details form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [useCase, setUseCase] = useState(null); // 'business' | 'personal'
  
  // Business details
  const [companyName, setCompanyName] = useState('');
  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '' }]);
  
  // Personal details
  const [personalName, setPersonalName] = useState('');
  const [personalRole, setPersonalRole] = useState('');
  const [personalGoal, setPersonalGoal] = useState('General Productivity');

  // --- STATE MANAGEMENT ---
  const [meetings, setMeetings] = useState([]);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [activeTab, setActiveTab] = useState('analyze');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Input states
  const [inputMethod, setInputMethod] = useState('text'); // 'text', 'audio', 'link'
  const [transcriptInput, setTranscriptInput] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedMockSource, setSelectedMockSource] = useState('productReview');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [calendarSyncLogs, setCalendarSyncLogs] = useState([]);

  // API / Sandbox Settings
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem('meetmind_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [useSandbox, setUseSandbox] = useState(true);

  // Simulation Recording states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0); // 0: Idle, 1: Bot Joining, 2: Recording, 3: Transcribing, 4: Analyzing
  const [simDuration, setSimDuration] = useState(0);

  // Kanban filters
  const [taskSearch, setTaskSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Toasts
  const [toasts, setToasts] = useState([]);

  // --- API FETCH CLIENT UTILITIES ---
  const apiFetch = async (url, options = {}) => {
    const token = window.localStorage.getItem('meetmind_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with status ${response.status}`);
    }
    return response.json();
  };

  const fetchMeetings = async () => {
    try {
      const list = await apiFetch('/api/meetings');
      setMeetings(list);
      if (list.length > 0) {
        setCurrentMeeting(list[0]);
      } else {
        setCurrentMeeting(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch meetings', 'error');
    }
  };

  // --- SYNC ACTIONS & ON-LOAD INITIALIZATION ---
  useEffect(() => {
    const token = window.localStorage.getItem('meetmind_token');
    if (token) {
      apiFetch('/api/auth/me')
        .then(session => {
          setUserSession(session);
          if (session.useCase && session.details) {
            setActiveTab('analyze');
          } else {
            setOnboardingStep(2);
          }
        })
        .catch(err => {
          console.error('Session restore failed:', err);
          window.localStorage.removeItem('meetmind_token');
          setUserSession(null);
          setOnboardingStep(1);
        });
    } else {
      setUserSession(null);
      setOnboardingStep(1);
    }
  }, []);

  useEffect(() => {
    if (userSession && userSession.useCase && userSession.details) {
      fetchMeetings();
    }
  }, [userSession]);

  useEffect(() => {
    // Sync active meeting result when current meeting changes
    setAnalysisResult(currentMeeting);
  }, [currentMeeting]);

  useEffect(() => {
    // Update global tasks whenever meetings array changes
    const all = meetings.flatMap(m => m.tasks || []);
    setTasks(all);
  }, [meetings]);

  // --- TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- ACCOUNTS & ONBOARDING DATABASE ---
  const getRegisteredAccounts = () => {
    const saved = window.localStorage.getItem('meetmind_accounts');
    return saved ? JSON.parse(saved) : {};
  };

  // --- AUTH SUBMISSION ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      showToast('Please fill in all credentials.', 'error');
      return;
    }

    if (!authEmail.includes('@') || !authEmail.includes('.')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (authPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      if (authMode === 'register') {
        if (authPassword !== authConfirmPassword) {
          showToast('Passwords do not match.', 'error');
          return;
        }

        const data = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        
        window.localStorage.setItem('meetmind_token', data.token);
        setUserSession(data.user);
        showToast('Registration successful! Please configure your use case.', 'success');
        setOnboardingStep(2);
      } else {
        // Login
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        
        window.localStorage.setItem('meetmind_token', data.token);
        setUserSession(data.user);
        
        if (data.user.useCase && data.user.details) {
          showToast(`Welcome back, ${data.user.details.name || data.user.details.companyName || data.user.email}!`, 'success');
        } else {
          showToast('Please complete your profile setup.', 'info');
          setOnboardingStep(2);
        }
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  // --- COMPLETE SETUP ---
  const handleCompleteSetup = async (e) => {
    e.preventDefault();

    if (!useCase) {
      showToast('Please select how you will use MeetMind.', 'error');
      return;
    }

    let details = {};

    if (useCase === 'business') {
      if (!companyName.trim()) {
        showToast('Please enter your company or organization name.', 'error');
        return;
      }
      const activeMembers = teamMembers.filter(m => m.name.trim() || m.email.trim());
      if (activeMembers.length === 0) {
        showToast('Please add at least one team member.', 'error');
        return;
      }
      for (const member of activeMembers) {
        if (!member.name.trim()) {
          showToast('All active team member rows must have a name.', 'error');
          return;
        }
        if (!member.email.trim() || !member.email.includes('@')) {
          showToast(`Please enter a valid email for team member: ${member.name}`, 'error');
          return;
        }
      }
      details = {
        companyName: companyName.trim(),
        members: activeMembers
      };
    } else {
      // Personal
      if (!personalName.trim()) {
        showToast('Please enter your full name.', 'error');
        return;
      }
      if (!personalRole.trim()) {
        showToast('Please enter your role or occupation.', 'error');
        return;
      }
      details = {
        name: personalName.trim(),
        role: personalRole.trim(),
        goal: personalGoal
      };
    }

    try {
      const data = await apiFetch('/api/auth/onboard', {
        method: 'POST',
        body: JSON.stringify({ useCase, details })
      });
      setUserSession(data);
      showToast('Setup complete! Welcome to MeetMind Dashboard.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save setup details', 'error');
    }
  };

  // --- SIGN OUT ACTION ---
  const handleSignOut = () => {
    window.localStorage.removeItem('meetmind_token');
    setUserSession(null);
    setOnboardingStep(1);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setUseCase(null);
    setCompanyName('');
    setTeamMembers([{ name: '', email: '' }]);
    setPersonalName('');
    setPersonalRole('');
    setMeetings([]);
    setCurrentMeeting(null);
    showToast('Signed out successfully.', 'info');
  };

  // --- AUDIO UPLOAD SIMULATOR ---
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAudioFile(file);
    setAudioUploading(true);
    setAudioProgress(0);

    // Simulate file upload progress
    const interval = setInterval(() => {
      setAudioProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAudioUploading(false);
          // Auto fill a mock transcript based on file name or generic
          const transcriptText = file.name.toLowerCase().includes('standup') 
            ? SAMPLE_TRANSCRIPTS.dailyStandup 
            : SAMPLE_TRANSCRIPTS.productReview;
          setTranscriptInput(transcriptText);
          showToast(`Audio file "${file.name}" uploaded and transcribed!`, 'success');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  // --- AUDIO LINK PROCESSOR ---
  const handleProcessAudioUrl = (e) => {
    e.preventDefault();
    if (!audioUrl.trim()) return;

    setAudioUploading(true);
    setAudioProgress(0);
    setTranscriptInput('');

    const interval = setInterval(() => {
      setAudioProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAudioUploading(false);
          const transcriptText = audioUrl.toLowerCase().includes('standup') 
            ? SAMPLE_TRANSCRIPTS.dailyStandup 
            : SAMPLE_TRANSCRIPTS.productReview;
          setTranscriptInput(transcriptText);
          showToast('Audio URL link processed and voice-to-text compiled!', 'success');
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // --- GOOGLE CALENDAR UTILITIES ---
  const getGoogleCalendarUrl = (task, meetingTitle = "MeetMind Session") => {
    const title = `[MeetMind] ${task.title}`;
    const details = `Action Item assigned in meeting: ${meetingTitle}\nPriority: ${task.priority}\nStatus: ${task.status.replace('_', ' ')}`;
    
    // Format due date for Google Calendar: YYYYMMDD
    const dateStr = (task.dueDate || '').replace(/-/g, '');
    const dates = `${dateStr}/${dateStr}`; // All-day event
    
    const email = `${(task.assignee || 'unassigned').toLowerCase().replace(/\s+/g, '')}@meetmind.com`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}&add=${encodeURIComponent(email)}`;
  };

  const handleGoogleCalendarSync = () => {
    const tasksToSync = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
    if (tasksToSync.length === 0) {
      showToast('No Open or In Progress tasks available to sync.', 'info');
      return;
    }

    setIsCalendarSyncing(true);
    setCalendarSyncLogs([]);
    
    const logs = [
      "🔄 Initializing Google Calendar API synchronization...",
      "🔑 Resolving OAuth2 workspace tokens...",
      "📬 Connecting to Google Directory services to map assignees..."
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setCalendarSyncLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
        
        let taskIndex = 0;
        const taskInterval = setInterval(() => {
          if (taskIndex < tasksToSync.length) {
            const task = tasksToSync[taskIndex];
            const email = `${task.assignee.toLowerCase().replace(/\s+/g, '')}@meetmind.com`;
            setCalendarSyncLogs(prev => [
              ...prev,
              `✅ Created calendar event for ${task.assignee} (${email}): "${task.title}" (Due: ${task.dueDate})`
            ]);
            taskIndex++;
          } else {
            clearInterval(taskInterval);
            setCalendarSyncLogs(prev => [...prev, "🎉 Synchronization successfully completed!"]);
            setTimeout(() => {
              setIsCalendarSyncing(false);
              setShowCalendarModal(false);
              showToast(`Synced ${tasksToSync.length} action items to Google Calendar!`, 'success');
            }, 1000);
          }
        }, 300);
      }
    }, 400);
  };

  // --- JOIN & RECORD BOT SIMULATOR ---
  const handleStartSimulation = (e) => {
    e.preventDefault();
    if (!meetingLink.trim()) {
      showToast('Please enter a valid Zoom or Google Meet URL.', 'error');
      return;
    }
    setIsSimulating(true);
    setSimulationStep(1);
    setSimDuration(0);

    // Timeline: 8 seconds total, 2 seconds per phase
    // Phase 1 (Bot Joining): 0s - 2s
    // Phase 2 (Recording): 2s - 4s
    // Phase 3 (Transcribing): 4s - 6s
    // Phase 4 (Analyzing): 6s - 8s
    
    // Recording timer simulation
    let recordInterval;
    
    setTimeout(() => {
      setSimulationStep(2);
      recordInterval = setInterval(() => {
        setSimDuration(prev => prev + 1);
      }, 1000);
    }, 2000);

    setTimeout(() => {
      clearInterval(recordInterval);
      setSimulationStep(3);
    }, 4000);

    setTimeout(() => {
      setSimulationStep(4);
    }, 6000);

    setTimeout(async () => {
      setIsSimulating(false);
      setSimulationStep(0);
      
      // Determine what template to simulate/fetch based on selected mock source or URL query
      let transcriptToAnalyze = SAMPLE_TRANSCRIPTS[selectedMockSource] || SAMPLE_TRANSCRIPTS.productReview;
      if (meetingLink.toLowerCase().includes('standup') || meetingLink.toLowerCase().includes('daily')) {
        transcriptToAnalyze = SAMPLE_TRANSCRIPTS.dailyStandup;
      }
      
      showToast('Meeting record finished. Starting Claude AI analysis...', 'info');
      await runClaudeAnalysis(transcriptToAnalyze);
    }, 8000);
  };

  // --- SANDBOX BACKUP GENERATOR ---
  const generateSandboxResult = (transcriptText, meetingTypeOverride = '') => {
    const isStandup = transcriptText.toLowerCase().includes('standup') || transcriptText.toLowerCase().includes('daily') || meetingTypeOverride === 'Daily Standup';
    const hasBob = transcriptText.toLowerCase().includes('bob');
    
    if (isStandup) {
      return {
        summary: "Daily standup meeting to sync on tasks. Fiona reported that the signup hotfix v1.2 is completed and live. George is debugging an iOS memory leak in the websockets and Evan will compile local readme configurations.",
        meetingType: "Daily Standup",
        duration: "15 mins",
        participants: [
          { name: "Evan", role: "Tech Lead" },
          { name: "Fiona", role: "Backend Dev" },
          { name: "George", role: "Mobile Dev" }
        ],
        keyPoints: [
          "Fiona's hotfix resolves crucial user onboarding blocks",
          "George needs manual profiling for socket streams"
        ],
        decisions: [
          "Promoted v1.2 hotfix directly to production dashboard",
          "Agreed to hold off socket refactors until leak is profiled"
        ],
        tasks: [
          { id: `t_sb_${Date.now()}_1`, title: "Fix memory leak in iOS websocket handler", assignee: "George", priority: "High", dueDate: "2026-06-26", status: "open" },
          { id: `t_sb_${Date.now()}_2`, title: "Deploy v1.2 hotfix for user signups", assignee: "Fiona", priority: "High", dueDate: "2026-06-25", status: "completed" },
          { id: `t_sb_${Date.now()}_3`, title: "Update developer readme for local setup", assignee: "Evan", priority: "Low", dueDate: "2026-06-28", status: "open" }
        ],
        sentiment: "Neutral",
        nextMeeting: "Daily Standup on 2026-06-26 at 09:30 AM"
      };
    } else {
      return {
        summary: "Q3 roadmap review focused on product releases. Bob outlined progress on PostgreSQL replica databases aiming for 50ms latency. Charlie concluded UI designs and Diana formulated Q3 QA matrices.",
        meetingType: "Product Review",
        duration: "45 mins",
        participants: [
          { name: "Alice", role: "Product Manager" },
          { name: "Bob", role: "Lead Architect" },
          { name: "Charlie", role: "Frontend Dev" },
          { name: "Diana", role: "QA Lead" }
        ],
        keyPoints: [
          "Roadmap timeline targeting mid-July",
          "Telemetry infrastructure needs complete GDPR audit",
          "Replica database sync threshold capped at 50ms lag limit"
        ],
        decisions: [
          "Sanctioned design outlines created by Charlie",
          "Selected PostgreSQL DB replication models",
          "Enforced font guidelines across all component layouts"
        ],
        tasks: [
          { id: `t_sb_${Date.now()}_4`, title: "Create UI mockups for new dashboard", assignee: "Charlie", priority: "High", dueDate: "2026-06-30", status: "completed" },
          { id: `t_sb_${Date.now()}_5`, title: "Write API contract documentation", assignee: "Alice", priority: "Medium", dueDate: "2026-07-02", status: "open" },
          { id: `t_sb_${Date.now()}_6`, title: "Set up CI/CD pipeline template", assignee: "Bob", priority: "High", dueDate: "2026-07-05", status: "open" },
          { id: `t_sb_${Date.now()}_7`, title: "Draft test plan for user feedback integration", assignee: "Diana", priority: "Low", dueDate: "2026-07-08", status: "open" },
          { id: `t_sb_${Date.now()}_8`, title: "Set up production DB replica", assignee: "Bob", priority: "High", dueDate: "2026-06-28", status: "completed" },
          { id: `t_sb_${Date.now()}_9`, title: "Implement login analytics tracking", assignee: "Charlie", priority: "Low", dueDate: "2026-07-03", status: "open" }
        ],
        sentiment: "Positive",
        nextMeeting: "Q3 Sprint Planning on 2026-07-01 at 10:00 AM"
      };
    }
  };

  // Helper: Extract JSON from Claude's markdown/text output
  const extractJSON = (text) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const cleaned = text.substring(start, end + 1);
        try {
          return JSON.parse(cleaned);
        } catch (innerErr) {
          throw new Error("Extracted text was not valid JSON");
        }
      }
      throw new Error("Could not find JSON boundary blocks in the response");
    }
  };

  // Helper: Validate json format
  const validateResult = (json) => {
    const required = ['summary', 'meetingType', 'duration', 'participants', 'keyPoints', 'decisions', 'tasks', 'sentiment', 'nextMeeting'];
    for (const key of required) {
      if (!(key in json)) {
        throw new Error(`AI response is missing the required attribute: '${key}'`);
      }
    }
  };

  // --- RUN CLAUDE API ANALYSIS ---
  const runClaudeAnalysis = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) {
      showToast('Please paste a transcript first or load sample data.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let finalResult = null;

      if (useSandbox) {
        // Simulated artificial delay for realistic premium visual feel
        await new Promise(resolve => setTimeout(resolve, 2000));
        finalResult = generateSandboxResult(transcriptText);
      } else {
        const activeKey = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY || window.VITE_ANTHROPIC_API_KEY;
        if (!activeKey) {
          throw new Error("Anthropic API Key is missing. Enter your key in settings or toggle Sandbox Mode.");
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': activeKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: [
              { role: 'user', content: `Analyze this transcript:\n\n${transcriptText}` }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Claude API returned status ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.content[0].text;
        finalResult = extractJSON(responseText);
      }

      validateResult(finalResult);

      const meetingId = `meeting_${Date.now()}`;
      const formattedTasks = (finalResult.tasks || []).map((taskItem, index) => ({
        ...taskItem,
        id: taskItem.id || `task_${meetingId}_${index}`,
        meetingId: meetingId,
        status: taskItem.status || 'open'
      }));

      const newMeeting = {
        id: meetingId,
        title: `${finalResult.meetingType || 'Meeting'} Analysis - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        summary: finalResult.summary,
        meetingType: finalResult.meetingType,
        duration: finalResult.duration,
        participants: finalResult.participants,
        keyPoints: finalResult.keyPoints,
        decisions: finalResult.decisions,
        tasks: formattedTasks,
        sentiment: finalResult.sentiment,
        nextMeeting: finalResult.nextMeeting,
        rawTranscript: transcriptText
      };

      await apiFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(newMeeting)
      });
      await fetchMeetings();
      showToast('Transcript successfully analyzed and logged!', 'success');
      setActiveTab('analyze');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'API call failed. Falling back to sandbox simulation.', 'error');
      
      // Automatic Fallback on error
      const mockResult = generateSandboxResult(transcriptText);
      const meetingId = `meeting_fallback_${Date.now()}`;
      const formattedTasks = mockResult.tasks.map((taskItem, index) => ({
        ...taskItem,
        id: `task_${meetingId}_${index}`,
        meetingId: meetingId,
        status: 'open'
      }));

      const fallbackMeeting = {
        id: meetingId,
        title: `[Sandbox Fallback] ${mockResult.meetingType} - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        summary: mockResult.summary,
        meetingType: mockResult.meetingType,
        duration: mockResult.duration,
        participants: mockResult.participants,
        keyPoints: mockResult.keyPoints,
        decisions: mockResult.decisions,
        tasks: formattedTasks,
        sentiment: mockResult.sentiment,
        nextMeeting: mockResult.nextMeeting,
        rawTranscript: transcriptText
      };

      try {
        await apiFetch('/api/meetings', {
          method: 'POST',
          body: JSON.stringify(fallbackMeeting)
        });
        await fetchMeetings();
        showToast('Loaded sandbox fallback data.', 'info');
        setActiveTab('analyze');
      } catch (fallbackErr) {
        showToast('Failed to save fallback data to database.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- KANBAN BOARD LOGIC ---
  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await fetchMeetings();
      showToast(`Task updated to ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  // Drag and Drop integration
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleMoveTask(taskId, targetStatus);
    }
  };

  // --- SETTINGS KEY SAVE ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    window.localStorage.setItem('meetmind_api_key', apiKey);
    setShowSettings(false);
    showToast('Anthropic API Configuration updated.', 'success');
  };

  // Clear local storage / resetting meetings
  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all meetings? This will delete all meetings and clear your dashboard.')) {
      try {
        for (const meet of meetings) {
          await apiFetch(`/api/meetings/${meet.id}`, { method: 'DELETE' });
        }
        setMeetings([]);
        setCurrentMeeting(null);
        setAnalysisResult(null);
        showToast('All meetings successfully deleted from database.', 'info');
      } catch (err) {
        showToast('Failed to clear database meetings.', 'error');
      }
    }
  };

  // --- FILTERED TASKS CALCULATIONS ---
  const filteredTasks = tasks.filter(task => {
    const searchMatch = task.title.toLowerCase().includes(taskSearch.toLowerCase());
    const priorityMatch = priorityFilter === 'All' || task.priority === priorityFilter;
    const assigneeMatch = assigneeFilter === 'All' || task.assignee.toLowerCase() === assigneeFilter.toLowerCase();
    return searchMatch && priorityMatch && assigneeMatch;
  });

  // Extract all unique assignees for dropdown filter
  const uniqueAssignees = Array.from(new Set([
    ...tasks.map(t => t.assignee),
    ...(userSession?.useCase === 'business' ? (userSession?.details?.members || []).map(m => m.name) : []),
    ...(userSession?.useCase === 'personal' ? [userSession?.details?.name] : [])
  ])).filter(Boolean);

  // --- STATS AND ANALYTICS CALCULATIONS ---
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasksCount = tasks.filter(t => t.status === 'in_progress').length;
  const openTasksCount = tasks.filter(t => t.status === 'open').length;
  const pendingTasksCount = openTasksCount + inProgressTasksCount;

  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Chart stats calculations
  const highPriorityCount = tasks.filter(t => t.priority === 'High').length;
  const mediumPriorityCount = tasks.filter(t => t.priority === 'Medium').length;
  const lowPriorityCount = tasks.filter(t => t.priority === 'Low').length;
  const maxPriorityCount = Math.max(highPriorityCount, mediumPriorityCount, lowPriorityCount, 1);

  // Workload distributions
  const workloadByPerson = tasks.reduce((acc, task) => {
    const name = task.assignee || 'Unassigned';
    if (!acc[name]) {
      acc[name] = { total: 0, completed: 0, open: 0 };
    }
    acc[name].total += 1;
    if (task.status === 'completed') acc[name].completed += 1;
    else acc[name].open += 1;
    return acc;
  }, {});

  // Weekly meetings trend calculations (mock weeks based on dates)
  const meetingsByDate = meetings.reduce((acc, m) => {
    const dateStr = m.date || '2026-06-25';
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  // AI Productivity insights dynamically computed based on backlog
  const generateAIInsights = () => {
    if (totalTasksCount === 0) return "No task indicators loaded. Analyze transcripts to establish insights.";
    
    let insights = [];
    
    // Workload check
    const heavyWorkers = Object.entries(workloadByPerson).filter(([_, info]) => info.open > 2);
    if (heavyWorkers.length > 0) {
      const names = heavyWorkers.map(w => w[0]).join(', ');
      insights.push(`**Workload bottleneck detected**: ${names} currently have more than 2 pending tasks. Recommend delegating pending action items to balance outputs.`);
    } else {
      insights.push(`**Balanced Task Allocation**: Workload is evenly distributed among active team participants.`);
    }

    // Completion rate check
    if (completionRate < 40) {
      insights.push(`**Low Backlog Clearance**: The completion rate is under 40%. Consider shifting team focus to clearing existing high-priority bottlenecks before starting new meetings.`);
    } else {
      insights.push(`**High Productivity Flow**: Completion rate is healthy at ${completionRate}%. Project velocity looks steady.`);
    }

    // Priority ratio
    const highRatio = Math.round((highPriorityCount / totalTasksCount) * 100);
    if (highRatio > 50) {
      insights.push(`**Critical Urgency Spike**: Over 50% of outstanding items are flagged as High Priority. Verify if standard sprint scopes are being inflated with urgent labels.`);
    }

    // Sentiment check
    const positiveCount = meetings.filter(m => m.sentiment === 'Positive').length;
    const ratioPos = Math.round((positiveCount / (meetings.length || 1)) * 100);
    if (ratioPos > 60) {
      insights.push(`**Team Health Insight**: Dynamic alignment is outstanding. Over ${ratioPos}% of analyzed meetings show positive collaborative sentiment.`);
    }

    return insights;
  };

  const insightsList = generateAIInsights();

  // Load sample transcript into text area
  const handleLoadSample = (key) => {
    if (SAMPLE_TRANSCRIPTS[key]) {
      setTranscriptInput(SAMPLE_TRANSCRIPTS[key]);
      showToast(`Loaded "${key === 'productReview' ? 'Product Review' : 'Daily Standup'}" sample transcript.`, 'info');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification Deck */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z"/></svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v5a1 1 0 11-2 0V5zm1 9a1 1 0 100-2 1 1 0 000 2z"/></svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {!userSession || !userSession.useCase || !userSession.details ? (
        <div className="onboarding-container">
          {onboardingStep === 1 && (
            <div className="onboarding-card">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.png" alt="MeetMind Logo" style={{ width: '100%', maxWidth: '180px', height: 'auto', objectFit: 'contain' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '-4px' }}>AI Meeting Intelligence</span>
              </div>
              
              <div className="onboarding-tabs">
                <button 
                  type="button" 
                  onClick={() => setAuthMode('register')} 
                  className={`onboarding-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                >
                  Register
                </button>
                <button 
                  type="button" 
                  onClick={() => setAuthMode('login')} 
                  className={`onboarding-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                >
                  Login
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="name@company.com" 
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)} 
                    required 
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    placeholder="••••••••" 
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)} 
                    required 
                  />
                </div>

                {authMode === 'register' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      placeholder="••••••••" 
                      value={authConfirmPassword} 
                      onChange={(e) => setAuthConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px', padding: '14px' }}>
                  {authMode === 'register' ? 'Create Account' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="onboarding-card">
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'white' }}>Choose Workspace Type</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>How will you be utilizing the MeetMind Intelligence platform?</p>
              </div>

              <div className="onboarding-steps">
                <span className="onboarding-step-dot" />
                <span className="onboarding-step-dot active" />
                <span className="onboarding-step-dot" />
              </div>

              <div className="usecase-grid">
                <div 
                  className={`usecase-card ${useCase === 'business' ? 'selected' : ''}`}
                  onClick={() => setUseCase('business')}
                >
                  <div style={{ padding: '14px', background: 'rgba(196,164,104,0.06)', borderRadius: '50%' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '6px' }}>Business Use</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Teams, companies, and collaborative client meetings.</p>
                  </div>
                </div>

                <div 
                  className={`usecase-card ${useCase === 'personal' ? 'selected' : ''}`}
                  onClick={() => setUseCase('personal')}
                >
                  <div style={{ padding: '14px', background: 'rgba(196,164,104,0.06)', borderRadius: '50%' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ color: 'white', fontSize: '1rem', marginBottom: '6px' }}>Personal Use</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Individual productivity, study sync, and personal workflows.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setOnboardingStep(1)}
                  style={{ padding: '10px 20px' }}
                >
                  Back
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  disabled={!useCase} 
                  onClick={() => setOnboardingStep(3)}
                  style={{ padding: '10px 24px', opacity: useCase ? 1 : 0.5, cursor: useCase ? 'pointer' : 'not-allowed' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="onboarding-card">
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'white' }}>Workspace Profile</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure registration details to initialize your workspace analytics.</p>
              </div>

              <div className="onboarding-steps">
                <span className="onboarding-step-dot" />
                <span className="onboarding-step-dot" />
                <span className="onboarding-step-dot active" />
              </div>

              <form onSubmit={handleCompleteSetup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {useCase === 'business' ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Company / Team Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Acme Corporation" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Team Members Details</span>
                        <button 
                          type="button" 
                          onClick={() => setTeamMembers([...teamMembers, { name: '', email: '' }])}
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          + Add Member
                        </button>
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {teamMembers.map((member, index) => (
                          <div key={index} className="member-row">
                            <input 
                              type="text" 
                              className="input-field" 
                              placeholder="Name" 
                              value={member.name} 
                              onChange={(e) => {
                                const updated = [...teamMembers];
                                updated[index].name = e.target.value;
                                setTeamMembers(updated);
                              }}
                              required={index === 0}
                            />
                            <input 
                              type="email" 
                              className="input-field" 
                              placeholder="email@company.com" 
                              value={member.email} 
                              onChange={(e) => {
                                const updated = [...teamMembers];
                                updated[index].email = e.target.value;
                                setTeamMembers(updated);
                              }}
                              required={index === 0}
                            />
                            {teamMembers.length > 1 && (
                              <button 
                                type="button" 
                                className="btn-secondary" 
                                onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== index))}
                                style={{ padding: '8px 12px', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="John Doe" 
                        value={personalName} 
                        onChange={(e) => setPersonalName(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role / Occupation</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Independent Consultant / Freelancer" 
                        value={personalRole} 
                        onChange={(e) => setPersonalRole(e.target.value)} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Primary Focus Area</label>
                      <select 
                        className="input-field" 
                        value={personalGoal} 
                        onChange={(e) => setPersonalGoal(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="General Productivity">General Productivity</option>
                        <option value="Client Projects">Client Work & Freelancing</option>
                        <option value="Academic Studies">Academic Studies & Lectures</option>
                        <option value="Personal Ventures">Personal Ventures & Startups</option>
                      </select>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setOnboardingStep(2)}
                    style={{ padding: '10px 20px' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ padding: '10px 24px' }}
                  >
                    Complete Setup
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* --- SIDEBAR NAVIGATION --- */}
          <aside className="sidebar glass-panel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <img src="/logo.png" alt="MeetMind Logo" style={{ width: '100%', maxWidth: '170px', height: 'auto', objectFit: 'contain' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', tracking: '0.12em', paddingLeft: '2px' }}>AI Meeting Intelligence</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('analyze')}
                className={`btn-secondary ${activeTab === 'analyze' ? 'active-tab' : ''}`}
                style={{ 
                  justifyContent: 'flex-start',
                  border: activeTab === 'analyze' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: activeTab === 'analyze' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === 'analyze' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Analyze Transcript
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`btn-secondary ${activeTab === 'tasks' ? 'active-tab' : ''}`}
                style={{ 
                  justifyContent: 'flex-start',
                  border: activeTab === 'tasks' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: activeTab === 'tasks' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === 'tasks' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Task Board
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`btn-secondary ${activeTab === 'history' ? 'active-tab' : ''}`}
                style={{ 
                  justifyContent: 'flex-start',
                  border: activeTab === 'history' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === 'history' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Meeting History
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`btn-secondary ${activeTab === 'analytics' ? 'active-tab' : ''}`}
                style={{ 
                  justifyContent: 'flex-start',
                  border: activeTab === 'analytics' ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: activeTab === 'analytics' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === 'analytics' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Analytics Dashboard
              </button>
            </nav>

            {/* Workspace & Team Details inside Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {userSession.useCase === 'business' ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="sidebar-section-title" style={{ marginTop: 0 }}>Organization</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                      <span>{userSession.details.companyName}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="sidebar-section-title" style={{ marginTop: '10px' }}>Workspace Members ({userSession.details.members?.length || 0})</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                      {userSession.details.members?.map((m, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                          <div className="avatar" style={{ width: '18px', height: '18px', fontSize: '0.6rem' }}>
                            {m.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500, lineHeight: 1.2 }}>{m.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>{m.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className="sidebar-section-title" style={{ marginTop: 0 }}>Personal Profile</span>
                    <div className="sidebar-profile">
                      <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                        {userSession.details.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{userSession.details.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{userSession.details.role}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px', marginTop: '2px' }}>
                      Goal: {userSession.details.goal}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* System Settings & Setup indicators */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sandbox Mode:</span>
                <button 
                  onClick={() => {
                    setUseSandbox(!useSandbox);
                    showToast(useSandbox ? 'Switched to Live Claude API mode' : 'Switched to Sandbox Simulation mode', 'info');
                  }}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '999px',
                    background: useSandbox ? 'var(--accent)' : 'var(--bg-tertiary)',
                    position: 'relative',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.3s'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '3px',
                    left: useSandbox ? '21px' : '3px',
                    transition: 'left 0.3s'
                  }}/>
                </button>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
              >
                Claude API Config
              </button>
              <button 
                onClick={handleSignOut}
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(196, 164, 104, 0.2)', color: 'var(--accent)' }}
              >
                Sign Out
              </button>
              <button 
                onClick={handleResetData}
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
              >
                Reset Dashboard
              </button>
            </div>
          </aside>

      {/* Settings Modal popover */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '32px', width: '90%', maxWidth: '450px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white' }}>Claude API Settings</h3>
              <button type="button" onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Anthropic Claude API Key:</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="sk-ant-..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                * Standard keys are managed in local client storage. The API runs via frontend browser fetches. Leave empty to use system defaults if pre-configured.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Selected Model:</label>
              <input type="text" className="input-field" value="claude-sonnet-4-6" readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowSettings(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>Save Config</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="main-content">
        
        {/* --- TAB 1: ANALYZE TRANSCRIPT --- */}
        {activeTab === 'analyze' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Meeting Analysis Suite</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Upload audio recordings, join virtual meeting bots, or paste text transcripts to trigger real-time AI summaries.</p>
            </header>

            <div className="dashboard-grid">
              
              {/* Left Column - Input Panels */}
              <div className="grid-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Choose Input Method</h3>
                  
                  {/* Internal tabs for methods */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <button 
                      onClick={() => setInputMethod('text')} 
                      className={`btn-secondary ${inputMethod === 'text' ? 'btn-primary' : ''}`}
                      style={{ padding: '10px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      Paste Text
                    </button>
                    <button 
                      onClick={() => setInputMethod('audio')}
                      className={`btn-secondary ${inputMethod === 'audio' ? 'btn-primary' : ''}`}
                      style={{ padding: '10px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      Audio File
                    </button>
                    <button 
                      onClick={() => setInputMethod('link')}
                      className={`btn-secondary ${inputMethod === 'link' ? 'btn-primary' : ''}`}
                      style={{ padding: '10px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                    >
                      Meeting Link
                    </button>
                  </div>

                  {/* PASTING TRANCRIPT BOX */}
                  {inputMethod === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paste raw transcript text:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleLoadSample('productReview')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Sample 1: Product Sync</button>
                          <button onClick={() => handleLoadSample('dailyStandup')} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Sample 2: Daily Standup</button>
                        </div>
                      </div>
                      <textarea 
                        className="input-field textarea-field" 
                        placeholder="Alice: Hello everyone...
Bob: I will write the contract design by Friday." 
                        value={transcriptInput}
                        onChange={(e) => setTranscriptInput(e.target.value)}
                      />
                      <button 
                        onClick={() => runClaudeAnalysis(transcriptInput)} 
                        disabled={isLoading}
                        className="btn-primary" 
                        style={{ alignSelf: 'flex-end' }}
                      >
                        {isLoading ? <div className="spinner" /> : 'Analyze with Claude'}
                      </button>
                    </div>
                  )}

                  {/* AUDIO FILE AND LINK PICKER */}
                  {inputMethod === 'audio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', padding: '24px 10px', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <path d="M12 2v20M17 5v14M22 8v8M7 8v8M2 10v4"/>
                        </svg>
                        
                        <div style={{ textAlign: 'center' }}>
                          <h4 style={{ color: 'white', marginBottom: '4px' }}>Upload Audio Recording</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Supports WAV or MP3 files (mock-transcribed immediately)</p>
                        </div>

                        <input 
                          type="file" 
                          id="audio-uploader" 
                          accept="audio/*" 
                          onChange={handleAudioUpload} 
                          style={{ display: 'none' }} 
                        />
                        
                        <label htmlFor="audio-uploader" className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px' }}>
                          Choose File
                        </label>
                      </div>

                      {/* URL input field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Or Paste Audio File URL Link:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="url" 
                            className="input-field" 
                            placeholder="https://example.com/recordings/meeting_sync.mp3" 
                            value={audioUrl} 
                            onChange={(e) => setAudioUrl(e.target.value)} 
                          />
                          <button 
                            onClick={handleProcessAudioUrl}
                            disabled={audioUploading || !audioUrl.trim()}
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          >
                            Process
                          </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          * Enter a URL containing 'standup' or 'daily' to transcribe the Daily Standup sample dataset.
                        </p>
                      </div>

                      {audioUploading && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <span>Transcribing audio content...</span>
                            <span>{audioProgress}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div className="progress-bar-fill" style={{ width: `${audioProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {transcriptInput && (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Generated Mock Transcript:</span>
                          <textarea className="input-field" style={{ minHeight: '100px', fontSize: '0.85rem', lineBreak: 'anywhere' }} value={transcriptInput} readOnly />
                          <button onClick={() => runClaudeAnalysis(transcriptInput)} disabled={isLoading} className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                            {isLoading ? <div className="spinner" /> : 'Analyze with Claude'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MEETING LINK RECORDER */}
                  {inputMethod === 'link' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {!isSimulating ? (
                        <form onSubmit={handleStartSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Meeting URL Link:</label>
                              <input 
                                type="url" 
                                className="input-field" 
                                placeholder="https://zoom.us/j/1234567890 or google.meet/abc-def" 
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mock Transcription Source:</label>
                              <select 
                                className="input-field" 
                                value={selectedMockSource} 
                                onChange={(e) => setSelectedMockSource(e.target.value)}
                                style={{ cursor: 'pointer' }}
                              >
                                <option value="productReview">Sample 1: Product Review (4 participants, 6 tasks)</option>
                                <option value="dailyStandup">Sample 2: Daily Standup (3 participants, 3 tasks)</option>
                              </select>
                            </div>
                          </div>
                          
                          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                            Join & Record
                          </button>
                        </form>
                      ) : (
                        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                          {/* Floating Bot animation */}
                          <div className="floating-bot" style={{ position: 'relative' }}>
                            <div className="p-4" style={{ background: 'var(--accent-glow)', border: '2px solid var(--accent)', borderRadius: '50%' }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2"/>
                                <path d="M12 2v4M12 6a3 3 0 0 0-3 3v2h6V9a3 3 0 0 0-3-3z"/>
                              </svg>
                            </div>
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px' }}>
                              <span className="recording-pulse" />
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h4 style={{ color: 'white', fontSize: '1.1rem' }}>
                              {simulationStep === 1 && 'Connecting MeetMind bot to session...'}
                              {simulationStep === 2 && `Recording audio streams... (${simDuration}s)`}
                              {simulationStep === 3 && 'Transcribing voice data feeds...'}
                              {simulationStep === 4 && 'Final parsing & analysis with Claude...'}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {simulationStep === 1 && 'Negotiating permissions and joining workspace'}
                              {simulationStep === 2 && 'Pulsing voice vectors compiled dynamically'}
                              {simulationStep === 3 && 'Formatting text dialogue structure'}
                              {simulationStep === 4 && 'Querying Claude API endpoint models'}
                            </p>
                          </div>

                          {/* Sound wave visualizer in step 2 */}
                          {simulationStep === 2 && (
                            <div className="wave-container">
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                              <span className="wave-bar" />
                            </div>
                          )}

                          {/* Progress slider bar */}
                          <div style={{ width: '100%', maxWidth: '400px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div className="progress-bar-fill" style={{ width: `${simulationStep * 25}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Welcome / API Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Loader status visual */}
                {isLoading && (
                  <div className="glass-panel" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ color: 'white', marginBottom: '8px' }}>Analyzing Transcript</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        Calling Anthropic Claude API models to compile summary grids...
                      </p>
                    </div>
                  </div>
                )}

                {/* Active parsed Result */}
                {!isLoading && analysisResult && (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div>
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-light)', marginBottom: '8px' }}>
                          {analysisResult.meetingType || 'Session'}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginTop: '4px' }}>
                          {analysisResult.title || 'Parsed Overview'}
                        </h3>
                      </div>
                      <span className={`badge badge-${analysisResult.sentiment?.toLowerCase() || 'neutral'}`} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                        {analysisResult.sentiment || 'Neutral'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                      <div><strong>Duration:</strong> {analysisResult.duration || 'N/A'}</div>
                      <div><strong>Date:</strong> {analysisResult.date || 'N/A'}</div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Summary</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {analysisResult.summary}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Key Decisions</h4>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none' }}>
                        {analysisResult.decisions && analysisResult.decisions.map((dec, idx) => (
                          <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--status-completed)' }}>✓</span>
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Key Discussion Points</h4>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none' }}>
                        {analysisResult.keyPoints && analysisResult.keyPoints.map((kp, idx) => (
                          <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent)' }}>•</span>
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Participants ({analysisResult.participants?.length || 0})</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {analysisResult.participants && analysisResult.participants.map((p, idx) => (
                          <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px' }}>
                            <div className="avatar">{p.name ? p.name.substring(0, 2) : '?'}</div>
                            <div>
                              <div style={{ color: 'white', fontWeight: 500 }}>{p.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{p.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {analysisResult.nextMeeting && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Next Scheduled Meeting:</span>
                        <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{analysisResult.nextMeeting}</span>
                      </div>
                    )}

                  </div>
                )}

                {/* Empty welcome state */}
                {!isLoading && !analysisResult && (
                  <div className="glass-panel" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', minHeight: '300px', textAlign: 'center', gap: '16px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <div>
                      <h4 style={{ color: 'white', marginBottom: '4px' }}>No Active Analysis</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                        Paste transcripts or run simulations on the left to extract intelligence insights.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: KANBAN TASK BOARD --- */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Action Item Board</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage and track responsibilities assigned across all analyzed sessions.</p>
              </div>
            </header>

            {/* Filters panel */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flexGrow: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Search Title:</span>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }} 
                  placeholder="Filter task titles..." 
                  value={taskSearch} 
                  onChange={(e) => setTaskSearch(e.target.value)} 
                />
              </div>

              {/* Priority */}
              <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Priority:</span>
                <select 
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Assignee */}
              <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assignee:</span>
                <select 
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                  value={assigneeFilter} 
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {uniqueAssignees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Sync Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: 'auto', alignSelf: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', display: 'block', height: '14px' }}></span>
                <button 
                  onClick={() => {
                    setShowCalendarModal(true);
                    setCalendarSyncLogs([]);
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Google Calendar Sync
                </button>
              </div>
            </div>

            {/* Board stats summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Board</span>
                <span className="stats-number">{totalTasksCount}</span>
              </div>
              <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--status-completed)', fontSize: '0.85rem' }}>Completed</span>
                <span className="stats-number" style={{ color: 'var(--status-completed)' }}>{completedTasksCount}</span>
              </div>
              <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--status-progress)', fontSize: '0.85rem' }}>In Progress</span>
                <span className="stats-number" style={{ color: 'var(--status-progress)' }}>{inProgressTasksCount}</span>
              </div>
              <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending</span>
                <span className="stats-number">{pendingTasksCount}</span>
              </div>
              <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontSize: '0.85rem' }}>Clearance Rate</span>
                <span className="stats-number" style={{ color: 'var(--accent-light)' }}>{completionRate}%</span>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="kanban-board">
              
              {/* Column 1: Open */}
              <div 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'open')}
              >
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-open)' }} />
                    <h3 style={{ fontSize: '1rem', color: 'white' }}>Open Items</h3>
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {filteredTasks.filter(t => t.status === 'open').length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {filteredTasks.filter(t => t.status === 'open').map(task => (
                    <div 
                      key={task.id} 
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className={`badge badge-${task.priority?.toLowerCase() || 'low'}`}>
                          {task.priority || 'Low'}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => handleMoveTask(task.id, 'in_progress')} 
                            className="btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--status-progress)' }}
                            title="Start Task"
                          >
                            →
                          </button>
                        </div>
                      </div>
                      
                      <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500, lineHeight: 1.4 }}>{task.title}</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem' }}>
                            {task.assignee ? task.assignee.substring(0, 2) : '?'}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.assignee}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.dueDate}</span>
                          <a 
                            href={getGoogleCalendarUrl(task, currentMeeting?.title)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-secondary"
                            style={{ 
                              padding: '2px 6px', 
                              fontSize: '0.65rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              textDecoration: 'none', 
                              color: 'var(--accent)',
                              borderColor: 'rgba(196, 164, 104, 0.2)',
                              background: 'transparent'
                            }}
                            title="Add to Google Calendar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Sync
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === 'open').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No open items.</div>
                  )}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'in_progress')}
              >
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-progress)' }} />
                    <h3 style={{ fontSize: '1rem', color: 'white' }}>In Progress</h3>
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {filteredTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {filteredTasks.filter(t => t.status === 'in_progress').map(task => (
                    <div 
                      key={task.id} 
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className={`badge badge-${task.priority?.toLowerCase() || 'low'}`}>
                          {task.priority || 'Low'}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => handleMoveTask(task.id, 'open')} 
                            className="btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            title="Move back"
                          >
                            ←
                          </button>
                          <button 
                            onClick={() => handleMoveTask(task.id, 'completed')} 
                            className="btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--status-completed)' }}
                            title="Complete Task"
                          >
                            ✓
                          </button>
                        </div>
                      </div>
                      
                      <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500, lineHeight: 1.4 }}>{task.title}</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem' }}>
                            {task.assignee ? task.assignee.substring(0, 2) : '?'}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.assignee}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.dueDate}</span>
                          <a 
                            href={getGoogleCalendarUrl(task, currentMeeting?.title)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-secondary"
                            style={{ 
                              padding: '2px 6px', 
                              fontSize: '0.65rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              textDecoration: 'none', 
                              color: 'var(--accent)',
                              borderColor: 'rgba(196, 164, 104, 0.2)',
                              background: 'transparent'
                            }}
                            title="Add to Google Calendar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Sync
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === 'in_progress').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No in-progress items.</div>
                  )}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div 
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'completed')}
              >
                <div className="kanban-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-completed)' }} />
                    <h3 style={{ fontSize: '1rem', color: 'white' }}>Completed</h3>
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    {filteredTasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                  {filteredTasks.filter(t => t.status === 'completed').map(task => (
                    <div 
                      key={task.id} 
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      style={{ opacity: 0.75 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className={`badge badge-${task.priority?.toLowerCase() || 'low'}`} style={{ opacity: 0.6 }}>
                          {task.priority || 'Low'}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => handleMoveTask(task.id, 'in_progress')} 
                            className="btn-secondary" 
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            title="Re-open Task"
                          >
                            ←
                          </button>
                        </div>
                      </div>
                      
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'line-through', lineHeight: 1.4 }}>{task.title}</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div className="avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem', opacity: 0.6 }}>
                            {task.assignee ? task.assignee.substring(0, 2) : '?'}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.assignee}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.dueDate}</span>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.status === 'completed').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No completed items yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 3: MEETING HISTORY --- */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Meeting Log</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Review historically tracked meetings, transcripts, and intelligence datasets.</p>
            </header>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {meetings.map((meet) => {
                  const mTasks = meet.tasks || [];
                  const compCount = mTasks.filter(t => t.status === 'completed').length;
                  
                  return (
                    <div 
                      key={meet.id} 
                      onClick={() => {
                        setCurrentMeeting(meet);
                        showToast(`Reloaded data for "${meet.title}"`, 'info');
                        setActiveTab('analyze');
                      }}
                      className="glass-card" 
                      style={{ 
                        padding: '20px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '16px',
                        border: currentMeeting?.id === meet.id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.04)',
                        background: currentMeeting?.id === meet.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(31, 41, 55, 0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '1.1rem', color: 'white' }}>{meet.title}</h3>
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-light)' }}>
                            {meet.meetingType}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>{meet.duration}</span>
                          <span>{meet.participants?.length || 0} participants</span>
                          <span>{meet.date}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Tasks breakdown indicators */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                            {compCount} / {mTasks.length} Completed
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {mTasks.length - compCount} action items pending
                          </span>
                        </div>

                        {/* Sentiment badge */}
                        <span className={`badge badge-${meet.sentiment?.toLowerCase() || 'neutral'}`} style={{ padding: '6px 12px' }}>
                          {meet.sentiment}
                        </span>

                        {/* Forward indicator */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}

                {meetings.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <h4>No records found.</h4>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Analyze transcripts to compile your history logs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: ANALYTICS DASHBOARD --- */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
              <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '8px' }}>Intelligence Analytics</h2>
              <p style={{ color: 'var(--text-secondary)' }}>High-level operational stats, task completion rates, and machine generated backlog indicators.</p>
            </header>

            {/* Analytics Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Analyzed Sessions</span>
                <div className="stats-number" style={{ fontSize: '2.5rem', marginTop: '8px', color: 'var(--accent-light)' }}>
                  {meetings.length}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Tasks Backlog</span>
                <div className="stats-number" style={{ fontSize: '2.5rem', marginTop: '8px' }}>
                  {totalTasksCount}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--status-completed)', fontSize: '0.85rem' }}>Completed Actions</span>
                <div className="stats-number" style={{ fontSize: '2.5rem', marginTop: '8px', color: 'var(--status-completed)' }}>
                  {completedTasksCount}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'white', fontSize: '0.85rem' }}>Average Clearance Rate</span>
                <div className="stats-number" style={{ fontSize: '2.5rem', marginTop: '8px', color: 'var(--accent)' }}>
                  {completionRate}%
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              
              {/* Donut Chart - Completion Rate */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>Task Completion Rate</h3>
                
                {totalTasksCount > 0 ? (
                  <>
                    <div className="donut-chart-wrapper">
                      <div 
                        className="donut-chart" 
                        style={{ 
                          background: `conic-gradient(var(--status-completed) 0% ${completionRate}%, var(--bg-tertiary) ${completionRate}% 100%)` 
                        }}
                      >
                        <div className="donut-chart-text">
                          <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{completionRate}%</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CLEARANCE</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'var(--status-completed)', borderRadius: '2px' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Completed ({completedTasksCount})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', background: 'var(--bg-tertiary)', borderRadius: '2px' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>Pending ({pendingTasksCount})</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '50px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No backlog data.</div>
                )}
              </div>

              {/* Bar Chart - Tasks by Priority */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>Tasks by Priority</h3>
                
                {totalTasksCount > 0 ? (
                  <div className="bar-chart-container">
                    <div className="bar-chart-col">
                      <div className="bar-chart-bar-wrapper">
                        <div className="bar-chart-bar" style={{ height: `${(highPriorityCount / maxPriorityCount) * 100}%`, background: 'var(--priority-high)' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{highPriorityCount}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High</span>
                    </div>

                    <div className="bar-chart-col">
                      <div className="bar-chart-bar-wrapper">
                        <div className="bar-chart-bar" style={{ height: `${(mediumPriorityCount / maxPriorityCount) * 100}%`, background: 'var(--priority-medium)' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{mediumPriorityCount}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium</span>
                    </div>

                    <div className="bar-chart-col">
                      <div className="bar-chart-bar-wrapper">
                        <div className="bar-chart-bar" style={{ height: `${(lowPriorityCount / maxPriorityCount) * 100}%`, background: 'var(--priority-low)' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{lowPriorityCount}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks priority data.</div>
                )}
              </div>

              {/* Workload Distribution Grid */}
              <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>Workload Allocation</h3>
                
                {Object.keys(workloadByPerson).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(workloadByPerson).map(([name, info]) => {
                      const pct = Math.round((info.completed / info.total) * 100) || 0;
                      return (
                        <div key={name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '28px', height: '28px' }}>{name.substring(0,2)}</div>
                            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>{name}</span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="workload-bar-bg">
                              <div className="workload-bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--status-completed)' : 'var(--accent)' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              <span>{info.completed} of {info.total} completed</span>
                              <span>{info.open} open action items</span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                            {pct}% done
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No workload data registered.</div>
                )}
              </div>

              {/* AI Productivity Insights */}
              <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Claude AI Productivity Insights
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '20px' }}>
                  {insightsList.map((ins, idx) => (
                    <div key={idx} style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {/* Convert bold markdown mockups for render */}
                      {ins.split('**').map((part, i) => (
                        i % 2 === 1 ? <strong key={i} style={{ color: 'white' }}>{part}</strong> : part
                      ))}
                    </div>
                  ))}
                  {insightsList.length === 0 && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No insights generated. Log some meetings first.</span>
                  )}
                </div>
              </div>

              {/* Weekly Trend graph */}
              <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'white', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>Weekly Action Item Clearance Trend</h3>
                
                <div className="trend-container">
                  {/* Grid Lines background */}
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'var(--border-color)', top: '25%' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'var(--border-color)', top: '50%' }} />
                  <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'var(--border-color)', top: '75%' }} />
                  
                  {/* Points */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '15%' }}>
                    <div className="trend-point" style={{ bottom: '15px' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Week 22</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '15%' }}>
                    <div className="trend-point" style={{ bottom: '40px' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Week 23</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '15%' }}>
                    <div className="trend-point" style={{ bottom: '65px' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Week 24</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '15%' }}>
                    <div className="trend-point" style={{ bottom: `${15 + completionRate * 0.9}px` }} />
                    <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 600, marginTop: '8px' }}>Current ({completionRate}%)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Google Calendar Sync Console Modal */}
      {showCalendarModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div className="glass-panel" style={{ padding: '32px', width: '90%', maxWidth: '500px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Google Workspace Calendar Sync
              </h3>
              <button type="button" onClick={() => setShowCalendarModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} disabled={isCalendarSyncing}>&times;</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This tool synchronizes all active <strong>Open</strong> and <strong>In Progress</strong> tasks to the Google Calendar workspace accounts associated with each assignee:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {Array.from(new Set(tasks.map(t => t.assignee))).filter(Boolean).map(name => {
                const email = `${name.toLowerCase().replace(/\s+/g, '')}@meetmind.com`;
                return (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    <span style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>{email}</span>
                  </div>
                );
              })}
            </div>

            {/* Sync Live Console logs */}
            {calendarSyncLogs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#07080a', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', height: '140px', overflowY: 'auto', color: '#c4a468' }}>
                {calendarSyncLogs.map((log, index) => (
                  <div key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{log}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowCalendarModal(false)} 
                className="btn-secondary" 
                style={{ padding: '8px 16px' }}
                disabled={isCalendarSyncing}
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={handleGoogleCalendarSync} 
                className="btn-primary" 
                style={{ padding: '8px 20px' }}
                disabled={isCalendarSyncing}
              >
                {isCalendarSyncing ? 'Syncing...' : 'Sync Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
