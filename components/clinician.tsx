"use client";
import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Video,
  FileText,
  MessageSquare,
  ClipboardCheck,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  LockKeyhole,
} from "lucide-react";
import { useDemo, type Note } from "./demo-context";
import {
  Avatar,
  Badge,
  Button,
  Modal,
  Privacy,
  SectionTitle,
  Tabs,
} from "./ui";
import { PageHeader, questions } from "./patient";
import { TrendChart } from "./charts";
import { isHalfHour, halfHourTimes } from "@/lib/scheduling";
import { formatDate, endTime, type Appointment } from "@/lib/data";
export function ClinicianHome() {
  const { t, navigate, appointments, people, notes, setSelectedPatient } =
    useDemo();
  const today = appointments
    .filter(
      (a) =>
        a.date === "2026-09-14" &&
        a.status === "Upcoming" &&
        a.psychologist === "Dr. Luljeta Berisha",
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  function open(a: Appointment) {
    setSelectedPatient(a.patient);
    navigate("Patient detail");
  }
  return (
    <>
      <PageHeader
        title="Good morning, Luljeta."
        subtitle="Here’s your day at a glance."
      >
        <Button variant="secondary" onClick={() => navigate("Calendar")}>
          <CalendarDays size={17} />
          {t("View calendar")}
        </Button>
      </PageHeader>
      <div className="clinician-summary">
        <div className="summary-intro">
          <span className="summary-mark">◍</span>
          <div>
            <h2>{t("Room for meaningful conversations.")}</h2>
            <p>{t("Your schedule is ready. Take it one session at a time.")}</p>
          </div>
        </div>
        <div className="summary-date">
          <strong>14</strong>
          <span>
            {t("Monday")}
            <small>September 2026</small>
          </span>
        </div>
      </div>
      <div className="metrics clinician-metrics">
        {[
          ["Today’s sessions", today.length, "Session duration: 50 minutes"],
          ["Active patients", 31, "In your care"],
          [
            "Pending notes",
            notes.filter((n) => !n.complete).length,
            "Ready for your review",
          ],
        ].map(([label, value, sub]) => (
          <div key={label}>
            <span className="eyebrow">{t(String(label))}</span>
            <strong>{value}</strong>
            <p>{t(String(sub))}</p>
          </div>
        ))}
      </div>
      <div className="clinical-main">
        <section className="today-agenda">
          <SectionTitle
            title={t("Today")}
            action={t("View calendar")}
            onAction={() => navigate("Calendar")}
          />
          <div className="agenda-caption">
            <span>
              {today.length} {t("sessions scheduled")}
            </span>
            <span>Europe/Tirane</span>
          </div>
          {today.slice(0, 4).map((a, i) => {
            const p = people.find((p) => p.id === a.patient)!;
            return (
              <div className={`agenda-row ${i === 0 ? "next" : ""}`} key={a.id}>
                <div className="agenda-time">
                  <strong>{a.time}</strong>
                  <small>{endTime(a.time)}</small>
                </div>
                <div className="agenda-track">
                  <i />
                </div>
                <Avatar name={p.name} />
                <div className="agenda-person">
                  <h3>
                    {p.name.split(" ")[0]} {p.name.split(" ")[1][0]}.
                  </h3>
                  <p>{t(a.service)}</p>
                  <span>
                    <Video size={12} />
                    {t("Online")} · {t("Session duration: 50 minutes")}
                  </span>
                </div>
                <Button
                  variant={i === 0 ? "primary" : "secondary"}
                  onClick={() => open(a)}
                >
                  {t("Open")}
                  <ArrowUpRight size={14} />
                </Button>
              </div>
            );
          })}
        </section>
        <aside className="attention-column">
          <SectionTitle title={t("Requires attention")} />
          <div className="attention-list">
            {[
              [
                FileText,
                `${notes.filter((n) => !n.complete).length} session notes need completion`,
                "Patients",
              ],
              [MessageSquare, "3 new messages", "Messages"],
              [ClipboardCheck, "1 assessment ready for review", "Assessments"],
            ].map(([Icon, label, target]) => {
              const I = Icon as typeof FileText;
              return (
                <button
                  key={String(label)}
                  onClick={() => navigate(String(target))}
                >
                  <span className="attention-icon">
                    <I size={18} />
                  </span>
                  <span>{t(String(label))}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
          <div className="weekly-summary">
            <span className="eyebrow">{t("This week")}</span>
            <h2>{t("Your week in perspective")}</h2>
            <div
              className="week-bars"
              aria-label="Completed sessions by weekday"
            >
              {[5, 6, 4, 5, 4].map((n, i) => (
                <div key={i}>
                  <span style={{ height: n * 12 }} />
                  <small>{["M", "T", "W", "T", "F"][i]}</small>
                </div>
              ))}
            </div>
            <div className="weekly-counts">
              <span>
                <strong>24</strong>
                {t("Completed")}
              </span>
              <span>
                <strong>2</strong>
                {t("Cancelled")}
              </span>
              <span>
                <strong>1</strong>
                {t("No-show")}
              </span>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("Sessions")}
            >
              {t("View sessions")}
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="quiet-note">
            <LockKeyhole size={18} />
            <p>
              {t(
                "Your clinical workspace is private. Organizations receive aggregate reports only.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Patients() {
  const {
    t,
    people,
    appointments,
    navigate,
    setSelectedPatient,
    log,
    hasCareRelationship,
  } = useDemo();
  const [search, setSearch] = useState("");
  const list = people.filter(
    (p) =>
      hasCareRelationship(p.id) &&
      (p.name + " " + p.id).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Continuity of care, one conversation at a time."
      />
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder={t("Search patients")}
            aria-label={t("Search patients")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge tone="neutral">{t("Patients who chose you")}</Badge>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Patient",
                "Patient ID",
                "Last session",
                "Next session",
                "Status",
                "",
              ].map((s) => (
                <th key={s}>{t(s)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <button
                    className="person-cell"
                    onClick={() => {
                      setSelectedPatient(p.id);
                      navigate("Patient detail");
                      log("Dr. Luljeta Berisha", "Viewed patient", p.id);
                    }}
                  >
                    <Avatar name={p.name} />
                    <strong>{p.name}</strong>
                  </button>
                </td>
                <td>{p.id}</td>
                <td>{formatDate(p.last)}</td>
                <td>
                  {formatDate(
                    appointments
                      .filter(
                        (a) => a.patient === p.id && a.status === "Upcoming",
                      )
                      .sort((a, b) => a.date.localeCompare(b.date))[0]?.date ??
                      "2026-09-17",
                  )}
                </td>
                <td>
                  <Badge>{t("Active")}</Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`${t("Open")} ${p.name}`}
                    onClick={() => {
                      setSelectedPatient(p.id);
                      navigate("Patient detail");
                    }}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="empty-state">{t("No results found.")}</p>
        )}
      </div>
      <Privacy>{t("Clinical note — restricted access")}</Privacy>
    </>
  );
}
export function PatientDetail() {
  const {
    t,
    people,
    selectedPatient,
    appointments,
    notes,
    navigate,
    checkin,
    hasCareRelationship,
  } = useDemo();
  const p = people.find(
    (p) => p.id === selectedPatient && hasCareRelationship(p.id),
  );
  const [tab, setTab] = useState("Overview"),
    [editing, setEditing] = useState<Note | boolean>(false);
  if (!p)
    return (
      <div className="empty-state">
        {t("Patient unavailable in your workspace.")}
      </div>
    );
  const appts = appointments.filter(
    (a) => a.patient === p.id && a.psychologist === "Dr. Luljeta Berisha",
  );
  const next = appts
    .filter((a) => a.status === "Upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  return (
    <>
      <button
        className="text-button back-link"
        onClick={() => navigate("Patients")}
      >
        <ChevronLeft size={16} />
        {t("Patients")}
      </button>
      <div className="patient-profile-header">
        <Avatar name={p.name} size="large" />
        <div>
          <h1>{p.name}</h1>
          <p>
            {p.id} <span>·</span> {t("Active patient")}
          </p>
        </div>
        <Button onClick={() => setEditing(true)}>
          <Plus size={17} />
          {t("New note")}
        </Button>
      </div>
      <div className="profile-dates">
        <span>
          {t("Last session")}: <strong>{formatDate(p.last)}</strong>
        </span>
        <span>
          {t("Next session")}:{" "}
          <strong>{next ? formatDate(next.date) : "—"}</strong>
        </span>
        <Badge tone="neutral">
          <LockKeyhole size={12} />
          {t("Confidential")}
        </Badge>
      </div>
      <Tabs
        items={[
          "Overview",
          "Sessions",
          "Notes",
          "Assessments",
          "Documents",
        ].map(t)}
        value={t(tab)}
        onChange={(s) =>
          setTab(
            ["Overview", "Sessions", "Notes", "Assessments", "Documents"].find(
              (x) => t(x) === s,
            )!,
          )
        }
      />
      {tab === "Overview" && (
        <div className="profile-grid">
          <section>
            <SectionTitle title={t("Contact information")} />
            <dl className="details">
              <div>
                <dt>{t("Email")}</dt>
                <dd>{p.email}</dd>
              </div>
              <div>
                <dt>{t("Preferred language")}</dt>
                <dd>{p.language}</dd>
              </div>
              <div>
                <dt>{t("Chosen psychologist")}</dt>
                <dd>{p.psychologist}</dd>
              </div>
            </dl>
            <SectionTitle title={t("Intake summary")} />
            <p className="prose">
              {t(
                "Seeking a regular space to reflect on workplace pressures and establish a sustainable work–rest routine. Prefers online sessions in the afternoon.",
              )}
            </p>
            <SectionTitle title={t("Follow-up status")} />
            <Badge>{t("Next appointment scheduled")}</Badge>
          </section>
          <aside className="surface profile-aside">
            <span className="eyebrow">{t("Next session")}</span>
            <h2>{next ? formatDate(next.date) : t("Not scheduled")}</h2>
            <p>
              {next ? `${next.time}–${endTime(next.time)}` : "—"} ·{" "}
              {t("Online")}
            </p>
            <hr />
            <span className="eyebrow">{t("Recent well-being result")}</span>
            <strong className="score">
              {p.id === "MN-1042" && checkin
                ? Math.round((checkin.reduce((a, b) => a + b, 0) / 25) * 100)
                : 72}
              <small>/ 100</small>
            </strong>
            <p>12 Sep · {t("Self-reported reflection")}</p>
            <button
              className="text-button"
              onClick={() => setTab("Assessments")}
            >
              {t("View responses")}
              <ArrowRight size={16} />
            </button>
          </aside>
        </div>
      )}
      {tab === "Sessions" && (
        <div className="surface">
          {appts.map((a) => (
            <div key={a.id} className="record-row">
              <CalendarDays size={18} />
              <div>
                <h3>
                  {formatDate(a.date)} · {a.time}
                </h3>
                <p>{t(a.service)}</p>
              </div>
              <Badge tone={a.status === "Cancelled" ? "neutral" : "green"}>
                {t(a.status)}
              </Badge>
              <Button
                variant="secondary"
                onClick={() =>
                  setEditing(notes.find((n) => n.session === a.id) ?? true)
                }
              >
                {t("Notes")}
              </Button>
            </div>
          ))}
        </div>
      )}
      {tab === "Notes" && (
        <>
          <Privacy>{t("Confidential clinical record")}</Privacy>
          {notes
            .filter((n) => n.patient === p.id)
            .map((n) => (
              <div className="note-record surface" key={n.id}>
                <div>
                  <span className="eyebrow">{n.session}</span>
                  <Badge tone={n.complete ? "green" : "amber"}>
                    {t(n.complete ? "Completed / Signed" : "Draft")}
                  </Badge>
                </div>
                <p>{n.text || t("Note awaiting completion.")}</p>
                <Button variant="secondary" onClick={() => setEditing(n)}>
                  {t(n.complete ? "View note" : "Continue note")}
                </Button>
              </div>
            ))}
          {!notes.some((n) => n.patient === p.id) && (
            <div className="empty-state">
              <FileText size={25} />
              <h3>{t("No notes yet.")}</h3>
              <Button onClick={() => setEditing(true)}>{t("New note")}</Button>
            </div>
          )}
        </>
      )}
      {tab === "Assessments" && <AssessmentContent patientId={p.id} />}{" "}
      {tab === "Documents" && (
        <div className="record-row surface">
          <FileText size={22} />
          <div>
            <h3>{t("Program consent record")}</h3>
            <p>CONSENT-1042 · 24 Aug 2026</p>
          </div>
          <Badge>{t("Acknowledged")}</Badge>
          <Button variant="secondary" onClick={() => navigate("Settings")}>
            {t("Privacy & consent")}
          </Button>
        </div>
      )}
      {editing && (
        <NoteEditor
          note={typeof editing === "object" ? editing : undefined}
          patientId={p.id}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
export function NoteEditor({
  note,
  patientId,
  onClose,
}: {
  note?: Note;
  patientId: string;
  onClose: () => void;
}) {
  const { t, appointments, people, notes, setNotes, notify, log } = useDemo();
  const [text, setText] = useState(note?.text ?? ""),
    [follow, setFollow] = useState(note?.follow ?? false),
    [interval, setInterval] = useState(note?.interval ?? "1 week"),
    [session, setSession] = useState(
      note?.session ??
        appointments.find(
          (a) =>
            a.patient === patientId && a.psychologist === "Dr. Luljeta Berisha",
        )?.id ??
        "",
    );
  const p = people.find((p) => p.id === patientId)!;
  const a = appointments.find((a) => a.id === session);
  function save(complete: boolean) {
    const n: Note = {
      id: note?.id ?? `NOTE-${Date.now()}`,
      patient: patientId,
      session,
      text,
      follow,
      interval,
      complete,
    };
    setNotes(
      notes.some((x) => x.id === n.id)
        ? notes.map((x) => (x.id === n.id ? n : x))
        : [...notes, n],
    );
    log(
      "Dr. Luljeta Berisha",
      complete ? "Completed session note" : "Saved note draft",
      n.id,
    );
    notify("Saved successfully.");
    onClose();
  }
  return (
    <Modal
      title={t(note?.complete ? "Completed / Signed" : "Session note")}
      description={t("Confidential clinical record")}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(true);
        }}
      >
        <div className="form-grid">
          <label>
            {t("Patient")}
            <input value={`${p.name} · ${p.id}`} readOnly />
          </label>
          <label>
            {t("Session")}
            <select
              value={session}
              disabled={note?.complete}
              onChange={(e) => setSession(e.target.value)}
            >
              {appointments
                .filter((a) => a.patient === patientId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatDate(a.date)} · {a.time} · {a.status}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="form-meta">
          {t("Date")}: {a ? formatDate(a.date) : "—"}
        </p>
        <label>
          {t("Session note")}
          <textarea
            value={text}
            required
            disabled={note?.complete}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={t("Write your private session note…")}
          />
        </label>
        <div className="form-grid spaced">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={follow}
              disabled={note?.complete}
              onChange={(e) => setFollow(e.target.checked)}
            />
            {t("Follow-up required")}
          </label>
          {follow && (
            <label>
              {t("Recommended follow-up")}
              <select
                value={interval}
                disabled={note?.complete}
                onChange={(e) => setInterval(e.target.value)}
              >
                {["1 week", "2 weeks", "4 weeks"].map((x) => (
                  <option value={x} key={x}>
                    {t(x)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <Privacy>{t("Clinical note — restricted access")}</Privacy>
        {!note?.complete && (
          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={!text.trim()}
              onClick={() => save(false)}
            >
              {t("Save draft")}
            </Button>
            <Button disabled={!text.trim() || !session}>
              {t("Complete note")}
              <Check size={17} />
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
export function AssessmentContent({
  patientId = "MN-1042",
}: {
  patientId?: string;
}) {
  const { t, checkin } = useDemo();
  const [show, setShow] = useState(false);
  const answers =
    patientId === "MN-1042" && checkin ? checkin : [4, 3, 3, 4, 4];
  return (
    <>
      <div className="record-row surface">
        <ClipboardCheck size={22} />
        <div>
          <h3>{t("Well-being Check-in")}</h3>
          <p>
            {t("Completed")} ·{" "}
            {patientId === "MN-1042" && checkin ? "14" : "12"} Sep ·{" "}
            {t("Score")}:{" "}
            {Math.round((answers.reduce((a, b) => a + b, 0) / 25) * 100)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShow(true)}>
          {t("View responses")}
        </Button>
      </div>
      <div className="surface chart-surface">
        <SectionTitle title={t("Well-being trend")} />
        {patientId === "MN-1042" ? (
          <TrendChart />
        ) : (
          <p className="empty-state">
            {t("One check-in available. More reflections will build a trend.")}
          </p>
        )}
        <p>{t("Self-reported reflection. Not a diagnostic tool.")}</p>
      </div>
      {show && (
        <Modal title={t("Well-being Check-in")} onClose={() => setShow(false)}>
          {questions.map((q, i) => (
            <div className="response-row" key={q}>
              <span>{t(q)}</span>
              <Badge>{answers[i]} / 5</Badge>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
export function Assessments() {
  const { t, people, hasCareRelationship } = useDemo();
  const [id, setId] = useState("MN-1042");
  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle="Reflections that support the conversation."
      />
      <label className="filter-label">
        {t("Patient")}
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {people
            .filter((p) => hasCareRelationship(p.id))
            .map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </label>
      <AssessmentContent patientId={id} />
    </>
  );
}
export function Availability() {
  const { t, hours, setHours, timeOff, setTimeOff, notify, log } = useDemo();
  const timetable = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (timetable.current) timetable.current.scrollTop = 16 * 38;
  }, []);
  const [draft, setDraft] = useState(hours),
    [off, setOff] = useState(false),
    [start, setStart] = useState("2026-09-21"),
    [end, setEnd] = useState("2026-09-25");
  function toggle(day: number, time: string) {
    setDraft((days) =>
      days.map((d, i) =>
        i !== day
          ? d
          : {
              ...d,
              slots: d.slots.includes(time)
                ? d.slots.filter((s) => s !== time)
                : [...d.slots, time].sort(),
            },
      ),
    );
  }
  function save() {
    setHours(draft);
    notify("Saved successfully.");
    log(
      "Dr. Luljeta Berisha",
      "Updated recurring availability",
      "AVAILABILITY",
    );
  }
  return (
    <>
      <PageHeader
        title="Availability"
        subtitle="Create a rhythm that works for you."
      >
        <Button onClick={save}>{t("Save changes")}</Button>
      </PageHeader>
      <div className="availability-layout">
        <section>
          <SectionTitle title={t("Weekly timetable")} />
          <p className="section-subtitle">
            {t(
              "Select each 30-minute block to make it available or unavailable.",
            )}{" "}
            {t("This timetable repeats each week.")}
          </p>
          <div className="timetable-legend">
            <span>
              <Check size={14} /> {t("Available")}
            </span>
            <span>{t("Unavailable")}</span>
            <span>Europe/Tirane</span>
          </div>
          <div
            className="surface availability-timetable"
            ref={timetable}
            role="region"
            aria-label={t("Weekly timetable")}
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("Time")}</th>
                  {draft.map((d) => (
                    <th scope="col" key={d.day}>
                      {t(d.day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {halfHourTimes.map((time, index) => (
                  <tr key={time}>
                    <th scope="row">{time}</th>
                    {draft.map((d, day) => (
                      <td key={d.day}>
                        <button
                          type="button"
                          aria-label={t(d.day) + " " + time}
                          aria-pressed={d.slots.includes(time)}
                          title={
                            time +
                            " - " +
                            (halfHourTimes[index + 1] ?? "24:00") +
                            ": " +
                            t(
                              d.slots.includes(time)
                                ? "Available"
                                : "Unavailable",
                            )
                          }
                          onClick={() => toggle(day, time)}
                        >
                          {d.slots.includes(time) ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <span aria-hidden="true">-</span>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-subtitle">
            {t(
              "Bookings require two consecutive available blocks (1 hour). Session duration: 50 minutes.",
            )}
          </p>
        </section>
        <aside className="timeoff-section">
          <SectionTitle title={t("Time off")} />
          <p>
            {t(
              "Reserve space for rest. These dates will not be available for booking.",
            )}
          </p>
          {timeOff.map((x, i) => (
            <div className="timeoff-row" key={i}>
              <span>
                {formatDate(x.start)} — {formatDate(x.end)}
              </span>
              <button
                className="text-button"
                onClick={() => setTimeOff(timeOff.filter((_, j) => j !== i))}
              >
                {t("Cancel")}
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setOff(true)}>
            <Plus size={16} />
            {t("Add time off")}
          </Button>
          <Privacy>
            {t(
              "Existing appointments are kept. Contact affected patients to reschedule.",
            )}
          </Privacy>
        </aside>
      </div>
      {off && (
        <Modal title={t("Time off")} onClose={() => setOff(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (start > end) return;
              setTimeOff([...timeOff, { start, end }]);
              setOff(false);
              notify("Saved successfully.");
            }}
          >
            <div className="form-grid">
              <label>
                {t("Start")}
                <input
                  type="date"
                  min="2026-09-14"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label>
                {t("End")}
                <input
                  type="date"
                  min={start}
                  required
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <Button>{t("Confirm")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function ClinicianSessions() {
  const { t, appointments, people, navigate, setSelectedPatient } = useDemo();
  const [tab, setTab] = useState("Today");
  const list = appointments
    .filter((a) => a.psychologist === "Dr. Luljeta Berisha")
    .filter((a) =>
      tab === "Today"
        ? a.date === "2026-09-14" && a.status === "Upcoming"
        : a.status === tab,
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <PageHeader
        title="Sessions"
        subtitle="A clear view of the care you provide."
      />
      <Tabs
        items={["Today", "Upcoming", "Completed", "Cancelled"].map(t)}
        value={t(tab)}
        onChange={(x) =>
          setTab(
            ["Today", "Upcoming", "Completed", "Cancelled"].find(
              (v) => t(v) === x,
            )!,
          )
        }
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["Patient", "Date", "Session", "Status", ""].map((x) => (
                <th key={x}>{t(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>
                    {people.find((p) => p.id === a.patient)?.name}
                  </strong>
                  <small>{a.patient}</small>
                </td>
                <td>
                  {formatDate(a.date)}
                  <small>
                    {a.time}–{endTime(a.time)}
                  </small>
                </td>
                <td>{t(a.service)}</td>
                <td>
                  <Badge tone={a.status === "Cancelled" ? "neutral" : "green"}>
                    {t(a.status)}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedPatient(a.patient);
                      navigate("Patient detail");
                    }}
                  >
                    {t("Open")}
                    <ArrowUpRight size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="empty-state">{t("No appointments here.")}</p>
        )}
      </div>
    </>
  );
}
export function ClinicianCalendar() {
  const {
    t,
    appointments,
    people,
    navigate,
    setSelectedPatient,
    blocked,
    setBlocked,
    notify,
  } = useDemo();
  const [view, setView] = useState("Week"),
    [offset, setOffset] = useState(0),
    [block, setBlock] = useState(false),
    [date, setDate] = useState("2026-09-15"),
    [start, setStart] = useState("10:00"),
    [end, setEnd] = useState("11:00"),
    [selected, setSelected] = useState<Appointment | null>(null);
  const days = Array.from({ length: view === "Week" ? 5 : 1 }, (_, i) => {
    const d = new Date("2026-09-14T12:00:00");
    d.setDate(d.getDate() + offset + i);
    return d.toISOString().slice(0, 10);
  });
  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="A little structure. Space for care."
      >
        <div className="button-group">
          <Button variant="secondary" onClick={() => setBlock(true)}>
            <Plus size={16} />
            {t("Block time")}
          </Button>
          <Button onClick={() => navigate("Availability")}>
            {t("Modify availability")}
          </Button>
        </div>
      </PageHeader>
      <div className="calendar-toolbar">
        <div className="button-group">
          <button
            className="icon-button"
            aria-label="Previous period"
            onClick={() => setOffset(offset - (view === "Week" ? 7 : 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <h2>
            {formatDate(days[0])}{" "}
            {view === "Week" && `– ${formatDate(days.at(-1)!)}`}
          </h2>
          <button
            className="icon-button"
            aria-label="Next period"
            onClick={() => setOffset(offset + (view === "Week" ? 7 : 1))}
          >
            <ChevronRight size={18} />
          </button>
          <Button variant="ghost" onClick={() => setOffset(0)}>
            {t("Today")}
          </Button>
        </div>
        <Tabs
          items={["Week", "Day"].map(t)}
          value={t(view)}
          onChange={(s) => setView(s === t("Week") ? "Week" : "Day")}
        />
      </div>
      <div className="calendar-scroll">
        <div
          className="calendar-grid"
          style={{
            gridTemplateColumns: `65px repeat(${days.length},minmax(145px,1fr))`,
          }}
        >
          <div className="calendar-corner">GMT+2</div>
          {days.map((d) => (
            <div
              className={`calendar-day ${d === "2026-09-14" ? "today" : ""}`}
              key={d}
            >
              {t(
                new Date(d + "T12:00:00").toLocaleDateString("en", {
                  weekday: "long",
                }),
              )}
              <strong>{Number(d.slice(-2))}</strong>
            </div>
          ))}
          <div className="calendar-times">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i}>{String(i + 8).padStart(2, "0")}:00</span>
            ))}
          </div>
          {days.map((d) => (
            <div className="calendar-column" key={d}>
              {Array.from({ length: 9 }, (_, i) => (
                <div className="hour-line" key={i} />
              ))}
              {appointments
                .filter(
                  (a) =>
                    a.date === d &&
                    a.status === "Upcoming" &&
                    a.psychologist === "Dr. Luljeta Berisha",
                )
                .map((a) => {
                  const [h, m] = a.time.split(":").map(Number);
                  return (
                    <button
                      className="calendar-event"
                      style={{ top: (h - 8) * 96 + m * 1.6, height: 94 }}
                      key={a.id}
                      onClick={() => setSelected(a)}
                    >
                      <strong>
                        {a.time}–{endTime(a.time)} ·{" "}
                        {
                          people
                            .find((p) => p.id === a.patient)
                            ?.name.split(" ")[0]
                        }
                      </strong>
                      <span>
                        {t("Online")} · {t("Session duration: 50 minutes")}
                      </span>
                    </button>
                  );
                })}
              {blocked
                .filter((b) => b.date === d)
                .map((b, i) => (
                  <button
                    className="calendar-block"
                    key={i}
                    style={{
                      top:
                        (Number(b.start.slice(0, 2)) - 8) * 96 +
                        Number(b.start.slice(3)) * 1.6,
                    }}
                    onClick={() => {
                      setBlocked(blocked.filter((x) => x !== b));
                      notify("Time block removed.");
                    }}
                  >
                    {b.start}–{b.end}
                    <br />
                    {t("Unavailable")} · {t("Click to remove")}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <Modal title={t("Session")} onClose={() => setSelected(null)}>
          <div className="record-row">
            <Avatar
              name={people.find((p) => p.id === selected.patient)!.name}
            />
            <div>
              <h3>{people.find((p) => p.id === selected.patient)!.name}</h3>
              <p>
                {formatDate(selected.date)} · {selected.time}–
                {endTime(selected.time)}
              </p>
            </div>
          </div>
          <p>{t(selected.service)}</p>
          <div className="modal-actions">
            <Button
              onClick={() => {
                setSelectedPatient(selected.patient);
                navigate("Patient detail");
              }}
            >
              {t("Open patient record")}
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {block && (
        <Modal title={t("Block time")} onClose={() => setBlock(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isHalfHour(start) || !isHalfHour(end) || start >= end) {
                notify(
                  "Use 30-minute increments and an end time after the start.",
                );
                return;
              }
              if (
                appointments.some(
                  (a) =>
                    a.date === date &&
                    a.status === "Upcoming" &&
                    a.psychologist === "Dr. Luljeta Berisha" &&
                    a.time < end &&
                    endTime(a.time) > start,
                )
              ) {
                notify("This time overlaps an existing appointment.");
                return;
              }
              setBlocked([...blocked, { date, start, end }]);
              setBlock(false);
              notify("Saved successfully.");
            }}
          >
            <label>
              {t("Date")}
              <input
                type="date"
                required
                value={date}
                min="2026-09-14"
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <div className="form-grid spaced">
              <label>
                {t("Start")}
                <input
                  type="time"
                  step={1800}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label>
                {t("End")}
                <input
                  type="time"
                  step={1800}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <Button>{t("Confirm")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
