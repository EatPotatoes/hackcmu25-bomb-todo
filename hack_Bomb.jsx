import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------
// 🔥 Hackathon To‑Do: "Bomb" Motivation Prototype (Single‑file React)
// - No backend; state only (mock login, mock verification)
// - Pages: Home, Bomb, Account/Login
// - Minimal styles via Tailwind classes (works in ChatGPT canvas)
// ------------------------------------------------------------

// Utility: simple countdown formatter
function useCountdown(targetTs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const msLeft = Math.max(0, targetTs - now);
  const seconds = Math.floor(msLeft / 1000) % 60;
  const minutes = Math.floor(msLeft / (1000 * 60)) % 60;
  const hours = Math.floor(msLeft / (1000 * 60 * 60)) % 24;
  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const done = msLeft <= 0;
  return { msLeft, done, label: `${days}d ${hours}h ${minutes}m ${seconds}s` };
}

// Color palette for wires
const WIRE_COLORS = [
  "red-500",
  "blue-500",
  "green-500",
  "yellow-500",
  "purple-500",
  "pink-500",
  "orange-500",
];

// Mock initial data for one active bomb
function makeMockBomb() {
  const base = Date.now();
  const bombDeadline = base + 1000 * 60 * 60 * 20; // 20 hours from load
  const tasks = [
    { title: "Finish OS homework", due: base + 1000 * 60 * 90 },
    { title: "Email Prof about project", due: base + 1000 * 60 * 180 },
    { title: "Gym 45min", due: base + 1000 * 60 * 60 * 8 },
    { title: "Clean inbox to zero", due: base + 1000 * 60 * 60 * 10 },
  ];
  return {
    id: "demo-bomb-1",
    name: "Midterms Survival Bomb",
    pot: 5, // $5 penalty (mock)
    deadline: bombDeadline,
    wires: tasks.map((t, i) => ({
      id: `wire-${i}`,
      task: t.title,
      color: WIRE_COLORS[i % WIRE_COLORS.length],
      due: t.due,
      cut: false,
      verifiedBy: null,
      pending: false,
    })),
  };
}

// Navbar
function Navbar({ page, setPage, isLoggedIn }) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💣</span>
          <span className="font-bold">No Excuses</span>
        </div>
        <div className="flex gap-4 text-sm">
          <button onClick={() => setPage("home")} className={`hover:underline ${page === "home" ? "font-semibold" : ""}`}>Home</button>
          <button onClick={() => setPage("bomb")} className={`hover:underline ${page === "bomb" ? "font-semibold" : ""}`}>Active Bomb</button>
          <button onClick={() => setPage("account")} className={`hover:underline ${page === "account" ? "font-semibold" : ""}`}>{isLoggedIn ? "Account" : "Login"}</button>
        </div>
      </div>
    </div>
  );
}

