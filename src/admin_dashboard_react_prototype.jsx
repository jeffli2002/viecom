import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// NOTE: Fixed version — wraps routing context correctly so useNavigate() is only used inside a <Router>.
// This file is a self-contained React prototype that assumes TailwindCSS is available in the project.
// It uses Recharts for charts and demonstrates the login page and three admin routes:
// /admin/login, /admin/dashboard, /admin/credits

/* --------------------------- Mock Data & Helpers --------------------------- */
const todayStr = () => new Date().toISOString().slice(0, 10);

const generateDates = (days = 30) => {
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
};

const mockRegisterTrend = (days = 30) => {
  const dates = generateDates(days);
  return dates.map((d) => ({ date: d, count: Math.floor(Math.random() * 200) + 5 }));
};

const mockCreditsTrend = (days = 30) => {
  const dates = generateDates(days);
  return dates.map((d) => ({ date: d, imageCredits: Math.floor(Math.random() * 5000), videoCredits: Math.floor(Math.random() * 2000) }));
};

const mockUsers = (count = 12) => {
  const plans = ["Free", "Basic", "Pro", "Pro+"];
  const users = [];
  for (let i = 0; i < count; i++) {
    const email = `user${i + 1}@example.com`;
    const signup = new Date();
    signup.setDate(signup.getDate() - Math.floor(Math.random() * 30));
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const imgCredits = Math.floor(Math.random() * 5000);
    const vidCredits = Math.floor(Math.random() * 2000);
    const paid = Math.random() > 0.6 ? (Math.floor(Math.random() * 100) + 10) : 0;
    users.push({ id: i + 1, email, signup: signup.toISOString().slice(0, 10), plan, paid, imgCredits, vidCredits, remaining: 10000 - imgCredits - vidCredits, lastActive: todayStr() });
  }
  return users;
};

/* --------------------------- CSV Export Helper --------------------------- */
function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(",")].concat(rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* --------------------------- UI Components --------------------------- */
function TopBar({ onLogout }) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg">Viecom Admin</div>
      </div>
      <div className="flex items-center gap-3">
        <input type="text" placeholder="Search email..." className="border rounded px-2 py-1" />
        <select className="border rounded px-2 py-1">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Custom range</option>
        </select>
        <button onClick={onLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r p-4 h-screen sticky top-0">
      <nav className="flex flex-col gap-2">
        <Link to="/admin/dashboard" className="p-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link to="/admin/users" className="p-2 rounded hover:bg-gray-100">Users</Link>
        <Link to="/admin/subscriptions" className="p-2 rounded hover:bg-gray-100">Subscriptions</Link>
        <Link to="/admin/payments" className="p-2 rounded hover:bg-gray-100">Payments</Link>
        <Link to="/admin/credits" className="p-2 rounded hover:bg-gray-100">Credits (积分)</Link>
        <Link to="/admin/settings" className="p-2 rounded hover:bg-gray-100">Settings</Link>
      </nav>
    </aside>
  );
}

