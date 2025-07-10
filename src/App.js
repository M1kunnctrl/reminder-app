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

  // Ask for notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  // Send email using EmailJS
  const sendEmailReminder = useCallback((task) => {
    const serviceID = 'service_ub5zfzq';
    const templateID = 'template_nbhstdp';
    const publicKey = 'VuvKgZynHbofGPr3I';

    const templateParams = {
      task_name: task.name,
      due_time: new Date(task.time).toLocaleString(),
      to_email: userEmail,
    };

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => console.log("✅ Email sent"))
      .catch((err) => console.error("❌ Email failed", err));
  }, [userEmail]);

  // Load user and tasks
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
      } catch (error) {
        console.error('Token decoding error:', error);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`tasks-${userEmail}`, JSON.stringify(tasks));
    }
  }, [tasks, userEmail]);

  // Set reminders and send emails
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (task.time <= now && !notifiedTaskIds.includes(task.id)) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ Task Reminder", {
              body: `${task.name} is due now!`,
              icon: "https://cdn-icons-png.flaticon.com/512/1087/1087924.png",
            });
          } else {
            alert(`⏰ Reminder: ${task.name}`);
          }

          sendEmailReminder(task);
          setNotifiedTaskIds((prev) => [...prev, task.id]);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, notifiedTaskIds, sendEmailReminder]);

  // Handle Google login
  const handleLoginSuccess = (credentialResponse) => {
    localStorage.setItem("user", JSON.stringify(credentialResponse));
    const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    const email = decoded.email;
    setUserEmail(email);
    setIsLoggedIn(true);
    const savedTasks = localStorage.getItem(`tasks-${email}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  };

  const handleLoginError = () => {
    console.log("Login Failed");
  };

  // Add task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (taskName.trim() === '' || reminderTime === '') return;

    const newTask = {
      id: Date.now(),
      name: taskName,
      time: new Date(reminderTime).getTime(),
    };

    setTasks([...tasks, newTask]);
    setTaskName('');
    setReminderTime('');
  };

  // Delete task
  const handleDeleteTask = (id) => {
    const updated = tasks.filter((task) => task.id !== id);
    setTasks(updated);
    setNotifiedTaskIds((prev) => prev.filter((taskId) => taskId !== id));
  };

  // Log out
  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserEmail('');
    setTasks([]);
    setNotifiedTaskIds([]);
  };

  return (
    <GoogleOAuthProvider clientId="619081886304-gjv69j78mqvau459g7taeehja7jto3pb.apps.googleusercontent.com">
      <div style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '500px', margin: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🕒 Reminder App</h1>

        {!isLoggedIn ? (
          <>
            <p>Sign in to manage your reminders.</p>
            <GoogleLogin onSuccess={handleLoginSuccess} onError={handleLoginError} />
          </>
        ) : (
          <>
            <form onSubmit={handleAddTask} style={{ marginBottom: '2rem' }}>
              <input
                type="text"
                placeholder="Enter task"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
              />
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem' }}
              />
              <button type="submit" style={{ padding: '0.5rem 1rem' }}>Add Task</button>
            </form>

            <h3>Your Tasks:</h3>
            <ul>
              {tasks.map((task) => (
                <li key={task.id} style={{ marginBottom: '10px' }}>
                  <strong>{task.name}</strong> — {new Date(task.time).toLocaleString()}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    style={{
                      marginLeft: '10px',
                      background: '#ff4d4d',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={handleLogout}
              style={{
                marginTop: '1.5rem',
                background: '#555',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🔒 Log Out
            </button>
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