// Home page (fidgetable demo bomb w/ no real consequences)
function HomeDemo() {
  const demoDeadline = Date.now() + 1000 * 60 * 60 * 2 + 1000 * 15; // ~2h15s
  const { label } = useCountdown(demoDeadline);
  const [demoCut, setDemoCut] = useState([false, false, false]);
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
      <div className="p-6 rounded-2xl shadow border">
        <h2 className="text-xl font-semibold mb-3">What is this?</h2>
        <p className="text-sm text-gray-600">
          This is a playful demo. Click wires to see them cut, watch the timer tick, and imagine your tasks tied to each wire. Real functionality lives on the <span className="font-medium">Active Bomb</span> page after you log in.
        </p>
        <ul className="mt-4 text-sm list-disc pl-5 text-gray-700 space-y-2">
          <li>Each wire represents a task.</li>
          <li>Friends verify your completions.</li>
          <li>If the bomb reaches zero with uncut wires, a punishment triggers (e.g., small monetary penalty).</li>
        </ul>
      </div>
      <div className="p-6 rounded-2xl shadow border flex flex-col items-center">
        <h3 className="font-semibold">Demo Bomb ⏳ {label}</h3>
        <div className="relative w-56 h-56 my-6">
          <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-bold">💥</div>
          {demoCut.map((c, i) => (
            <button
              key={i}
              onClick={() => setDemoCut(v => v.map((x, j) => (i === j ? !x : x)))}
              className={`absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border bg-white text-xs shadow hover:scale-105 transition ${c ? "line-through opacity-60" : ""}`}
              style={{ top: 20 + i * 40 }}
            >
              {c ? "Cut" : "Wire"} {i + 1}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">(Purely cosmetic. Try the real flow in "Active Bomb".)</div>
      </div>
    </div>
  );
}

// Wire row with mock verification flow
function WireRow({ wire, friends, onRequestVerify }) {
  const due = new Date(wire.due).toLocaleString();
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full bg-${wire.color}`}></div>
        <div>
          <div className="font-medium">{wire.task}</div>
          <div className="text-xs text-gray-500">Due: {due}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {wire.cut ? (
          <span className="text-emerald-600 text-sm">✔ Cut by {wire.verifiedBy}</span>
        ) : wire.pending ? (
          <span className="text-amber-600 text-sm">⏳ Pending verifier...</span>
        ) : (
          <button
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90"
            onClick={() => onRequestVerify(wire.id, friends)}
          >
            Request Verification
          </button>
        )}
      </div>
    </div>
  );
}

// Active Bomb page
function BombPage({ bomb, setBomb, friends, punishmentTriggered, setPunishmentTriggered }) {
  const { label, done } = useCountdown(bomb.deadline);

  // if deadline passes with any uncut => punishment
  useEffect(() => {
    if (!done) return;
    const anyUncut = bomb.wires.some(w => !w.cut);
    if (anyUncut && !punishmentTriggered) {
      setPunishmentTriggered(true);
    }
  }, [done, bomb, punishmentTriggered, setPunishmentTriggered]);

  const cutCount = bomb.wires.filter(w => w.cut).length;

  function handleRequestVerify(wireId, friends) {
    // mock: open a mini prompt to pick a friend, then instantly approve
    const names = friends.map(f => f.name).join(", ");
    const picked = window.prompt(`Pick verifier name: ${names}`);
    if (!picked || !friends.some(f => f.name === picked)) return;
    setBomb(prev => ({
      ...prev,
      wires: prev.wires.map(w => (w.id === wireId ? { ...w, pending: true } : w)),
    }));
    // simulate async verification
    setTimeout(() => {
      setBomb(prev => ({
        ...prev,
        wires: prev.wires.map(w => (w.id === wireId ? { ...w, pending: false, cut: true, verifiedBy: picked } : w)),
      }));
    }, 900);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-bold">{bomb.name}</h1>
          <div className="text-sm text-gray-600">Pot/Penalty: ${bomb.pot}.00 • Wires cut: {cutCount}/{bomb.wires.length}</div>
          <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${done ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
            ⏳ {done ? "Exploded" : `Time left: ${label}`}
          </div>
          <div className="grid gap-3 mt-4">
            {bomb.wires.map(w => (
              <WireRow key={w.id} wire={w} friends={friends} onRequestVerify={handleRequestVerify} />
            ))}
          </div>
        </div>
        <div className="w-full md:w-72">
          <div className="p-4 rounded-2xl border shadow-sm">
            <div className="font-semibold mb-2">Legend</div>
            <ul className="text-sm space-y-1 text-gray-700">
              {bomb.wires.map(w => (
                <li key={w.id} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full bg-${w.color}`}></span>
                  <span>{w.task}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 p-4 rounded-2xl border bg-gray-50 text-sm text-gray-700">
            <div className="font-semibold mb-1">Status</div>
            {punishmentTriggered ? (
              <div className="text-red-700">💸 Punishment triggered: -${bomb.pot}.00 (mock)</div>
            ) : (
              <div>Keep cutting wires before detonation.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Account / Login page
function AccountPage({ isLoggedIn, setIsLoggedIn, friends, setFriends, history }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newFriend, setNewFriend] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <div className="space-y-3">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button
            className="w-full bg-gray-900 text-white rounded-lg py-2 hover:opacity-90"
            onClick={() => setIsLoggedIn(true)}
          >
            Sign in (mock)
          </button>
          <p className="text-xs text-gray-500">No auth yet • Wire up Firebase/Auth or Supabase later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="p-5 rounded-2xl border">
        <h3 className="font-semibold mb-3">Account</h3>
        <div className="text-sm text-gray-700">Email: <span className="font-mono">student@example.edu</span></div>
        <div className="text-sm text-gray-700">Friends / Verifiers:</div>
        <ul className="mt-2 text-sm space-y-1">
          {friends.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg">
              <span>{f.name} <span className="text-gray-500">({f.email})</span></span>
              <button className="text-xs px-2 py-1 border rounded-lg" onClick={() => setFriends(fs => fs.filter(x => x.email !== f.email))}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 border rounded-lg px-3 py-2" placeholder="Add friend by email" value={newFriend} onChange={e => setNewFriend(e.target.value)} />
          <button className="px-3 py-2 bg-gray-900 text-white rounded-lg" onClick={() => {
            if (!newFriend) return;
            setFriends(fs => [...fs, { name: newFriend.split("@")[0], email: newFriend }]);
            setNewFriend("");
          }}>Add</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">(Future) Send invite link to this email for verifier onboarding.</p>
        <button className="mt-4 text-sm underline" onClick={() => setIsLoggedIn(false)}>Sign out</button>
      </div>
      <div className="p-5 rounded-2xl border">
        <h3 className="font-semibold mb-3">Bomb History</h3>
        {history.length === 0 ? (
          <div className="text-sm text-gray-600">No past bombs yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((b, i) => (
              <li key={i} className="p-3 border rounded-lg">
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-gray-500">Penalty: ${b.pot}.00 • Wires cut: {b.wiresCut}/{b.wiresTotal}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [friends, setFriends] = useState([
    { name: "alex", email: "alex@cmu.edu" },
    { name: "riley", email: "riley@cmu.edu" },
  ]);

  const [bomb, setBomb] = useState(makeMockBomb);
  const [history, setHistory] = useState([]);
  const [punishmentTriggered, setPunishmentTriggered] = useState(false);

  // When bomb explodes, archive to history once
  useEffect(() => {
    const now = Date.now();
    if (now > bomb.deadline && !history.find(h => h.id === bomb.id)) {
      setHistory(h => [
        ...h,
        {
          id: bomb.id,
          name: bomb.name,
          pot: bomb.pot,
          wiresCut: bomb.wires.filter(w => w.cut).length,
          wiresTotal: bomb.wires.length,
        },
      ]);
    }
  }, [bomb, history]);

  // Redirect to bomb page after login to match product flow
  useEffect(() => {
    if (isLoggedIn && page === "account") {
      // keep them on account if they explicitly went there
      return;
    }
    if (isLoggedIn && page === "home") setPage("bomb");
  }, [isLoggedIn, page]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar page={page} setPage={setPage} isLoggedIn={isLoggedIn} />
      {page === "home" && <HomeDemo />}
      {page === "bomb" && (
        <BombPage
          bomb={bomb}
          setBomb={setBomb}
          friends={friends}
          punishmentTriggered={punishmentTriggered}
          setPunishmentTriggered={setPunishmentTriggered}
        />
      )}
      {page === "account" && (
        <AccountPage
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          friends={friends}
          setFriends={setFriends}
          history={history}
        />
      )}

      <footer className="max-w-5xl mx-auto px-4 py-10 text-xs text-gray-500">
        <div className="border-t pt-6">
          <div className="font-semibold mb-2">Next steps (implementation notes)</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Auth: Firebase Auth or Supabase; redirect to Bomb on success.</li>
            <li>DB: Store bombs, wires, friend graph (users collection + friendships + verifications).</li>
            <li>Verification flow: email deep link → verifier dashboard → Approve/Reject; sign the cut with userId + timestamp.</li>
            <li>Payments: Stripe (SetupIntent) for holding a small penalty; trigger capture on failure.</li>
            <li>Timers: server truth via Cloud Functions/CRON; client shows countdown but backend enforces detonation.</li>
            <li>Accessibility & Safety: clear consent for penalties; allow configurable, non-monetary consequences.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
