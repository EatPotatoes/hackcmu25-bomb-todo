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
  return (
    <div className="sticky top-0 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💣</span>
          <span className="font-bold">To‑Do Or Die</span>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => nav(t.id)} className={`px-3 py-2 rounded-xl text-sm border hover:bg-gray-50 ${route===t.id?"bg-gray-900 text-white border-gray-900":""}`}>{t.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Pages ----------
function LoginPage({ nav, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md p-6 rounded-2xl border shadow-sm bg-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Or Die.</h1>
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-gray-900 text-white rounded-lg py-2" onClick={() => onLogin({ email })}>Sign in (mock)</button>
          <div className="text-sm text-center">Don't have an account? <button className="underline" onClick={()=>nav(routes.signup)}>Sign up</button></div>
        </div>
      </div>
    </div>
  );
}

function SignupPage({ nav, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md p-6 rounded-2xl border shadow-sm bg-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full bg-gray-900 text-white rounded-lg py-2" onClick={() => onSignup({ email, name })}>Sign up (mock)</button>
          <div className="text-sm text-center">Already have an account? <button className="underline" onClick={()=>nav(routes.login)}>Log in</button></div>
        </div>
      </div>
    </div>
  );
}

function HomeBombPage({ bomb, setBomb, nav }) {
  const { label } = useCountdown(bomb.deadline);
  const wiresCut = bomb.wires.filter(w=>w.cut).length;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-2xl border bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Bomb</h2>
            <span className="text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">⏳ {label}</span>
          </div>
          <div className="relative w-64 h-64 mx-auto my-6">
            <div className="absolute inset-0 rounded-full bg-gray-900 text-white grid place-items-center text-3xl font-bold">💥</div>
            {bomb.wires.map((w,i)=> (
              <button key={w.id} onClick={()=>setBomb(prev=>({...prev, wires: prev.wires.map(x=>x.id===w.id?{...x, cut:!x.cut}:x)}))} className={`absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border bg-white text-xs shadow hover:scale-105 transition ${w.cut?"line-through opacity-60":""}`} style={{ top: 18 + i*40 }}>
                {w.cut?"Cut":"Wire"} {i+1}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-600 text-center">Wires cut: {wiresCut}/{bomb.wires.length}</div>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-white">
            <div className="font-semibold mb-2">Legend</div>
            <ul className="text-sm space-y-1">
              {bomb.wires.map(w=> (
                <li key={w.id} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full`} style={{background:w.color}}></span> <span>{w.task}</span></li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 border rounded-xl" onClick={()=>nav(routes.punishments)}>Add Punishment</button>
            <button className="px-3 py-2 border rounded-xl" onClick={()=>nav(routes.tasks)}>Add Task</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksPage({ tasks, setTasks }) {
  const [t, setT] = useState("");
  const [due, setDue] = useState("");
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>
      <div className="p-4 border rounded-2xl bg-white mb-4 grid md:grid-cols-3 gap-2">
        <input className="border rounded-lg px-3 py-2" placeholder="Task title" value={t} onChange={e=>setT(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} />
        <button className="bg-gray-900 text-white rounded-lg px-3" onClick={()=>{ if(!t) return; setTasks(prev=>[...prev,{ id:crypto.randomUUID(), title:t, due:due||null, done:false }]); setT(""); setDue(""); }}>Add Task</button>
      </div>
      <div className="space-y-2">
        {tasks.length===0 && <div className="text-sm text-gray-600">No tasks yet.</div>}
        {tasks.map(task=> (
          <div key={task.id} className="flex items-center justify-between p-3 border rounded-xl bg-white">
            <div>
              <div className={`font-medium ${task.done?"line-through text-gray-400":""}`}>{task.title}</div>
              {task.due && <div className="text-xs text-gray-500">Due: {new Date(task.due).toLocaleString()}</div>}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded-lg" onClick={()=>setTasks(prev=>prev.map(x=>x.id===task.id?{...x,done:!x.done}:x))}>{task.done?"Undo":"Complete"}</button>
              <button className="px-3 py-1 border rounded-lg" onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==task.id))}>Delete</button>
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
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Punishments</h2>
      <div className="p-4 border rounded-2xl bg-white mb-4 grid md:grid-cols-3 gap-2">
        <input className="border rounded-lg px-3 py-2" placeholder="Description (e.g., Venmo $5 to friend)" value={p} onChange={e=>setP(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" type="number" min="0" step="1" value={amount} onChange={e=>setAmount(e.target.value)} />
        <button className="bg-gray-900 text-white rounded-lg px-3" onClick={()=>{ if(!p) return; setPunishments(prev=>[...prev,{ id:crypto.randomUUID(), desc:p, amount:parseInt(amount)||0 }]); setP(""); }}>Add</button>
      </div>
      <div className="space-y-2">
        {punishments.length===0 && <div className="text-sm text-gray-600">No punishments yet.</div>}
        {punishments.map(pu=> (
          <div key={pu.id} className="flex items-center justify-between p-3 border rounded-xl bg-white">
            <div>
              <div className="font-medium">{pu.desc}</div>
              <div className="text-xs text-gray-500">Stake: ${pu.amount}</div>
            </div>
            <button className="px-3 py-1 border rounded-lg" onClick={()=>setPunishments(prev=>prev.filter(x=>x.id!==pu.id))}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user, stats, friends, setFriends, onLogout }) {
  const [newFriend, setNewFriend] = useState("");
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-2xl bg-white">
          <div className="font-semibold">Account</div>
          <div className="text-sm text-gray-700 mt-1">Email: <span className="font-mono">{user.email}</span></div>
          <div className="text-sm text-gray-700">Name: {user.name || "(you)"}</div>
          <button className="mt-3 px-3 py-1.5 border rounded-xl" onClick={onLogout}>Sign out</button>
        </div>
        <div className="p-4 border rounded-2xl bg-white">
          <div className="font-semibold">Stats</div>
          <ul className="text-sm mt-1 space-y-1">
            <li>Bombs defused: <b>{stats.defused}</b></li>
            <li>Bombs exploded: <b>{stats.exploded}</b></li>
          </ul>
        </div>
        <div className="p-4 border rounded-2xl bg-white">
          <div className="font-semibold">Friends / Verifiers</div>
          <ul className="text-sm mt-2 space-y-2">
            {friends.map(f => (
              <li key={f.email} className="flex items-center justify-between p-2 border rounded-lg">
                <span>{f.name} <span className="text-gray-500">({f.email})</span></span>
                <button className="text-xs px-2 py-1 border rounded-lg" onClick={()=>setFriends(prev=>prev.filter(x=>x.email!==f.email))}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Add friend by email" value={newFriend} onChange={e=>setNewFriend(e.target.value)} />
            <button className="px-3 py-2 bg-gray-900 text-white rounded-lg" onClick={()=>{ if(!newFriend) return; setFriends(prev=>[...prev,{ name:newFriend.split("@")[0], email:newFriend }]); setNewFriend(""); }}>Add</button>
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
      <footer className="max-w-6xl mx-auto px-4 py-10 text-xs text-gray-500">
        <div className="border-t pt-6">
          <div className="font-semibold mb-2">Next steps</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Replace mock auth with Firebase/Supabase; protect routes on server too.</li>
            <li>Send email invites to verifiers; verification dashboard w/ Approve/Reject.</li>
            <li>Server‑enforced timers (Cloud Functions / cron) to trigger punishments.</li>
            <li>Stripe SetupIntent to hold penalty; capture on failure; add non‑monetary options.</li>
            <li>Persist tasks, punishments, friendships in database; attach to bombs.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
