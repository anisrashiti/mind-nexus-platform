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
  type CareRelationship,
  program,
} from "@/lib/data";
import {
  defaultHours,
  availableSlots,
  allowance,
  type Hours,
  type Schedule,
} from "@/lib/scheduling";
import { useDemoStorage } from "@/lib/use-demo-storage";
import { translate, type Language } from "@/lib/i18n";
export type Note = {
  id: string;
  patient: string;
  session: string;
  text: string;
  follow: boolean;
  interval: string;
  complete: boolean;
  psychologist?: string;
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
  const [profiles, setProfiles] = useDemoStorage<
    Record<
      string,
      { email: string; bio: string; specialty: string; notices: boolean[] }
    >
  >("profiles", {});
  const [activePsychologist, setActivePsychologist] = useState(
    psychologists[0],
  );
  const [role, setRole] = useState<Role | null>(null),
    [lang, setLang] = useState<Language>("en"),
    [page, setPage] = useState("Home");
  const [onboarded, setOnboarded] = useDemoStorage("onboarded", false);
  const [relationships, setRelationships] = useDemoStorage<CareRelationship[]>(
    "relationships",
    patients
      .filter((p) => p.psychologist)
      .map((p) => ({
        id: `care-${p.id}`,
        patient: p.id,
        psychologist: p.psychologist,
        status: "active",
      })),
  );
  const [changeRequested, setChangeRequested] = useDemoStorage(
    "changeRequested",
    false,
  );
  const [privateRequested, setPrivateRequested] = useDemoStorage(
    "privateRequested",
    false,
  );
  const [reflections, setReflections] = useDemoStorage<
    { patient: string; psychologist: string; answers: string[] }[]
  >("reflections", []);
  const primaryPsychologist =
    relationships.find((r) => r.patient === "MN-1042" && r.status === "active")
      ?.psychologist ?? "";
  function choosePsychologist(name: string) {
    if (onboarded || !roster.some((r) => r.name === name && r.active)) return;
    setRelationships((r) => [
      ...r.filter((x) => x.patient !== "MN-1042"),
      {
        id: "care-MN-1042",
        patient: "MN-1042",
        psychologist: name,
        status: "active",
      },
    ]);
    // Seeded Arta records represent the selected fictional relationship.
    setAppointments((a) =>
      a.map((x) =>
        x.patient === "MN-1042" ? { ...x, psychologist: name } : x,
      ),
    );
    setMessages((m) =>
      m.map((x) =>
        x.patient === "MN-1042" ? { ...x, psychologist: name } : x,
      ),
    );
    setNotes((n) =>
      n.map((x) =>
        x.patient === "MN-1042" ? { ...x, psychologist: name } : x,
      ),
    );
    setPeople((p) =>
      p.map((x) => (x.id === "MN-1042" ? { ...x, psychologist: name } : x)),
    );
  }
  const [appointments, setAppointments] = useDemoStorage(
      "appointments",
      initialAppointments,
    ),
    [employees, setEmployees] = useDemoStorage("employees", initialEmployees),
    [people, setPeople] = useDemoStorage("people", patients),
    [audit, setAudit] = useDemoStorage("audit", initialAudit);
  const [notes, setNotes] = useDemoStorage<Note[]>("notes", [
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
  const [messages, setMessages] = useDemoStorage<Message[]>("messages", [
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
  const [schedules, setSchedules] = useDemoStorage<Record<string, Schedule>>(
    "schedules",
    {},
  );
  const currentSchedule = scheduleFor(activePsychologist);
  const { hours, timeOff, blocked } = currentSchedule;
  function setHours(next: Hours[]) {
    setSchedules((s) => ({
      ...s,
      [activePsychologist]: { ...currentSchedule, hours: next },
    }));
  }
  function setTimeOff(next: Schedule["timeOff"]) {
    setSchedules((s) => ({
      ...s,
      [activePsychologist]: { ...currentSchedule, timeOff: next },
    }));
  }
  function setBlocked(next: Schedule["blocked"]) {
    setSchedules((s) => ({
      ...s,
      [activePsychologist]: { ...currentSchedule, blocked: next },
    }));
  }
  const [checkin, setCheckin] = useState<number[] | null>(null),
    [toast, setToast] = useState(""),
    [selectedPatient, setSelectedPatient] = useState("MN-1042");
  const [roster, setRoster] = useDemoStorage(
    "roster",
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
    if (r === "psychologist")
      setActivePsychologist(primaryPsychologist || psychologists[0]);
    setRole(r);
    setPage(
      r === "admin" ? "Overview" : r === "psychologist" ? "Today" : "Home",
    );
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
    return (
      schedules[name] ?? { hours: defaultHours(), timeOff: [], blocked: [] }
    );
  }
  function hasCareRelationship(
    patient: string,
    psychologist = activePsychologist,
  ) {
    return relationships.some(
      (r) => r.patient === patient && r.psychologist === psychologist,
    );
  }
  function reserveAppointment(
    psychologist: string,
    date: string,
    time: string,
    existing?: Appointment,
  ) {
    if (psychologist !== primaryPsychologist)
      return "Bookings stay with your chosen psychologist.";
    if (!employees.some((e) => e.id === "MN-1042" && e.active))
      return "Your eligibility needs review. Contact Mind Nexus.";
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
    if (!existing && poolRemaining === 0)
      return "The program pool is fully reserved. Contact Mind Nexus.";
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
      funding: existing?.funding ?? "employer",
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
  const employerAppointments = appointments.filter(
    (a) => a.funding !== "private",
  );
  const poolUsed =
    program.historicalUsed +
    employerAppointments.filter(
      (a) => a.status === "Completed" || a.status === "No-show",
    ).length;
  const poolReserved = employerAppointments.filter(
    (a) => a.status === "Upcoming",
  ).length;
  const poolRemaining = Math.max(
    0,
    program.purchased - poolUsed - poolReserved,
  );
  return {
    activePsychologist,
    onboarded,
    setOnboarded,
    relationships,
    primaryPsychologist,
    choosePsychologist,
    changeRequested,
    setChangeRequested,
    privateRequested,
    setPrivateRequested,
    reflections,
    setReflections,
    poolUsed,
    poolReserved,
    poolRemaining,
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
