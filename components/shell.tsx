"use client";
import { useState } from "react";
import {
  Home,
  CalendarDays,
  MessageSquare,
  Heart,
  BookOpen,
  UserRound,
  Calendar,
  Users,
  ClipboardList,
  Clock3,
  Settings,
  LogOut,
  LayoutDashboard,
  ChartNoAxesCombined,
  ShieldCheck,
  FileText,
  Building2,
  UserRoundCheck,
  BriefcaseBusiness,
  History,
  Bell,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  LockKeyhole,
  Search,
} from "lucide-react";
import Logo from "./logo";
import { Avatar, Modal } from "./ui";
import { useDemo } from "./demo-context";
import type { Role } from "@/lib/data";
const icons: Record<string, typeof Home> = {
  Home,
  Appointments: CalendarDays,
  Messages: MessageSquare,
  "Well-being": Heart,
  Resources: BookOpen,
  Profile: UserRound,
  Calendar,
  Sessions: ClipboardList,
  Patients: Users,
  Assessments: ChartNoAxesCombined,
  Availability: Clock3,
  Settings,
  Overview: LayoutDashboard,
  "Program Usage": ChartNoAxesCombined,
  Eligibility: ShieldCheck,
  Reports: FileText,
  Contract: BriefcaseBusiness,
  Organizations: Building2,
  Psychologists: UserRoundCheck,
  Services: BriefcaseBusiness,
  "Audit Log": History,
};
export const navigation: Record<Role, string[]> = {
  patient: [
    "Home",
    "Appointments",
    "Messages",
    "Well-being",
    "Resources",
    "Profile",
  ],
  psychologist: [
    "Home",
    "Calendar",
    "Sessions",
    "Patients",
    "Messages",
    "Assessments",
    "Availability",
    "Profile",
    "Settings",
  ],
  admin: [
    "Overview",
    "Organizations",
    "Psychologists",
    "Eligibility",
    "Appointments",
    "Services",
    "Reports",
    "Contract",
    "Audit Log",
    "Settings",
  ],
};
export const roleNames: Record<Role, string> = {
  patient: "Patient / Employee",
  psychologist: "Psychologist",
  admin: "Mind Nexus Admin",
};
export function Shell({ children }: { children: React.ReactNode }) {
  const {
    role,
    page,
    navigate,
    switchRole,
    lang,
    setLang,
    t,
    toast,
    selectedPatient,
  } = useDemo();
  const [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [read, setRead] = useState<Record<string, boolean>>({}),
    [switcher, setSwitcher] = useState(false),
    [search, setSearch] = useState("");
  if (!role) return null;
  const name =
    role === "patient"
      ? "Arta Krasniqi"
      : role === "psychologist"
        ? "Dr. Luljeta Berisha"
        : "Mind Nexus Team";
  const alerts =
    role === "patient"
      ? [
          "Appointment confirmed",
          "New message from your psychologist",
          "Well-being check-in available",
        ]
      : role === "psychologist"
        ? [
            "Upcoming session",
            "New patient message",
            "Note requires completion",
          ]
        : [
            "Employee eligibility review available",
            "Program allocation review available",
          ];
  const workspace = {
    patient: "Personal workspace",
    psychologist: "Clinical workspace",
    admin: "Operations workspace",
  }[role];
  const go = (p: string) => {
    navigate(p);
    setMobile(false);
    setSearch("");
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            aria-label="Close navigation"
            className="mobile-only icon-button"
            onClick={() => setMobile(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">{t(workspace)}</div>
        <nav>
          {navigation[role].map((item, i) => {
            const Icon = icons[item];
            return (
              <button
                className={`${page === item || (page === "Patient detail" && item === "Patients") ? "selected" : ""} ${role === "psychologist" && i === 6 ? "nav-divider" : ""}`}
                key={item}
                aria-label={t(item)}
                onClick={() => go(item)}
              >
                <Icon size={19} strokeWidth={1.6} />
                <span>{t(item)}</span>
                {item === "Messages" && <small>3</small>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="confidential-side">
            <LockKeyhole size={16} />
            <div>
              <strong>{t("Confidential by design")}</strong>
              <p>{t("A space built around trust.")}</p>
            </div>
          </div>
          <button className="signout" onClick={() => switchRole(null)}>
            <LogOut size={17} />
            {t("Sign out")}
          </button>
          <div className="sidebar-user">
            <Avatar name={name} />
            <div>
              <strong>{name}</strong>
              <small>{t(roleNames[role])}</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            {t(workspace)}
            <span>/</span>
            <strong>
              {page === "Patient detail" ? selectedPatient : t(page)}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="demo-control"
              aria-label={t("Switch demo role")}
              onClick={() => setSwitcher(true)}
            >
              Demo <ChevronDown size={12} />
            </button>
            <div className="top-search">
              <Search size={17} />
              <input
                aria-label={t("Search")}
                placeholder={t("Search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <div className="search-results">
                  {navigation[role]
                    .filter((x) =>
                      t(x).toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((x) => (
                      <button key={x} onClick={() => go(x)}>
                        {t(x)}
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  {!navigation[role].some((x) =>
                    t(x).toLowerCase().includes(search.toLowerCase()),
                  ) && <p>{t("No results found.")}</p>}
                </div>
              )}
            </div>
            <div className="language">
              <button
                onClick={() => setLang("sq")}
                aria-pressed={lang === "sq"}
              >
                SQ
              </button>
              <span>/</span>
              <button
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
            </div>
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label={t("Notifications")}
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={20} />
                {!read[role] && <i />}
              </button>
              {notifications && (
                <>
                  <button
                    className="dropdown-dismiss"
                    aria-label="Close notifications"
                    onClick={() => setNotifications(false)}
                  />
                  <div className="notification-panel">
                    <h3>{t("Notifications")}</h3>
                    {!read[role] ? (
                      alerts.map((a, i) => (
                        <button
                          key={a}
                          onClick={() => {
                            go(
                              role === "patient"
                                ? i === 0
                                  ? "Appointments"
                                  : i === 1
                                    ? "Messages"
                                    : "Well-being"
                                : role === "psychologist"
                                  ? i === 0
                                    ? "Sessions"
                                    : i === 1
                                      ? "Messages"
                                      : "Patients"
                                  : i === 0
                                    ? "Eligibility"
                                    : "Reports",
                            );
                            setNotifications(false);
                          }}
                        >
                          <span className="notification-dot" />
                          <span>
                            {t(a)}
                            <small>{i + 1}h ago</small>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p>{t("You’re all caught up.")}</p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => setRead({ ...read, [role]: true })}
                    >
                      {t("Mark all as read")}
                    </button>
                  </div>
                </>
              )}
            </div>
            <Avatar name={name} size="small" />
          </div>
        </header>
        <main className="main-content" key={`${role}-${page}`}>
          {children}
        </main>
        <footer className="app-footer">
          <span>© 2026 Mind Nexus</span>
          <span>
            <LockKeyhole size={12} />
            {t("Fictional data · Client prototype")}
          </span>
          <button onClick={() => setSwitcher(true)}>
            {t("Demo role switcher")}
            <ChevronDown size={13} />
          </button>
        </footer>
      </div>
      {role === "patient" && (
        <nav className="bottom-nav">
          {navigation.patient.slice(0, 5).map((x) => {
            const Icon = icons[x];
            return (
              <button
                key={x}
                className={page === x ? "active" : ""}
                onClick={() => go(x)}
              >
                <Icon size={19} />
                <span>{t(x)}</span>
              </button>
            );
          })}
        </nav>
      )}
      {switcher && (
        <Modal
          title={t("Demo role switcher")}
          description={t("All changes are local to this demo.")}
          onClose={() => setSwitcher(false)}
        >
          <div className="role-list">
            {(Object.keys(roleNames) as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  switchRole(r);
                  setSwitcher(false);
                }}
              >
                <div>
                  <strong>{t(roleNames[r])}</strong>
                  <p>
                    {r === role ? t("Current workspace") : t("Explore demo")}
                  </p>
                </div>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={18} />
          {t(toast)}
        </div>
      )}
    </div>
  );
}
