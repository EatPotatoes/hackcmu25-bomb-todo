import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------------
// To‑Do Or Die — 6‑page hackathon demo (single‑file React)
// Pages:
// 1) Login  2) Sign Up  3) Punishments  4) Tasks  5) Profile  6) Home/Bomb
// Routing: simple hash‑router so you can paste this right into Vite src/App.jsx
// Styling: Tailwind utility classes (no external CSS needed)
// Data: local state only (mock)
// ------------------------------------------------------------------

// tiny hash router
const routes = {
  login: "login",
  signup: "signup",
  punishments: "punishments",
  tasks: "tasks",
  profile: "profile",
  home: "home", // bomb page
};

function useHashRoute(defaultRoute = routes.home) {
  const [route, setRoute] = useState(() => (window.location.hash?.slice(1) || defaultRoute));
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash?.slice(1) || defaultRoute);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultRoute]);
  const nav = (to) => {
    if (!to.startsWith("#")) window.location.hash = `#${to}`;
    else window.location.hash = to;
  };
  return { route, nav };
}

// countdown hook
function useCountdown(untilTs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, untilTs - now);
  const s = Math.floor(ms/1000) % 60; const m = Math.floor(ms/60000) % 60; const h = Math.floor(ms/3600000) % 24; const d = Math.floor(ms/86400000);
  return { done: ms === 0, label: `${d}d ${h}h ${m}m ${s}s` };
}

