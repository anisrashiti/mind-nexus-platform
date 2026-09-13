export type Role = "patient" | "psychologist" | "organization" | "admin";
export type Status = "Upcoming" | "Completed" | "Cancelled" | "No-show";
export type Appointment = {
  id: string;
  patient: string;
  psychologist: string;
  date: string;
  time: string;
  service: string;
  status: Status;
};
export const psychologists = [
  "Dr. Luljeta Berisha",
  "Dr. Erion Gashi",
  "Dr. Nora Krasniqi",
  "Dr. Arben Hoxha",
];
export const patients = [
  {
    id: "MN-1042",
    name: "Arta Krasniqi",
    email: "arta.k@aurora.example",
    initials: "AK",
    psychologist: psychologists[0],
    language: "Albanian",
    last: "2026-09-10",
  },
  {
    id: "MN-1043",
    name: "Besnik Hoxha",
    email: "besnik.h@aurora.example",
    initials: "BH",
    psychologist: psychologists[0],
    language: "Albanian",
    last: "2026-09-09",
  },
  {
    id: "MN-1044",
    name: "Era Gashi",
    email: "era.g@aurora.example",
    initials: "EG",
    psychologist: psychologists[0],
    language: "English",
    last: "2026-09-08",
  },
  {
    id: "MN-1045",
    name: "Dren Berisha",
    email: "dren.b@aurora.example",
    initials: "DB",
    psychologist: psychologists[0],
    language: "Albanian",
    last: "2026-09-07",
  },
  {
    id: "MN-1098",
    name: "Elira Shala",
    email: "elira.s@aurora.example",
    initials: "ES",
    psychologist: "",
    language: "Albanian",
    last: "—",
  },
  {
    id: "MN-1099",
    name: "Leon Kelmendi",
    email: "leon.k@aurora.example",
    initials: "LK",
    psychologist: "",
    language: "English",
    last: "—",
  },
];
export const serviceNames = [
  "Individual Psychological Consultation",
  "Stress & Burnout Support",
  "Well-being Check-in",
  "Professional Coaching",
];
export const initialAppointments: Appointment[] = [
  {
    id: "APT-2401",
    patient: "MN-1042",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "14:30",
    service: serviceNames[0],
    status: "Upcoming",
  },
  {
    id: "APT-2402",
    patient: "MN-1043",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "09:30",
    service: serviceNames[1],
    status: "Upcoming",
  },
  {
    id: "APT-2403",
    patient: "MN-1044",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "10:15",
    service: serviceNames[2],
    status: "Upcoming",
  },
  {
    id: "APT-2404",
    patient: "MN-1045",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "11:00",
    service: serviceNames[0],
    status: "Upcoming",
  },
  {
    id: "APT-2405",
    patient: "MN-1043",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "15:00",
    service: serviceNames[3],
    status: "Upcoming",
  },
  {
    id: "APT-2406",
    patient: "MN-1044",
    psychologist: psychologists[0],
    date: "2026-09-14",
    time: "15:30",
    service: serviceNames[0],
    status: "Upcoming",
  },
  ...["2026-09-10", "2026-09-03", "2026-08-27"].map((date, i) => ({
    id: `APT-239${i}`,
    patient: "MN-1042",
    psychologist: psychologists[0],
    date,
    time: "14:00",
    service: serviceNames[0],
    status: "Completed" as Status,
  })),
  {
    id: "APT-2380",
    patient: "MN-1042",
    psychologist: psychologists[0],
    date: "2026-08-20",
    time: "09:00",
    service: serviceNames[0],
    status: "Cancelled",
  },
];
export const usage = [
  { month: "Apr", sessions: 12 },
  { month: "May", sessions: 18 },
  { month: "Jun", sessions: 21 },
  { month: "Jul", sessions: 17 },
  { month: "Aug", sessions: 28 },
  { month: "Sep", sessions: 30 },
];
export const trend = [
  { month: "Aug 10", score: 48 },
  { month: "Aug 17", score: 54 },
  { month: "Aug 24", score: 51 },
  { month: "Aug 31", score: 63 },
  { month: "Sep 7", score: 67 },
  { month: "Sep 12", score: 72 },
];
export const resources = [
  {
    title: "Understanding workplace stress",
    sq: "Të kuptojmë stresin në punë",
    category: "WORK & WELL-BEING",
    minutes: 5,
    body: "Recognizing your own patterns is a useful first step. Notice which parts of the working day feel demanding, and which moments help you feel more settled. Consider bringing these observations to your next session. You do not need to have everything figured out before asking for support.",
  },
  {
    title: "Recognizing burnout",
    sq: "Të njohim rraskapitjen profesionale",
    category: "SELF-AWARENESS",
    minutes: 6,
    body: "Use this space to reflect on energy, boundaries, and the support available at work. A conversation with your psychologist can help you explore what you are experiencing. This preview article is educational and is not an assessment or a diagnosis.",
  },
  {
    title: "Building psychological resilience",
    sq: "Forcimi i qëndrueshmërisë psikologjike",
    category: "PERSONAL GROWTH",
    minutes: 4,
    body: "Think about a difficult moment you have navigated and the people or routines that helped. Resilience can include asking for support, adapting expectations, and making room for recovery. Bring one example to your next conversation.",
  },
  {
    title: "Sleep and recovery",
    sq: "Gjumi dhe rikuperimi",
    category: "EVERYDAY BALANCE",
    minutes: 5,
    body: "Reflect on the transition between work and rest. What helps you set the day aside? Use your next session to discuss routines that feel realistic for your schedule, including shift work. This resource is a conversation starter, not medical advice.",
  },
  {
    title: "Preparing for difficult conversations",
    sq: "Përgatitja për biseda të vështira",
    category: "COMMUNICATION",
    minutes: 7,
    body: "Before a conversation, write down what you want the other person to understand. Separate what happened, how it affected you, and what you would like to ask for. Leave room to hear their perspective. You can rehearse the conversation with your psychologist.",
  },
];
export const initialEmployees = patients.map((p, i) => ({
  id: p.id,
  name: p.name,
  email: p.email,
  department: [
    "Nursing",
    "Operations",
    "Emergency",
    "Administration",
    "Nursing",
    "Laboratory",
  ][i],
  active: true,
}));
export const initialAudit = [
  {
    time: "Sep 14 · 09:42",
    actor: psychologists[0],
    action: "Viewed patient",
    resource: "MN-1042",
  },
  {
    time: "Sep 14 · 09:48",
    actor: psychologists[0],
    action: "Created session note",
    resource: "NOTE-201",
  },
  {
    time: "Sep 14 · 10:03",
    actor: "Mind Nexus Admin",
    action: "Reviewed assignment queue",
    resource: "ASSIGNMENTS",
  },
  {
    time: "Sep 14 · 10:12",
    actor: "Organization Admin",
    action: "Updated employee eligibility",
    resource: "ELIGIBILITY",
  },
];
export function formatDate(date: string, lang = "en") {
  return new Date(date + "T12:00:00").toLocaleDateString(
    lang === "sq" ? "sq-AL" : "en-GB",
    { month: "short", day: "numeric" },
  );
}
export function endTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + Math.floor((m + 15) / 60)).padStart(2, "0")}:${String((m + 15) % 60).padStart(2, "0")}`;
}
