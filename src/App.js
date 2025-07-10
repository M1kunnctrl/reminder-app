import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import emailjs from '@emailjs/browser';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [notifiedTaskIds, setNotifiedTaskIds] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      try {
        const decoded = JSON.parse(atob(parsedUser.credential.split('.')[1]));
        const email = decoded.email;
        setIsLoggedIn(true);
        setUserEmail(email);
        const savedTasks = localStorage.getItem(`tasks-${email}`);
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      } catch (err) {
        console.error('Token decode error:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`tasks-${userEmail}`, JSON.stringify(tasks));
    }
  }, [tasks, userEmail]);

  const sendEmailReminder = useCallback((task) => {
    const templateParams = {
      task_name: task.name,
      due_time: new Date(task.time).toLocaleString(),
      to_email: userEmail,
    };

    emailjs.send(
      'service_ub5zfzq',
      'template_nbhstdp',
      templateParams,
      'VuvKgZynHbofGPr3I'
    ).then(() => console.log("📧 Email sent"));
  }, [userEmail]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.time <= now && !notifiedTaskIds.includes(task.id)) {
          if (Notification.permission === "granted") {
            new Notification("⏰ Reminder", {
              body: `${task.name} is due!`,
              icon: "https://cdn-icons-png.flaticon.com/512/1087/1087924.png",
            });
          } else {
            alert(`Reminder: ${task.name}`);
          }
          sendEmailReminder(task);
          setNotifiedTaskIds(prev => [...prev, task.id]);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, notifiedTaskIds, sendEmailReminder]);

  const handleLoginSuccess = (res) => {
    localStorage.setItem("user", JSON.stringify(res));
    const decoded = JSON.parse(atob(res.credential.split('.')[1]));
    const email = decoded.email;
    setUserEmail(email);
    setIsLoggedIn(true);
    const savedTasks = localStorage.getItem(`tasks-${email}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserEmail('');
    setTasks([]);
    setNotifiedTaskIds([]);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !reminderTime) return;
    const newTask = {
      id: Date.now(),
      name: taskName,
      time: new Date(reminderTime).getTime(),
    };
    setTasks([...tasks, newTask]);
    setTaskName('');
    setReminderTime('');
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setNotifiedTaskIds(notifiedTaskIds.filter(nid => nid !== id));
  };

  const appStyle = {
    background: darkMode ? '#111827' : '#f9fafb',
    color: darkMode ? '#f3f4f6' : '#111827',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'system-ui, sans-serif',
    position: 'relative',
  };

  const iconStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    cursor: 'pointer',
  };

  const inputStyle = {
    padding: '0.5rem',
    marginBottom: '1rem',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '5px',
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    margin: '0.5rem 0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: darkMode ? '#374151' : '#2563eb',
    color: '#fff',
  };

  return (
    <GoogleOAuthProvider clientId="619081886304-gjv69j78mqvau459g7taeehja7jto3pb.apps.googleusercontent.com">
      <div style={appStyle}>
        {/* 🌙 Light/Dark Toggle in Top-Right */}
        <span onClick={() => setDarkMode(!darkMode)} style={iconStyle}>
          {darkMode ? '☀️' : '🌙'}
        </span>

        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏰ Reminder App</h1>

        {!isLoggedIn ? (
          <div style={{ marginTop: '1rem' }}>
            <p>Sign in to manage tasks:</p>
            <GoogleLogin onSuccess={handleLoginSuccess} onError={() => alert("Login failed")} />
          </div>
        ) : (
          <>
            <form onSubmit={handleAddTask} style={{ marginTop: '1rem' }}>
              <input
                type="text"
                placeholder="Task name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>Add Task</button>
            </form>

            <h3 style={{ marginTop: '2rem' }}>📋 Your Tasks</h3>
            <ul style={{ paddingLeft: 0 }}>
              {tasks.map(task => (
                <li key={task.id} style={{ marginBottom: '1rem', listStyle: 'none' }}>
                  <div>
                    <strong>{task.name}</strong><br />
                    Due: {new Date(task.time).toLocaleString()}
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={{ ...buttonStyle, backgroundColor: '#dc2626', marginLeft: '1rem' }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: '#6b7280' }}>
              🔒 Logout
            </button>
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
