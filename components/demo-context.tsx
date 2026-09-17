"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  initialAppointments,
  initialEmployees,
  initialAudit,
  patients,
  psychologists,
  type Appointment,
  type Role,
} from "@/lib/data";
import {
  defaultHours,
  availableSlots,
  allowance,
  type Hours,
} from "@/lib/scheduling";
import { translate, type Language } from "@/lib/i18n";
export type Note = {
  id: string;
  patient: string;
  session: string;
  text: string;
  follow: boolean;
  interval: string;
  complete: boolean;
};
export type Message = {
  id: string;
  patient: string;
  psychologist?: string;
  from: "patient" | "psychologist";
  text: string;
  time: string;
};
function useDemoState() {
  const [profiles, setProfiles] = useState<
    Record<
      string,
      { email: string; bio: string; specialty: string; notices: boolean[] }
    >
  >({});
  const [role, setRole] = useState<Role | null>(null),
    [lang, setLang] = useState<Language>("en"),
    [page, setPage] = useState("Home");
  const [appointments, setAppointments] = useState(initialAppointments),
    [employees, setEmployees] = useState(initialEmployees),
    [people, setPeople] = useState(patients),
    [audit, setAudit] = useState(initialAudit);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "NOTE-201",
      patient: "MN-1042",
      session: "APT-2390",
      text: "Discussed routines for transitioning out of the working day. Patient would like to revisit boundaries and rest at the next session.",
      follow: true,
      interval: "1 week",
      complete: false,
    },
    {
      id: "NOTE-202",
      patient: "MN-1043",
      session: "APT-2402",
      text: "",
      follow: false,
      interval: "2 weeks",
      complete: false,
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      patient: "MN-1042",
      from: "psychologist",
      text: "Hello Arta, welcome to your private space. You can use this conversation for questions between our sessions.",
      time: "10 Sep · 14:48",
    },
    {
      id: "m2",
      patient: "MN-1042",
      from: "patient",
      text: "Thank you, Luljeta. It helps to have a little time set aside for myself.",
      time: "10 Sep · 16:02",
    },
    {
      id: "m3",
      patient: "MN-1042",
      from: "psychologist",
      text: "Of course. We can pick up where we left off in our next session. There is nothing you need to prepare beforehand.",
      time: "Today · 08:45",
    },
    {
      id: "m4",
      patient: "MN-1043",
      from: "patient",
      text: "Good morning. Could we discuss my schedule at our next session?",
      time: "Today · 08:12",
    },
    {
      id: "m5",
      patient: "MN-1044",
      from: "patient",
      text: "Thank you for sharing the check-in. I have completed it.",
      time: "Today · 08:30",
    },
  ]);
  const [hours, setHours] = useState<Hours[]>(defaultHours);
  const [timeOff, setTimeOff] = useState<{ start: string; end: string }[]>([]),
    [blocked, setBlocked] = useState<
      { date: string; start: string; end: string }[]
    >([]);
  const [checkin, setCheckin] = useState<number[] | null>(null),
    [toast, setToast] = useState(""),
    [selectedPatient, setSelectedPatient] = useState("MN-1042");
  const [roster, setRoster] = useState(
    psychologists.map((name, i) => ({
      name,
      active: true,
      specialty: [
        "Workplace stress, resilience",
        "Stress & burnout",
        "Individual consultation",
        "Professional coaching",
      ][i],
      languages: "Albanian / English",
      count: [31, 24, 28, 19][i],
    })),
  );
  const [services, setServices] = useState(
    [
      "Individual Psychological Consultation",
      "Stress & Burnout Support",
      "Professional Coaching",
      "Resilience & Well-being Check-in",
    ].map((name) => ({ name, active: true })),
  );
  const t = (s: string) => translate(lang, s);
  function notify(s: string) {
    setToast(s);
    window.setTimeout(() => setToast(""), 3500);
  }
  function navigate(p: string) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function switchRole(r: Role | null) {
    setRole(r);
    setPage(r === "admin" ? "Overview" : "Home");
    setSelectedPatient("MN-1042");
  }
  function log(actor: string, action: string, resource: string) {
    setAudit((a) => [
      {
        time:
          "Sep 14 · " +
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        actor,
        action,
        resource,
      },
      ...a,
    ]);
  }
  function scheduleFor(name: string) {
    return name === psychologists[0]
      ? { hours, timeOff, blocked }
      : { hours: defaultHours(), timeOff: [], blocked: [] };
  }
  function hasCareRelationship(
    patient: string,
    psychologist = psychologists[0],
  ) {
    return appointments.some(
      (a) =>
        a.patient === patient &&
        a.psychologist === psychologist &&
        a.status !== "Cancelled",
    );
  }
  function reserveAppointment(
    psychologist: string,
    date: string,
    time: string,
    existing?: Appointment,
  ) {
    if (!roster.some((p) => p.active && p.name === psychologist))
      return "Choose an available psychologist.";
    if (
      existing &&
      !appointments.some(
        (a) =>
          a.id === existing.id &&
          a.patient === "MN-1042" &&
          a.status === "Upcoming",
      )
    )
      return "This appointment cannot be rescheduled.";
    if (!existing && allowance(appointments, "MN-1042").remaining === 0)
      return "Your three-session allowance is fully used or reserved.";
    if (
      !availableSlots(
        date,
        psychologist,
        "MN-1042",
        scheduleFor(psychologist),
        appointments,
        existing?.id,
      ).includes(time)
    )
      return "That time is no longer available. Please select another.";
    const next: Appointment = {
      id: existing?.id ?? crypto.randomUUID(),
      patient: "MN-1042",
      psychologist,
      date,
      time,
      service:
        existing?.service ??
        services.find((s) => s.active)?.name ??
        "Individual Psychological Consultation",
      status: "Upcoming",
    };
    setAppointments((a) =>
      existing ? a.map((x) => (x.id === existing.id ? next : x)) : [...a, next],
    );
    setPeople((p) =>
      p.map((x) => (x.id === "MN-1042" ? { ...x, psychologist } : x)),
    );
    return "";
  }
  function updateAppointment(id: string, changes: Partial<Appointment>) {
    setAppointments((a) =>
      a.map((x) => (x.id === id ? { ...x, ...changes } : x)),
    );
  }
  return {
    hasCareRelationship,
    scheduleFor,
    reserveAppointment,
    profiles,
    setProfiles,
    role,
    lang,
    page,
    setLang,
    navigate,
    switchRole,
    t,
    appointments,
    setAppointments,
    updateAppointment,
    employees,
    setEmployees,
    people,
    setPeople,
    audit,
    log,
    notes,
    setNotes,
    messages,
    setMessages,
    hours,
    setHours,
    timeOff,
    setTimeOff,
    blocked,
    setBlocked,
    checkin,
    setCheckin,
    toast,
    notify,
    selectedPatient,
    setSelectedPatient,
    roster,
    setRoster,
    services,
    setServices,
  };
}
type Demo = ReturnType<typeof useDemoState>;
const Context = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useDemoState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing demo provider");
  return value;
}