/* --------------------------- Pages --------------------------- */
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock auth: accept any email/password
    localStorage.setItem("admin_logged_in", "1");
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">管理员登录</h2>
        <p className="text-sm text-gray-500 mb-6">请输入你的管理员账号以查看仪表盘</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border rounded px-3 py-2" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2"><input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} /> Remember me</label>
            <a className="text-sm text-blue-600" href="#">Forgot password?</a>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        </form>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [registerTrend] = useState(() => mockRegisterTrend(30));
  const [creditsTrend] = useState(() => mockCreditsTrend(30));
  const [users] = useState(() => mockUsers(20));

  const kpis = {
    todayRegs: registerTrend.slice(-1)[0]?.count || 0,
    last7: registerTrend.slice(-7).reduce((s, r) => s + r.count, 0),
    currentSubs: Math.floor(Math.random() * 2000) + 200,
    todayRevenue: (Math.random() * 1000).toFixed(2),
    todayImgCredits: creditsTrend.slice(-1)[0]?.imageCredits || 0,
    todayVidCredits: creditsTrend.slice(-1)[0]?.videoCredits || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">新注册（今日）</div>
          <div className="text-2xl font-bold">{kpis.todayRegs}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">过去7日新增</div>
          <div className="text-2xl font-bold">{kpis.last7}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">当前订阅用户</div>
          <div className="text-2xl font-bold">{kpis.currentSubs}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">今日收入（USD）</div>
          <div className="text-2xl font-bold">${kpis.todayRevenue}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">今日图像积分消耗</div>
          <div className="text-2xl font-bold">{kpis.todayImgCredits}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">今日视频积分消耗</div>
          <div className="text-2xl font-bold">{kpis.todayVidCredits}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">注册趋势（过去30天）</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registerTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">积分消耗趋势（图像 / 视频）</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={creditsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="imageCredits" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="videoCredits" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">当日新注册用户</h3>
          <div className="flex gap-2">
            <button onClick={() => downloadCSV("new-registrations.csv", users)} className="px-3 py-1 border rounded">导出 CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="text-left text-sm text-gray-500">
              <tr>
                <th className="py-2">注册日期</th>
                <th>Email</th>
                <th>订阅</th>
                <th>支付金额</th>
                <th>图像积分</th>
                <th>视频积分</th>
                <th>剩余积分</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.signup}</td>
                  <td className="py-2 text-sm">{u.email}</td>
                  <td className="py-2">{u.plan}</td>
                  <td className="py-2">{u.paid ? `$${u.paid}` : "-"}</td>
                  <td className="py-2">{u.imgCredits}</td>
                  <td className="py-2">{u.vidCredits}</td>
                  <td className="py-2">{u.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreditsPage() {
  const [users] = useState(() => mockUsers(40));
  const total = users.reduce((s, u) => s + u.imgCredits + u.vidCredits, 0);
  const imgTotal = users.reduce((s, u) => s + u.imgCredits, 0);
  const vidTotal = users.reduce((s, u) => s + u.vidCredits, 0);
  const top10 = [...users].sort((a, b) => b.imgCredits + b.vidCredits - (a.imgCredits + a.vidCredits)).slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">总积分消耗</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">图像积分</div>
          <div className="text-2xl font-bold">{imgTotal}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">视频积分</div>
          <div className="text-2xl font-bold">{vidTotal}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">用户积分消耗 Top 10</h3>
          <div className="space-y-2">
            {top10.map((u) => (
              <div key={u.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{u.email}</div>
                  <div className="text-sm text-gray-500">{u.plan} · 注册 {u.signup}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">总消耗 {u.imgCredits + u.vidCredits}</div>
                  <div className="text-xs text-gray-500">图像 {u.imgCredits} / 视频 {u.vidCredits}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">积分消耗堆叠（示例数据）</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCreditsTrend(15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="imageCredits" stackId="a" name="图像积分" />
                <Bar dataKey="videoCredits" stackId="a" name="视频积分" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">用户积分明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="text-left text-sm text-gray-500">
              <tr>
                <th className="py-2">Email</th>
                <th>注册日期</th>
                <th>订阅</th>
                <th>图像积分</th>
                <th>视频积分</th>
                <th>剩余</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.signup}</td>
                  <td className="py-2">{u.plan}</td>
                  <td className="py-2">{u.imgCredits}</td>
                  <td className="py-2">{u.vidCredits}</td>
                  <td className="py-2">{u.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <button onClick={() => downloadCSV("credits-detail.csv", users)} className="px-3 py-1 border rounded">导出 CSV</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- App + Routing --------------------------- */
export default function AppPrototype() {
  // Keep top-level state here, but create an inner component that uses useNavigate() inside Router.
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("admin_logged_in"));

  return (
    <Router>
      <InnerApp loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
    </Router>
  );
}

function InnerApp({ loggedIn, setLoggedIn }) {
  // This component is rendered inside <Router /> so useNavigate is safe here.
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      const path = window.location.pathname;
      if (!path.startsWith("/admin/login")) navigate("/admin/login");
    }
  }, [loggedIn, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    setLoggedIn(false);
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <TopBar onLogout={handleLogout} />
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/credits" element={<CreditsPage />} />
            {/* placeholders for other routes */}
            <Route path="/admin/*" element={<DashboardPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Mount wrapper for non-Next projects --------------------------- */
// If you want to use this file as a single entry (e.g., index.jsx), you can mount like below:
// import ReactDOM from 'react-dom/client';
// ReactDOM.createRoot(document.getElementById('root')).render(<AppPrototype />);

// End of fixed prototype