// navbar visible on pages 3–6
function AppNav({ nav, route }) {
  const tabs = [
    { id: routes.home, label: "Home" },
    { id: routes.tasks, label: "Tasks" },
    { id: routes.punishments, label: "Punishments" },
    { id: routes.profile, label: "Profile" },
  ];

  const styles = {
    container: {
      position: "sticky",
      top: 0,
      backdropFilter: "blur(4px)",
      padding: "1rem",
      backgroundColor: "rgba(15, 15, 15, 0.8)",
      borderRadius: "1rem",
      marginBottom: "2rem",
      width: "100%",
    },
    profileContainer: {
      display: "flex",
      justifyContent: "flex-start",
    },
    title: {
      fontSize: "4rem",
      fontWeight: "bold",
      textAlign: "center",
      margin: "12px 0",
      color: "#ffffff",
    },
    navContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "0.5rem",
      marginTop: "1rem",
    },
    navButtonActive: {
      padding: "0.5rem 1rem",
      border: "1px solid #374151",
      borderRadius: "8px",
      background: "#ffffff",
      color: "#000000",
      cursor: "pointer",
      fontWeight: "600",
    },
    navButtonInactive: {
      padding: "0.5rem 1rem",
      border: "1px solid #374151",
      borderRadius: "8px",
      background: "transparent",
      color: "#9ca3af",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      {/* Huge centered title */}
      <h1 style={styles.title}>
        To-Do Or Die.
      </h1>

      {/* Nav buttons aligned right */}
      <div style={styles.navContainer}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => nav(t.id)}
            style={route === t.id ? styles.navButtonActive : styles.navButtonInactive}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// ---------- Pages ----------
function LoginPage({ nav, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      padding: "1.5rem",
    },
    card: {
      width: "100%",
      maxWidth: "32rem",
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#1f2937",
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      textAlign: "center",
      color: "#ffffff",
    },
    formContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    input: {
      width: "100%",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: "1rem",
    },
    button: {
      width: "100%",
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "0.5rem",
      padding: "0.75rem 0",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
    },
    linkContainer: {
      fontSize: "0.875rem",
      textAlign: "center",
      color: "#9ca3af",
    },
    link: {
      textDecoration: "underline",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#ffffff",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login Or Die.</h1>
        <div style={styles.formContainer}>
          <input 
            style={styles.input} 
            placeholder="email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
          <input 
            style={styles.input} 
            placeholder="password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
          />
          <button 
            style={styles.button} 
            onClick={() => onLogin({ email })}
          >
            Sign in (mock)
          </button>
          <div style={styles.linkContainer}>
            Don't have an account? 
            <button 
              style={styles.link} 
              onClick={()=>nav(routes.signup)}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignupPage({ nav, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      padding: "1.5rem",
    },
    card: {
      width: "100%",
      maxWidth: "32rem",
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#1f2937",
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      textAlign: "center",
      color: "#ffffff",
    },
    formContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    input: {
      width: "100%",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: "1rem",
    },
    button: {
      width: "100%",
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "0.5rem",
      padding: "0.75rem 0",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
    },
    linkContainer: {
      fontSize: "0.875rem",
      textAlign: "center",
      color: "#9ca3af",
    },
    link: {
      textDecoration: "underline",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#ffffff",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <div style={styles.formContainer}>
          <input 
            style={styles.input} 
            placeholder="name" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
          />
          <input 
            style={styles.input} 
            placeholder="email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
          />
          <input 
            style={styles.input} 
            placeholder="password" 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
          />
          <button 
            style={styles.button} 
            onClick={() => onSignup({ email, name })}
          >
            Sign up (mock)
          </button>
          <div style={styles.linkContainer}>
            Already have an account? 
            <button 
              style={styles.link} 
              onClick={()=>nav(routes.login)}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeBombPage({ bomb, setBomb, nav }) {
  const { label } = useCountdown(bomb.deadline);
  const wiresCut = bomb.wires.filter(w=>w.cut).length;
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "2rem",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
      width: "100%",
    },
    bombCard: {
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      backgroundColor: "#1f2937",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    },
    bombHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1.5rem",
    },
    bombTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#ffffff",
    },
    countdown: {
      fontSize: "0.875rem",
      padding: "0.5rem 1rem",
      borderRadius: "9999px",
      backgroundColor: "#10b981",
      color: "#ffffff",
      fontWeight: "600",
    },
    bombContainer: {
      position: "relative",
      width: "20rem",
      height: "20rem",
      margin: "2rem auto",
    },
    bomb: {
      position: "absolute",
      inset: "0",
      borderRadius: "50%",
      backgroundColor: "#374151",
      color: "#ffffff",
      display: "grid",
      placeItems: "center",
      fontSize: "3rem",
      fontWeight: "bold",
      border: "3px solid #4b5563",
    },
    wireButton: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "0.5rem 1rem",
      borderRadius: "9999px",
      border: "2px solid #6b7280",
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: "0.875rem",
      fontWeight: "600",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    wireButtonHover: {
      transform: "translateX(-50%) scale(1.05)",
    },
    wireButtonCut: {
      textDecoration: "line-through",
      opacity: "0.6",
      backgroundColor: "#6b7280",
    },
    wiresCount: {
      fontSize: "1rem",
      color: "#9ca3af",
      textAlign: "center",
      marginTop: "1rem",
    },
    sidebar: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
    },
    legendCard: {
      padding: "1.5rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      backgroundColor: "#1f2937",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    },
    legendTitle: {
      fontWeight: "600",
      marginBottom: "1rem",
      color: "#ffffff",
      fontSize: "1.125rem",
    },
    legendList: {
      fontSize: "0.875rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    colorDot: {
      width: "1rem",
      height: "1rem",
      borderRadius: "50%",
    },
    actionButtons: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1rem",
    },
    actionButton: {
      padding: "0.75rem 1rem",
      border: "1px solid #374151",
      borderRadius: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.2s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.bombCard}>
          <div style={styles.bombHeader}>
            <h2 style={styles.bombTitle}>Current Bomb</h2>
            <span style={styles.countdown}>⏳ {label}</span>
          </div>
          <div style={styles.bombContainer}>
            <div style={styles.bomb}>💥</div>
            {bomb.wires.map((w,i)=> (
              <button 
                key={w.id} 
                onClick={()=>setBomb(prev=>({...prev, wires: prev.wires.map(x=>x.id===w.id?{...x, cut:!x.cut}:x)}))} 
                style={{
                  ...styles.wireButton,
                  top: 18 + i*40,
                  ...(w.cut ? styles.wireButtonCut : {}),
                }}
                onMouseEnter={(e) => {
                  if (!w.cut) {
                    e.target.style.transform = "translateX(-50%) scale(1.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateX(-50%) scale(1)";
                }}
              >
                {w.cut?"Cut":"Wire"} {i+1}
              </button>
            ))}
          </div>
          <div style={styles.wiresCount}>Wires cut: {wiresCut}/{bomb.wires.length}</div>
        </div>
        <div style={styles.sidebar}>
          <div style={styles.legendCard}>
            <div style={styles.legendTitle}>Legend</div>
            <ul style={styles.legendList}>
              {bomb.wires.map(w=> (
                <li key={w.id} style={styles.legendItem}>
                  <span 
                    style={{
                      ...styles.colorDot,
                      backgroundColor: w.color,
                    }}
                  ></span> 
                  <span>{w.task}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.actionButtons}>
            <button 
              style={styles.actionButton} 
              onClick={()=>nav(routes.punishments)}
            >
              Add Punishment
            </button>
            <button 
              style={styles.actionButton} 
              onClick={()=>nav(routes.tasks)}
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ tasks, setTasks }) {
  const [t, setT] = useState("");
  const [due, setDue] = useState("");
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "2rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "2rem",
      color: "#ffffff",
    },
    formCard: {
      padding: "1.5rem",
      border: "1px solid #374151",
      borderRadius: "1rem",
      backgroundColor: "#1f2937",
      marginBottom: "2rem",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      width: "100%",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    },
    input: {
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: "1rem",
    },
    addButton: {
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
    },
    tasksList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "100%",
    },
    emptyState: {
      fontSize: "1rem",
      color: "#9ca3af",
      textAlign: "center",
      padding: "2rem",
    },
    taskItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.5rem",
      border: "1px solid #374151",
      borderRadius: "1rem",
      backgroundColor: "#1f2937",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
    },
    taskInfo: {
      display: "flex",
      flexDirection: "column",
    },
    taskTitle: {
      fontWeight: "500",
      color: "#ffffff",
      fontSize: "1.125rem",
    },
    taskTitleDone: {
      fontWeight: "500",
      textDecoration: "line-through",
      color: "#6b7280",
      fontSize: "1.125rem",
    },
    taskDue: {
      fontSize: "0.875rem",
      color: "#9ca3af",
      marginTop: "0.25rem",
    },
    taskActions: {
      display: "flex",
      gap: "0.75rem",
    },
    actionButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "500",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Tasks</h2>
      <div style={styles.formCard}>
        <input 
          style={styles.input} 
          placeholder="Task title" 
          value={t} 
          onChange={e=>setT(e.target.value)} 
        />
        <input 
          style={styles.input} 
          type="datetime-local" 
          value={due} 
          onChange={e=>setDue(e.target.value)} 
        />
        <button 
          style={styles.addButton} 
          onClick={()=>{ 
            if(!t) return; 
            setTasks(prev=>[...prev,{ id:crypto.randomUUID(), title:t, due:due||null, done:false }]); 
            setT(""); 
            setDue(""); 
          }}
        >
          Add Task
        </button>
      </div>
      <div style={styles.tasksList}>
        {tasks.length===0 && <div style={styles.emptyState}>No tasks yet.</div>}
        {tasks.map(task=> (
          <div key={task.id} style={styles.taskItem}>
            <div style={styles.taskInfo}>
              <div style={task.done ? styles.taskTitleDone : styles.taskTitle}>
                {task.title}
              </div>
              {task.due && (
                <div style={styles.taskDue}>
                  Due: {new Date(task.due).toLocaleString()}
                </div>
              )}
            </div>
            <div style={styles.taskActions}>
              <button 
                style={styles.actionButton} 
                onClick={()=>setTasks(prev=>prev.map(x=>x.id===task.id?{...x,done:!x.done}:x))}
              >
                {task.done?"Undo":"Complete"}
              </button>
              <button 
                style={styles.actionButton} 
                onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==task.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PunishmentsPage({ punishments, setPunishments }) {
  const [p, setP] = useState("");
  const [amount, setAmount] = useState("5");
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "2rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "2rem",
      color: "#ffffff",
    },
    formCard: {
      padding: "1.5rem",
      border: "1px solid #374151",
      borderRadius: "1rem",
      backgroundColor: "#1f2937",
      marginBottom: "2rem",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "1rem",
      width: "100%",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    },
    input: {
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      fontSize: "1rem",
    },
    addButton: {
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "0.5rem",
      padding: "0.75rem",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "1rem",
    },
    punishmentsList: {
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      width: "100%",
    },
    emptyState: {
      fontSize: "1rem",
      color: "#9ca3af",
      textAlign: "center",
      padding: "2rem",
    },
    punishmentItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1.5rem",
      border: "1px solid #374151",
      borderRadius: "1rem",
      backgroundColor: "#1f2937",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
    },
    punishmentInfo: {
      display: "flex",
      flexDirection: "column",
    },
    punishmentDesc: {
      fontWeight: "500",
      color: "#ffffff",
      fontSize: "1.125rem",
    },
    punishmentAmount: {
      fontSize: "0.875rem",
      color: "#9ca3af",
      marginTop: "0.25rem",
    },
    removeButton: {
      padding: "0.5rem 1rem",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "500",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Punishments</h2>
      <div style={styles.formCard}>
        <input 
          style={styles.input} 
          placeholder="Description (e.g., Venmo $5 to friend)" 
          value={p} 
          onChange={e=>setP(e.target.value)} 
        />
        <input 
          style={styles.input} 
          type="number" 
          min="0" 
          step="1" 
          value={amount} 
          onChange={e=>setAmount(e.target.value)} 
        />
        <button 
          style={styles.addButton} 
          onClick={()=>{ 
            if(!p) return; 
            setPunishments(prev=>[...prev,{ id:crypto.randomUUID(), desc:p, amount:parseInt(amount)||0 }]); 
            setP(""); 
          }}
        >
          Add
        </button>
      </div>
      <div style={styles.punishmentsList}>
        {punishments.length===0 && <div style={styles.emptyState}>No punishments yet.</div>}
        {punishments.map(pu=> (
          <div key={pu.id} style={styles.punishmentItem}>
            <div style={styles.punishmentInfo}>
              <div style={styles.punishmentDesc}>{pu.desc}</div>
              <div style={styles.punishmentAmount}>Stake: ${pu.amount}</div>
            </div>
            <button 
              style={styles.removeButton} 
              onClick={()=>setPunishments(prev=>prev.filter(x=>x.id!==pu.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user, stats, friends, setFriends, onLogout }) {
  const [newFriend, setNewFriend] = useState("");
  
  const styles = {
    container: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "2rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "2rem",
      color: "#ffffff",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "2rem",
      width: "100%",
    },
    card: {
      padding: "1.5rem",
      border: "1px solid #374151",
      borderRadius: "1rem",
      backgroundColor: "#1f2937",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
    },
    cardTitle: {
      fontWeight: "600",
      color: "#ffffff",
      fontSize: "1.125rem",
      marginBottom: "1rem",
    },
    accountInfo: {
      fontSize: "0.875rem",
      color: "#9ca3af",
      marginTop: "0.5rem",
    },
    emailSpan: {
      fontFamily: "monospace",
      color: "#ffffff",
    },
    signOutButton: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      border: "1px solid #4b5563",
      borderRadius: "0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: "500",
    },
    statsList: {
      fontSize: "0.875rem",
      marginTop: "0.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      color: "#9ca3af",
    },
    friendsList: {
      fontSize: "0.875rem",
      marginTop: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    friendItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      backgroundColor: "#374151",
    },
    friendEmail: {
      color: "#9ca3af",
    },
    removeButton: {
      fontSize: "0.75rem",
      padding: "0.25rem 0.5rem",
      border: "1px solid #6b7280",
      borderRadius: "0.5rem",
      backgroundColor: "#4b5563",
      color: "#ffffff",
      cursor: "pointer",
    },
    addFriendContainer: {
      marginTop: "1rem",
      display: "flex",
      gap: "0.75rem",
    },
    addFriendInput: {
      flex: "1",
      border: "1px solid #4b5563",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.75rem",
      backgroundColor: "#374151",
      color: "#ffffff",
    },
    addFriendButton: {
      padding: "0.5rem 0.75rem",
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "0.5rem",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Profile</h2>
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Account</div>
          <div style={styles.accountInfo}>
            Email: <span style={styles.emailSpan}>{user.email}</span>
          </div>
          <div style={styles.accountInfo}>
            Name: {user.name || "(you)"}
          </div>
          <button style={styles.signOutButton} onClick={onLogout}>
            Sign out
          </button>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Stats</div>
          <ul style={styles.statsList}>
            <li>Bombs defused: <b>{stats.defused}</b></li>
            <li>Bombs exploded: <b>{stats.exploded}</b></li>
          </ul>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Friends / Verifiers</div>
          <ul style={styles.friendsList}>
            {friends.map(f => (
              <li key={f.email} style={styles.friendItem}>
                <span>
                  {f.name} <span style={styles.friendEmail}>({f.email})</span>
                </span>
                <button 
                  style={styles.removeButton} 
                  onClick={()=>setFriends(prev=>prev.filter(x=>x.email!==f.email))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div style={styles.addFriendContainer}>
            <input 
              style={styles.addFriendInput} 
              placeholder="Add friend by email" 
              value={newFriend} 
              onChange={e=>setNewFriend(e.target.value)} 
            />
            <button 
              style={styles.addFriendButton} 
              onClick={()=>{ 
                if(!newFriend) return; 
                setFriends(prev=>[...prev,{ name:newFriend.split("@")[0], email:newFriend }]); 
                setNewFriend(""); 
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const { route, nav } = useHashRoute(routes.home);
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState({ email: "student@example.edu", name: "" });

  const [punishments, setPunishments] = useState([{ id:"p1", desc:"Pay $5 to Riley", amount:5 }]);
  const [tasks, setTasks] = useState([]);
  const [friends, setFriends] = useState([{ name:"alex", email:"alex@cmu.edu" }, { name:"riley", email:"riley@cmu.edu" }]);
  const [stats, setStats] = useState({ defused: 2, exploded: 1 });

  const [bomb, setBomb] = useState(()=>({
    deadline: Date.now() + 1000*60*60*6 + 1000*10, // ~6h 10s
    wires: [
      { id:"w1", task:"Do dishes", color:"#ef4444", cut:false },
      { id:"w2", task:"Finish essay", color:"#22c55e", cut:false },
      { id:"w3", task:"Gym 45m", color:"#3b82f6", cut:false },
    ],
  }));

  // redirect rules: if not logged in, show login/signup; else show app pages
  useEffect(()=>{
    if(!isLogged && route!==routes.signup) nav(routes.login);
    if(isLogged && (route===routes.login || route===routes.signup)) nav(routes.home);
    // eslint-disable-next-line
  }, [isLogged]);

  // show nav only on pages 3–6
  const showNav = isLogged && [routes.home, routes.tasks, routes.punishments, routes.profile].includes(route);

  const styles = {
    app: {
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#0f0f0f",
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      margin: 0,
      padding: 0,
    },
    mainContent: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "2rem",
      padding: "2rem",
    },
    footer: {
      maxWidth: "72rem",
      margin: "0 auto",
      padding: "2.5rem 1rem",
      fontSize: "0.75rem",
      color: "#9ca3af",
    },
    footerContent: {
      borderTop: "1px solid #374151",
      paddingTop: "1.5rem",
    },
    footerTitle: {
      fontWeight: "600",
      marginBottom: "0.5rem",
    },
    footerList: {
      listStyleType: "disc",
      paddingLeft: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
  };

  return (
    <div style={styles.app}>
      <div style={styles.mainContent}>
        {showNav && <AppNav nav={nav} route={route} />}

        {/* ROUTES */}
        {route===routes.login && <LoginPage nav={nav} onLogin={(u)=>{ setUser(prev=>({...prev, ...u})); setIsLogged(true); }} />}
        {route===routes.signup && <SignupPage nav={nav} onSignup={(u)=>{ setUser(prev=>({...prev, ...u})); setIsLogged(true); }} />}
        {isLogged && route===routes.home && <HomeBombPage bomb={bomb} setBomb={setBomb} nav={nav} />}
        {isLogged && route===routes.tasks && <TasksPage tasks={tasks} setTasks={setTasks} />}
        {isLogged && route===routes.punishments && <PunishmentsPage punishments={punishments} setPunishments={setPunishments} />}
        {isLogged && route===routes.profile && (
          <ProfilePage user={user} stats={stats} friends={friends} setFriends={setFriends} onLogout={()=>setIsLogged(false)} />
        )}

        {/* footer */}
        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={styles.footerTitle}>Next steps</div>
            <ul style={styles.footerList}>
              <li>Replace mock auth with Firebase/Supabase; protect routes on server too.</li>
              <li>Send email invites to verifiers; verification dashboard w/ Approve/Reject.</li>
              <li>Server‑enforced timers (Cloud Functions / cron) to trigger punishments.</li>
              <li>Stripe SetupIntent to hold penalty; capture on failure; add non‑monetary options.</li>
              <li>Persist tasks, punishments, friendships in database; attach to bombs.</li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}