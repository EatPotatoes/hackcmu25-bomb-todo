import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------------
// To‑Do Or Die — 6‑page hackathon demo (single‑file React)
// navbar visible on pages 3–6
function AppNav({ nav, route }) {
  const tabs = [
    { id: routes.home, label: "Home" },
    { id: routes.tasks, label: "Tasks" },
    { id: routes.punishments, label: "Punishments" },
    { id: routes.profile, label: "Profile" },
    { id: routes.verify, label: "Verify" },
  ];
  const styles = {
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
  );
}
// ---------- Verify Page ----------
function VerifyPage({ user, friends }) {
  const [eligibleBombs, setEligibleBombs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function fetchEligibleBombs() {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        // Fetch all bombs for friends
        const res = await fetch("http://localhost:5000/api/bombs/all", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const data = await res.json();
        // Only show bombs with incomplete wires and where user is a friend
        const eligible = data.filter(bomb => {
          // Check if user is a friend of bomb owner
          return bomb.friends && bomb.friends.includes(user.name) && bomb.wires.some(w => !w.complete);
        });
        setEligibleBombs(eligible);
      } catch (err) {
        setError("Failed to load eligible bombs");
      }
      setLoading(false);
    }
    if (user.token) fetchEligibleBombs();
  }, [user.token, user.name]);

  const handleVerify = async (bombName, wireName, ownerUserId) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:5000/api/bombs/verify-wire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ bombName, wireName, ownerUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Wire verified!");
        // Optionally refresh eligibleBombs
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  console.log("[DEBUG] VerifyPage mounted", user, friends);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>Verify Tasks for Friends</h2>
      {loading && <div style={{ color: '#f59e0b' }}>Loading...</div>}
      {error && <div style={{ color: '#ef4444' }}>{error}</div>}
      {success && <div style={{ color: '#22c55e' }}>{success}</div>}
      {eligibleBombs.length === 0 && !loading && <div>No eligible wires to verify for friends.</div>}
      {eligibleBombs.map(bomb => (
        <div key={bomb._id} style={{ border: "1px solid #374151", borderRadius: "1rem", padding: "1rem", marginBottom: "1rem", background: "#1f2937" }}>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Bomb: {bomb.name} (Owner: {bomb.ownerName})</div>
          <ul>
            {bomb.wires.filter(w => !w.complete).map(wire => (
              <li key={wire.name} style={{ marginBottom: "0.5rem" }}>
                <span>Wire: {wire.name}</span>
                <button style={{ marginLeft: "1rem", padding: "0.25rem 0.75rem", borderRadius: "0.5rem", background: "#22c55e", color: "#fff", border: "none", cursor: "pointer" }}
                  onClick={() => handleVerify(bomb.name, wire.name, bomb.ownerUserId)}>
                  Verify
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------- Pages ----------
const API_URL = "http://localhost:5000/api";

function LoginPage({ nav, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ email: data.user.email, name: data.user.name, token: data.token });
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const styles = {
    container: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "1.5rem",
      flexDirection: "column",
    },
    card: {
      width: "100%",
      maxWidth: "32rem",
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#1f2937",
      flexDirection: "column",
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
      justifyContent: "center",
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
      flexDirection: "column",
      justifyContent: "center",
    },
    linkContainer: {
      fontSize: "0.875rem",
      textAlign: "center",
      color: "#9ca3af",
      flexDirection: "column",
      justifyContent: "center",
    },
    link: {
      textDecoration: "underline",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#ffffff",
      flexDirection: "column",
      justifyContent: "center",
    },
  };
  

  return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img 
            src="/logo-full.svg" 
            alt="TO-DO or DESTROY" 
            style={{ maxWidth: "300px", height: "auto" }}
          />
        </div>
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
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>
            {error && <div style={{ color: "#ef4444", marginTop: "1rem" }}>{error}</div>}
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        onSignup({ email: data.user.email, name: data.user.name, token: data.token });
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const styles = {
    container: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "1.5rem",
      flexDirection: "column",
    },
    card: {
      width: "100%",
      maxWidth: "32rem",
      padding: "2rem",
      borderRadius: "1rem",
      border: "1px solid #374151",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#1f2937",
      flexDirection: "column",
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
      justifyContent: "center",
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
      flexDirection: "column",
      justifyContent: "center",
    },
    linkContainer: {
      fontSize: "0.875rem",
      textAlign: "center",
      color: "#9ca3af",
      flexDirection: "column",
      justifyContent: "center",
    },
    link: {
      textDecoration: "underline",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#ffffff",
      flexDirection: "column",
      justifyContent: "center",
    },
  };

  return (
    <div style={styles.container}>
    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img 
          src="/logo-full.svg" 
          alt="TO-DO or DESTROY" 
          style={{ maxWidth: "300px", height: "auto" }}
        />
      </div>
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
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
          {error && <div style={{ color: "#ef4444", marginTop: "1rem" }}>{error}</div>}
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

function HomeBombPage({ bomb, setBomb, nav, user }) {
  const { label } = useCountdown(bomb.deadline);
  const wiresCut = bomb.wires.filter(w=>w.cut).length;
  const [hoveredWire, setHoveredWire] = useState(null);

  // API: Cut wire
  const handleCutWire = async (wireId) => {
    if (!user?.token) return;
    await fetch(`${API_URL}/bombs/cut-wire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ wireId }),
    });
    // Refresh bomb
    const res = await fetch(`${API_URL}/bombs/current`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setBomb(data);
  };

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
      width: "100%",
      height: "30rem",
      margin: "2rem auto",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    bomb: {
      position: "relative",
      width: "40rem",
      height: "26rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    timer: {
      position: "relative",
      width: "32rem",
      height: "4rem",
      backgroundColor: "#6b7280",
      borderRadius: "1rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.1)",
      border: "3px solid #4b5563",
      background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
      marginBottom: "0",
    },
    timerDisplay: {
      fontFamily: "monospace",
      fontSize: "2rem",
      fontWeight: "bold",
      color: "#dc2626",
      textShadow: "0 0 8px rgba(220, 38, 38, 0.8), 0 0 16px rgba(220, 38, 38, 0.4)",
      letterSpacing: "0.15rem",
    },
    wiresAndSticksContainer: {
      position: "relative",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      gap: "1.5rem",
      marginTop: "0",
    },
    wireStickPair: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0",
    },
    wire: {
      width: "16px",
      height: "8rem",
      borderRadius: "8px",
      boxShadow: "0 3px 8px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      background: "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
      position: "relative",
      marginTop: "-2px",
    },
    wireHover: {
      transform: "scale(1.1)",
      filter: "brightness(1.2)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3)",
    },
    wireCut: {
      opacity: "0.2",
      transform: "scale(0.7) rotate(15deg)",
      filter: "blur(1px) grayscale(0.5)",
      cursor: "not-allowed",
    },
    stick: {
      width: "7rem",
      height: "12rem",
      backgroundColor: "#dc2626",
      borderRadius: "1rem",
      position: "relative",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5), inset 0 3px 0 rgba(255, 255, 255, 0.2)",
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
      marginTop: "-2px",
    },
    stickBand: {
      position: "absolute",
      top: "2rem",
      left: "-0.75rem",
      right: "-0.75rem",
      height: "1.25rem",
      backgroundColor: "#1f2937",
      borderRadius: "0.75rem",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)",
    },
    stickBand2: {
      position: "absolute",
      top: "8.75rem",
      left: "-0.75rem",
      right: "-0.75rem",
      height: "1.25rem",
      backgroundColor: "#1f2937",
      borderRadius: "0.75rem",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)",
    },
    tooltip: {
      position: "absolute",
      bottom: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#1f2937",
      color: "#ffffff",
      padding: "0.5rem 1rem",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
      border: "1px solid #374151",
      marginBottom: "0.5rem",
      zIndex: 10,
      pointerEvents: "none",
    },
    tooltipArrow: {
      position: "absolute",
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderTop: "6px solid #1f2937",
    },
    wiresCount: {
      fontSize: "1.125rem",
      color: "#9ca3af",
      textAlign: "center",
      marginTop: "2rem",
      fontWeight: "500",
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
            <div style={styles.bomb}>
              {/* Wide Timer */}
              <div style={styles.timer}>
                <div style={styles.timerDisplay}>
                  {label.includes('h') ? 
                    label.split(' ').slice(1, 3).join(' ').replace(/[dhms]/g, '') : 
                    "00:00"
                  }
                </div>
              </div>
              
              {/* Wires and Dynamite Sticks */}
              <div style={styles.wiresAndSticksContainer}>
                {bomb.wires.map((wire, index) => (
                  <div key={wire.id} style={styles.wireStickPair}>
                    {/* Wire */}
                    <div 
                      style={{
                        ...styles.wire,
                        backgroundColor: wire.color,
                        ...(wire.cut ? styles.wireCut : {}),
                        ...(hoveredWire === wire.id && !wire.cut ? styles.wireHover : {}),
                      }}
                      onClick={() => {
                        if (!wire.cut) {
                          handleCutWire(wire.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredWire(wire.id)}
                      onMouseLeave={() => setHoveredWire(null)}
                    >
                      {/* Tooltip */}
                      {hoveredWire === wire.id && !wire.cut && (
                        <div style={styles.tooltip}>
                          Cut: {wire.task}
                          <div style={styles.tooltipArrow}></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Large Dynamite Stick */}
                    <div style={styles.stick}>
                      <div style={styles.stickBand}></div>
                      <div style={styles.stickBand2}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  <span style={w.cut ? {textDecoration: 'line-through', opacity: 0.6} : {}}>
                    {w.task}
                  </span>
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

function TasksPage({ tasks, setTasks, bomb, setBomb, user }) {
  const [t, setT] = useState("");
  const [due, setDue] = useState("");
  
  // Array of colors to cycle through for new wires
  const wireColors = ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
  
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

  const handleAddTask = async () => {
    if (!t || !user?.token) return;
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ title: t, due }),
    });
    // Refresh bomb and tasks
    const bombRes = await fetch(`${API_URL}/bombs/current`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setBomb(await bombRes.json());
    const tasksRes = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTasks(await tasksRes.json());
    setT("");
    setDue("");
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!user?.token) return;
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    // Refresh bomb and tasks
    const bombRes = await fetch(`${API_URL}/bombs/current`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setBomb(await bombRes.json());
    const tasksRes = await fetch(`${API_URL}/tasks`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setTasks(await tasksRes.json());
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
          onClick={handleAddTask}
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
                onClick={() => handleDeleteTask(task.id, task.title)}
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
  const [friendError, setFriendError] = useState("");
  const [friendLoading, setFriendLoading] = useState(false);
  // Add friend via backend
  const handleAddFriend = async () => {
    if (!newFriend) return;
    setFriendLoading(true);
    setFriendError("");
    try {
      const res = await fetch("http://localhost:5000/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email: newFriend }),
      });
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
        setNewFriend("");
      } else {
        setFriendError(data.error || "Failed to add friend");
      }
    } catch (err) {
      setFriendError("Network error");
    }
    setFriendLoading(false);
  };
  // Remove friend via backend
  const handleRemoveFriend = async (email) => {
    setFriendLoading(true);
    setFriendError("");
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${email}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
      } else {
        setFriendError(data.error || "Failed to remove friend");
      }
    } catch (err) {
      setFriendError("Network error");
    }
    setFriendLoading(false);
  };
  
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
                  onClick={()=>handleRemoveFriend(f.email)}
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
              disabled={friendLoading}
            />
            <button 
              style={styles.addFriendButton} 
              onClick={handleAddFriend}
              disabled={friendLoading}
            >
              {friendLoading ? "Adding..." : "Add"}
            </button>
          </div>
          {friendError && <div style={{ color: "#ef4444", marginTop: "0.5rem" }}>{friendError}</div>}
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------
const routes = {
  login: "login",
  signup: "signup",
  punishments: "punishments",
  tasks: "tasks",
  profile: "profile",
  verify: "verify",
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

function useCountdown(untilTs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { 
    const t = setInterval(() => setNow(Date.now()), 1000); 
    return () => clearInterval(t); 
  }, []);
  const ms = Math.max(0, untilTs - now);
  const s = Math.floor(ms/1000) % 60; 
  const m = Math.floor(ms/60000) % 60; 
  const h = Math.floor(ms/3600000) % 24; 
  const d = Math.floor(ms/86400000);
  return { done: ms === 0, label: `${d}d ${h}h ${m}m ${s}s` };
}

export default function App() {
  const { route, nav } = useHashRoute(routes.home);
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState({ email: "", name: "", token: "" });
  const [bomb, setBomb] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [friends, setFriends] = useState([]);
  const [stats, setStats] = useState({ defused: 0, exploded: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch bomb and tasks after login
  useEffect(() => {
    async function fetchUserData() {
      if (isLogged && user.token) {
        setLoading(true);
        setError("");
        try {
          // Fetch bombs
          const bombRes = await fetch(`${API_URL}/bombs/current`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const bombData = await bombRes.json();
          setBomb(bombData);

          // Fetch tasks
          const tasksRes = await fetch(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const tasksData = await tasksRes.json();
          setTasks(tasksData);

          // Fetch punishments
          const punishRes = await fetch(`${API_URL}/punishments`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          setPunishments(await punishRes.json());

          // Fetch friends
          const friendsRes = await fetch(`${API_URL}/friends`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          setFriends(await friendsRes.json());

          // Fetch profile/stats
          const profileRes = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          const profileData = await profileRes.json();
          setStats(profileData.stats);
          setUser(prev => ({ ...prev, name: profileData.user.name, email: profileData.user.email }));
        } catch (err) {
          setError("Failed to load user data");
        }
        setLoading(false);
      }
    }
    fetchUserData();
  }, [isLogged, user.token]);

  // redirect rules: if not logged in, show login/signup; else show app pages
  useEffect(()=>{
    if(!isLogged && route!==routes.signup) nav(routes.login);
    if(isLogged && (route===routes.login || route===routes.signup)) nav(routes.home);
    // eslint-disable-next-line
  }, [isLogged]);

  // show nav only on pages 3–6
  const showNav = isLogged && [routes.home, routes.tasks, routes.punishments, routes.profile, routes.verify].includes(route);

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
        {loading && <div style={{ color: '#f59e0b', textAlign: 'center' }}>Loading...</div>}
        {error && <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>}
        {route===routes.login && <LoginPage nav={nav} onLogin={(u)=>{ setUser(u); setIsLogged(true); }} />}
        {route===routes.signup && <SignupPage nav={nav} onSignup={(u)=>{ setUser(u); setIsLogged(true); }} />}
        {isLogged && route===routes.home && bomb && <HomeBombPage bomb={bomb} setBomb={setBomb} nav={nav} user={user} />}
        {isLogged && route===routes.tasks && <TasksPage tasks={tasks} setTasks={setTasks} bomb={bomb} setBomb={setBomb} user={user} />}
        {isLogged && route===routes.punishments && <PunishmentsPage punishments={punishments} setPunishments={setPunishments} />}
        {isLogged && route===routes.profile && (
          <ProfilePage user={user} stats={stats} friends={friends} setFriends={setFriends} onLogout={()=>setIsLogged(false)} />
        )}
        {isLogged && route===routes.verify && (
          <VerifyPage user={user} friends={friends} />
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