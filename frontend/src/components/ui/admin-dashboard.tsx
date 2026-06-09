"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Bell,
  ShieldCheck,
  Calendar,
  Mail,
  Hash,
  Activity,
  Lock,
  ChevronRight,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";

// ─── Animation variants ──────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const fadeRight = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
};

// ─── Animated background blobs ───────────────────────────────────────────────

const Blobs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <motion.div
      animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-8%] right-[-4%] w-[500px] h-[500px] rounded-full bg-blue-200/25 blur-3xl"
    />
    <motion.div
      animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
      transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute bottom-[-10%] left-[15%] w-[420px] h-[420px] rounded-full bg-indigo-200/25 blur-3xl"
    />
    <motion.div
      animate={{ x: [0, 20, 0], y: [0, 25, 0] }}
      transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      className="absolute top-[35%] right-[25%] w-72 h-72 rounded-full bg-violet-100/30 blur-3xl"
    />
  </div>
);

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

const NavItem = ({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) => (
  <button
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-white/20 text-white shadow-inner"
        : "text-blue-100/80 hover:bg-white/10 hover:text-white"
    }`}
  >
    <Icon size={17} />
    <span>{label}</span>
    {active && <ChevronRight size={13} className="ml-auto opacity-70" />}
  </button>
);

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconBg,
  blob,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  blob: string;
}) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex items-center gap-4 relative overflow-hidden"
  >
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
    >
      <Icon size={19} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-gray-800 font-semibold text-sm truncate">{value}</p>
    </div>
    <div
      className={`absolute -right-5 -bottom-5 w-24 h-24 rounded-full opacity-[0.07] ${blob}`}
    />
  </motion.div>
);

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow = ({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <Icon size={13} className="text-blue-500" />
    </div>
    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 whitespace-nowrap">{label}</span>
      <span
        className={`text-sm font-medium text-gray-800 truncate max-w-[220px] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  </div>
);

// ─── Security badge ───────────────────────────────────────────────────────────

const SecurityBadge = ({
  label,
  status,
  variant,
}: {
  label: string;
  status: string;
  variant: "green" | "blue" | "gray";
}) => {
  const colors = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-100 text-gray-400",
  };
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${colors[variant]}`}
      >
        {status}
      </span>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AdminDashboard = () => {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      api
        .get("/auth/me")
        .then((res) => setAuth(res.data.data))
        .catch(() => {
          clearAuth();
          router.push("/login");
        });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const username = user.email.split("@")[0];

  const stats = [
    {
      icon: Mail,
      label: "Email",
      value: user.email,
      iconBg: "bg-linear-to-br from-blue-500 to-blue-600",
      blob: "bg-blue-500",
    },
    {
      icon: ShieldCheck,
      label: "Role",
      value: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      iconBg: "bg-linear-to-br from-indigo-500 to-indigo-600",
      blob: "bg-indigo-500",
    },
    {
      icon: Calendar,
      label: "Member since",
      value: new Date(user.createdAt).toLocaleDateString("en-US"),
      iconBg: "bg-linear-to-br from-violet-500 to-violet-600",
      blob: "bg-violet-500",
    },
    {
      icon: Activity,
      label: "Status",
      value: "Active",
      iconBg: "bg-linear-to-br from-emerald-500 to-emerald-600",
      blob: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 flex relative">
      <Blobs />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed left-0 top-0 h-full w-60 bg-linear-to-b from-blue-600 to-indigo-700 shadow-2xl z-20 flex flex-col"
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Auth System</p>
              <p className="text-blue-200 text-[11px]">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Users} label="Users" />
          <NavItem icon={Lock} label="Security" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{username}</p>
              <p className="text-blue-200/70 text-[11px] capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-100 transition-all duration-200"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col z-10 relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="sticky top-0 z-10 bg-white/60 backdrop-blur-xl border-b border-gray-100/80 px-8 py-4 flex items-center justify-between"
        >
          <div>
            <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Overview of your account</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition relative">
              <Bell size={15} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-200">
              {user.email[0].toUpperCase()}
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex-1 p-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-7"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Hello,{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
                {username}
              </span>{" "}
              👋
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Here's an overview of your secure workspace.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7"
          >
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </motion.div>

          {/* Lower grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Profile card — 3 cols */}
            <motion.div
              variants={fadeRight}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.55 }}
              className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden"
            >
              {/* Gradient banner */}
              <div className="bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -right-2 top-4 w-16 h-16 rounded-full bg-white/5" />
                <div className="flex items-center gap-4 relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  >
                    {user.email[0].toUpperCase()}
                  </motion.div>
                  <div>
                    <h3 className="text-white font-bold text-lg capitalize">{username}</h3>
                    <p className="text-blue-100 text-sm">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-white text-[11px] font-medium capitalize backdrop-blur">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info list */}
              <div className="p-6">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Account information
                </p>
                <InfoRow icon={Hash} label="ID" value={user.id} mono />
                <InfoRow icon={Mail} label="Email" value={user.email} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Role"
                  value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>
            </motion.div>

            {/* Right column — 2 cols */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 flex flex-col gap-5"
            >
              {/* Security status */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ShieldCheck size={15} className="text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700">Security</h4>
                </div>
                <div className="divide-y divide-gray-50">
                  <SecurityBadge label="JWT Authentication" status="Active" variant="green" />
                  <SecurityBadge label="Access Token" status="httpOnly" variant="blue" />
                  <SecurityBadge label="Refresh Token" status="httpOnly" variant="blue" />
                  <SecurityBadge label="Two-factor auth" status="Inactive" variant="gray" />
                </div>
              </div>

              {/* Decorative card */}
              <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute right-4 bottom-8 w-16 h-16 rounded-full bg-white/5" />
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-3 relative z-10"
                >
                  <Fingerprint size={28} className="text-blue-100" />
                </motion.div>
                <p className="font-bold text-sm mb-1 relative z-10">Secure session</p>
                <p className="text-blue-100/80 text-xs relative z-10 leading-relaxed">
                  Your tokens are protected by httpOnly cookies — invisible to JavaScript.
                </p>
                <div className="mt-4 flex items-center gap-1.5 relative z-10">
                  <KeyRound size={12} className="text-blue-200" />
                  <span className="text-[11px] text-blue-200 font-medium">Encryption active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
