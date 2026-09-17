"use client";
import { PsychologistCard, PrivateContinuation } from "./care";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Video,
  Clock3,
  BookOpen,
  Check,
  Plus,
} from "lucide-react";
import { useDemo } from "./demo-context";
import {
  Avatar,
  Badge,
  Button,
  Modal,
  Privacy,
  SectionTitle,
  Tabs,
} from "./ui";
import { allowance } from "@/lib/scheduling";
import { Booking } from "./booking";
import { SessionRoom } from "./session-room";

import {
  SESSION_LIMIT,
  formatDate,
  endTime,
  resources,
  type Appointment,
} from "@/lib/data";
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const { t } = useDemo();
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{t("Monday, 14 September 2026")}</span>
        <h1>{t(title)}</h1>
        {subtitle && <p>{t(subtitle)}</p>}
      </div>
      {children}
    </div>
  );
}
export function AppointmentRow({
  a,
  onJoin,
  onReschedule,
  onCancel,
}: {
  a: Appointment;
  onJoin: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const { t, lang } = useDemo();
  return (
    <div className="appointment-row">
      <div className="date-tile">
        <span>
          {new Date(a.date + "T12:00:00").toLocaleDateString(
            lang === "sq" ? "sq-AL" : "en",
            { month: "short" },
          )}
        </span>
        <strong>{Number(a.date.slice(-2))}</strong>
      </div>
      <div className="appointment-info">
        <h3>{t(a.service)}</h3>
        <p>{a.psychologist}</p>
        <small>
          <Clock3 size={13} />
          {a.time}–{endTime(a.time)}
          <span>·</span>
          <Video size={13} />
          {t("Online")}
        </small>
        <small>
          {t("1-hour reserved slot")} · {t("Session duration: 50 minutes")}
        </small>
      </div>
      <div className="appointment-actions">
        {a.status === "Upcoming" ? (
          <>
            <Button variant="secondary" onClick={onReschedule}>
              {t("Reschedule")}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {t("Cancel")}
            </Button>
            {a.date === "2026-09-14" && (
              <Button onClick={onJoin}>
                <Video size={16} />
                {t("Join")}
              </Button>
            )}
          </>
        ) : (
          <Badge tone={a.status === "Completed" ? "green" : "neutral"}>
            {t(a.status)}
          </Badge>
        )}
      </div>
    </div>
  );
}
export function PatientHome() {
  const { t, lang, appointments, navigate, primaryPsychologist } = useDemo();
  const [booking, setBooking] = useState<boolean | Appointment>(false),
    [session, setSession] = useState<Appointment | null>(null),
    [continuation, setContinuation] = useState(false);
  const next = appointments
    .filter((a) => a.patient === "MN-1042" && a.status === "Upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const { used, reserved, remaining } = allowance(appointments, "MN-1042");
  return (
    <>
      <PageHeader
        title="Good afternoon, Arta."
        subtitle="A private space for support, whenever you need it."
      />
      <div className="employee-home-grid">
        <section className="next-session">
          <div className="next-session-heading">
            <span className="eyebrow">{t("Your next session")}</span>
            <span>{t("Online")}</span>
          </div>
          {next ? (
            <>
              <div className="next-session-time">
                <h2>
                  {next.date === "2026-09-14"
                    ? t("Today")
                    : formatDate(next.date, lang)}
                </h2>
                <span>
                  {next.time}
                  <i>—</i>
                  {endTime(next.time)}
                </span>
              </div>
              <div className="next-session-doctor">
                <Avatar name={next.psychologist} size="large" />
                <div>
                  <h3>{next.psychologist}</h3>
                  <p>{t("Clinical Psychologist")}</p>
                </div>
              </div>
              <div className="next-session-footer">
                <span>
                  {t("Approximately 50-minute consultation")}
                  <button
                    className="text-button"
                    onClick={() => setBooking(next)}
                  >
                    {t("Reschedule")}
                  </button>
                </span>
                <Button onClick={() => setSession(next)}>
                  <Video size={17} />
                  {t("Join session")}
                </Button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>{t("Your support, at your pace.")}</h2>
              <p>{t("Make time for a conversation with your psychologist.")}</p>
              <Button
                onClick={() =>
                  remaining ? setBooking(true) : setContinuation(true)
                }
              >
                {t(remaining ? "Book a session" : "Continue privately")}
              </Button>
            </div>
          )}
        </section>
        <aside className="support-allowance">
          <span className="eyebrow">{t("Your Mind Nexus support")}</span>
          <div className="support-count">
            <strong>{remaining}</strong>
            <h2>
              {t(
                remaining === 1
                  ? "consultation available"
                  : "consultations available",
              )}
            </h2>
          </div>
          <div className="entitlement-steps">
            {Array.from({ length: SESSION_LIMIT }, (_, i) => (
              <div
                key={i}
                className={
                  i < used
                    ? "completed"
                    : i < used + reserved
                      ? "reserved"
                      : "available"
                }
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <small>
                  {t(
                    i < used
                      ? "Completed / used"
                      : i < used + reserved
                        ? "Reserved"
                        : "Available",
                  )}
                </small>
              </div>
            ))}
          </div>
          <p>{t("Provided by Aurora Hospital · No payment required")}</p>
          {remaining === 0 && (
            <button
              className="text-button"
              onClick={() => setContinuation(true)}
            >
              {t("Continue privately")}
              <ArrowUpRight size={16} />
            </button>
          )}
        </aside>
      </div>
      <div className="employee-secondary">
        <section>
          <SectionTitle
            title={t("Your psychologist")}
            action={t("Message")}
            onAction={() => navigate("Messages")}
          />
          <PsychologistCard name={primaryPsychologist} compact />
        </section>
        <section className="employee-editorial">
          <span className="eyebrow">{t("From Mind Nexus")}</span>
          <h2>{t("Understanding workplace stress")}</h2>
          <p>
            {t(
              "Notice what the working day asks of you, and what helps you feel more settled.",
            )}
          </p>
          <button className="text-button" onClick={() => navigate("Resources")}>
            {t("Read resource")}
            <ArrowRight size={16} />
          </button>
          <div className="reflection-invite">
            <h3>{t("A short reflection before your next session")}</h3>
            <p>{t("Optional · visible to you and your psychologist")}</p>
            <button
              className="text-button"
              onClick={() => navigate("Reflection")}
            >
              {t("Take a moment to reflect")}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
      <div className="employee-bottom">
        <p>
          {t("Your employer does not see your individual use of the service.")}
        </p>
        {next && remaining > 0 && (
          <button className="text-button" onClick={() => setBooking(true)}>
            {t("Book another session")}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
      {booking && (
        <Booking
          appointment={typeof booking === "object" ? booking : undefined}
          onClose={() => setBooking(false)}
        />
      )}{" "}
      {session && (
        <SessionRoom appointment={session} onClose={() => setSession(null)} />
      )}{" "}
      {continuation && (
        <PrivateContinuation onClose={() => setContinuation(false)} />
      )}
    </>
  );
}
export function PatientAppointments() {
  const { t, appointments, updateAppointment, notify, log } = useDemo();
  const [tab, setTab] = useState("Upcoming"),
    [booking, setBooking] = useState<boolean | Appointment>(false),
    [cancel, setCancel] = useState<Appointment | null>(null),
    [session, setSession] = useState<Appointment | null>(null);
  const list = appointments
    .filter(
      (a) =>
        a.patient === "MN-1042" &&
        a.status === (tab === "Past" ? "Completed" : tab),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <PageHeader
        title="Sessions"
        subtitle="Your time, thoughtfully set aside."
      >
        <Button onClick={() => setBooking(true)}>
          <Plus size={17} />
          {t("Book a session")}
        </Button>
      </PageHeader>
      <Tabs
        items={["Upcoming", "Past", "Cancelled"].map(t)}
        value={t(tab)}
        onChange={(s) =>
          setTab(["Upcoming", "Past", "Cancelled"].find((x) => t(x) === s)!)
        }
      />
      <div className="surface appointment-list">
        {list.map((a) => (
          <AppointmentRow
            key={a.id}
            a={a}
            onJoin={() => setSession(a)}
            onReschedule={() => setBooking(a)}
            onCancel={() => setCancel(a)}
          />
        ))}
        {!list.length && (
          <div className="empty-state">
            <CalendarDays size={28} />
            <h3>{t("No appointments here.")}</h3>
            <Button variant="secondary" onClick={() => setBooking(true)}>
              {t("Book a session")}
            </Button>
          </div>
        )}
      </div>
      <Privacy>{t("Visible only to you and your psychologist")}</Privacy>
      {booking && (
        <Booking
          appointment={typeof booking === "object" ? booking : undefined}
          onClose={() => setBooking(false)}
        />
      )}{" "}
      {cancel && (
        <Modal
          title={t("Cancel appointment?")}
          description={t(
            "This slot will be released and your session allowance will be restored.",
          )}
          onClose={() => setCancel(null)}
        >
          <div className="booking-summary">
            {formatDate(cancel.date)} · {cancel.time} · {cancel.psychologist}
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setCancel(null)}>
              {t("Keep appointment")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                updateAppointment(cancel.id, { status: "Cancelled" });
                log("Arta K.", "Cancelled appointment", cancel.id);
                setCancel(null);
                notify("Appointment cancelled.");
              }}
            >
              {t("Cancel appointment")}
            </Button>
          </div>
        </Modal>
      )}
      {session && (
        <SessionRoom appointment={session} onClose={() => setSession(null)} />
      )}
    </>
  );
}
export const questions = [
  "What has felt demanding recently?",
  "What has helped you feel more settled?",
  "How have work and rest fitted together?",
  "Is there something you would like to discuss?",
  "What would you like to make room for this week?",
];
export function Wellbeing() {
  const { t, reflections, setReflections, primaryPsychologist } = useDemo();
  const saved = reflections.find(
    (r) => r.patient === "MN-1042" && r.psychologist === primaryPsychologist,
  );
  const [answers, setAnswers] = useState(
      saved?.answers ?? ["", "", "", "", ""],
    ),
    [editing, setEditing] = useState(!saved);
  return (
    <>
      <PageHeader
        title="Reflection"
        subtitle="A short reflection before your next session"
      />
      <section className="reflection-form surface">
        <span className="eyebrow">
          {t("Optional · visible to you and your psychologist")}
        </span>
        <h2>{t("A little space to put things into words.")}</h2>
        <p>
          {t(
            "These prompts are not a diagnosis or a score. Share only what you want your psychologist to read.",
          )}
        </p>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setReflections((r) => [
                ...r.filter(
                  (x) =>
                    !(
                      x.patient === "MN-1042" &&
                      x.psychologist === primaryPsychologist
                    ),
                ),
                {
                  patient: "MN-1042",
                  psychologist: primaryPsychologist,
                  answers,
                },
              ]);
              setEditing(false);
            }}
          >
            {questions.map((q, i) => (
              <label key={q}>
                <span>{t(q)}</span>
                <textarea
                  maxLength={2000}
                  rows={2}
                  value={answers[i]}
                  onChange={(e) =>
                    setAnswers((a) =>
                      a.map((v, j) => (i === j ? e.target.value : v)),
                    )
                  }
                />
              </label>
            ))}
            <Button disabled={!answers.some((a) => a.trim())}>
              {t("Share reflection with my psychologist")}
            </Button>
          </form>
        ) : (
          <div className="success-state">
            <Check size={28} />
            <h2>{t("Your reflection has been saved.")}</h2>
            <p>
              {t(
                "Visible to you and your psychologist. Your employer cannot see your responses.",
              )}
            </p>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t("View responses")}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
export function Resources() {
  const { t, lang } = useDemo();
  const [article, setArticle] = useState<(typeof resources)[number] | null>(
      null,
    ),
    [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        title="Resources"
        subtitle="Thoughtful guidance, at your own pace."
      />
      <div className="resources-intro">
        <BookOpen size={30} strokeWidth={1.2} />
        <div>
          <h2>{t("A little understanding goes a long way.")}</h2>
          <p>{t("From the Mind Nexus resource library · Preview content")}</p>
        </div>
      </div>
      <input
        className="search-field"
        placeholder={t("Search resources")}
        aria-label={t("Search resources")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="resource-list">
        {resources
          .filter((r) =>
            (lang === "sq" ? r.sq : r.title)
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map((r, i) => (
            <button onClick={() => setArticle(r)} key={r.title}>
              <span className="resource-number">0{i + 1}</span>
              <div>
                <span className="eyebrow">{t(r.category)}</span>
                <h2>{lang === "sq" ? r.sq : r.title}</h2>
                <p>
                  {t(
                    "A short perspective to bring into your next conversation.",
                  )}
                </p>
              </div>
              <span>
                {r.minutes} min {t("read")}
              </span>
              <ArrowUpRight size={22} />
            </button>
          ))}
      </div>
      {article && (
        <Modal
          title={lang === "sq" ? article.sq : article.title}
          onClose={() => setArticle(null)}
          wide
        >
          <article className="article-content">
            <span className="eyebrow">MIND NEXUS · {article.minutes} MIN</span>
            <p>{t(article.body)}</p>
            <div className="article-reflection">
              <h2>{t("A question to take with you")}</h2>
              <p>
                {t(
                  "What would make your next working week feel a little more manageable?",
                )}
              </p>
            </div>
            <small>
              {t(
                "Illustrative educational content for the client demo. Not a diagnostic tool.",
              )}
            </small>
          </article>
        </Modal>
      )}
    </>
  );
}
