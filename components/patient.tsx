"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  MessageSquare,
  Heart,
  Video,
  Clock3,
  BookOpen,
  Check,
  Plus,
  Leaf,
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
import { Booking } from "./booking";
import { SessionRoom } from "./session-room";
import { TrendChart } from "./charts";
import { formatDate, endTime, resources, type Appointment } from "@/lib/data";
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
  const { t, appointments, navigate } = useDemo();
  const [booking, setBooking] = useState(false),
    [session, setSession] = useState<Appointment | null>(null);
  const upcoming = appointments
    .filter((x) => x.patient === "MN-1042" && x.status === "Upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];
  const used = appointments.filter(
    (x) => x.patient === "MN-1042" && x.status === "Completed",
  ).length;
  return (
    <>
      <PageHeader
        title="Good afternoon, Arta."
        subtitle="A little space for you, in the middle of everything."
      />
      <div className="patient-top">
        <section className="next-session">
          <div className="next-session-heading">
            <span className="eyebrow">{t("Your next session")}</span>
            <Badge>{t("Online")}</Badge>
          </div>
          {next ? (
            <>
              <div className="next-session-time">
                <h2>
                  {next.date === "2026-09-14"
                    ? t("Today")
                    : formatDate(next.date)}
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
                  {t(next.service)}
                  <small>
                    {t("15 minutes")} · {t("Confidential")}
                  </small>
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
              <Button onClick={() => setBooking(true)}>
                {t("Book a session")}
              </Button>
            </div>
          )}
        </section>
        <section className="program-allowance">
          <span className="eyebrow">{t("Your program")}</span>
          <h2>{t("A space to come back to.")}</h2>
          <div className="allowance-count">
            <strong>
              {used}
              <span> / 5</span>
            </strong>
            <span>
              {t("Personal sessions")}
              <small>{t("Used")}</small>
            </span>
          </div>
          <div className="allowance-dots">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={
                  i < used
                    ? "used"
                    : i < used + upcoming.length
                      ? "reserved"
                      : ""
                }
              />
            ))}
          </div>
          <div className="allowance-labels">
            <span>
              {5 - used} {t("remaining")}
            </span>
            <span>
              {upcoming.length} {t("Reserved")}
            </span>
          </div>
          <p>
            {t("Provided by Aurora Hospital.")}
            <br />
            {t("No payment needed from you.")}
          </p>
        </section>
      </div>
      <div className="quick-actions">
        <button onClick={() => setBooking(true)}>
          <span className="quick-icon">
            <CalendarDays size={22} />
          </span>
          <span>
            <strong>{t("Book a session")}</strong>
            <small>{t("Make time for yourself")}</small>
          </span>
          <ArrowUpRight size={18} />
        </button>
        <button onClick={() => navigate("Messages")}>
          <span className="quick-icon">
            <MessageSquare size={22} />
          </span>
          <span>
            <strong>{t("Message psychologist")}</strong>
            <small>{t("Continue the conversation")}</small>
          </span>
          <ArrowUpRight size={18} />
        </button>
        <button onClick={() => navigate("Well-being")}>
          <span className="quick-icon">
            <Heart size={22} />
          </span>
          <span>
            <strong>{t("Complete check-in")}</strong>
            <small>{t("Pause and reflect")}</small>
          </span>
          <ArrowUpRight size={18} />
        </button>
      </div>
      <div className="patient-lower">
        <section>
          <SectionTitle
            title={t("Upcoming appointments")}
            action={t("View all")}
            onAction={() => navigate("Appointments")}
          />
          {upcoming.slice(0, 2).map((a) => (
            <button
              className="simple-session"
              onClick={() => navigate("Appointments")}
              key={a.id}
            >
              <div className="date-tile">
                <span>SEP</span>
                <strong>{Number(a.date.slice(-2))}</strong>
              </div>
              <div>
                <h3>{t(a.service)}</h3>
                <p>
                  {a.time}–{endTime(a.time)} · {t("Online")}
                </p>
              </div>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </section>
        <section className="resource-feature">
          <span className="eyebrow">{t("A moment for your mind")}</span>
          <Leaf size={30} strokeWidth={1} />
          <h2>{t("Small steps. Meaningful change.")}</h2>
          <p>{t("Practical perspectives for your working day and beyond.")}</p>
          <button className="text-button" onClick={() => navigate("Resources")}>
            {t("Explore resources")}
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <Privacy>
        {t(
          "Your consultations and personal information are confidential and are not shared with your employer.",
        )}
      </Privacy>
      {booking && <Booking onClose={() => setBooking(false)} />}{" "}
      {session && (
        <SessionRoom appointment={session} onClose={() => setSession(null)} />
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
        title="Appointments"
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
  "I have felt calm and relaxed.",
  "I have had energy for daily activities.",
  "I have felt rested when waking up.",
  "I have felt connected to people around me.",
  "I have been able to make time for myself.",
];
export function Wellbeing() {
  const { t, checkin, setCheckin } = useDemo();
  const [answers, setAnswers] = useState(checkin ?? [3, 3, 3, 3, 3]),
    [editing, setEditing] = useState(!checkin);
  return (
    <>
      <PageHeader
        title="Well-being"
        subtitle="A small pause. A better understanding of yourself."
      />
      <div className="wellbeing-grid">
        <section className="surface checkin-form">
          {editing ? (
            <>
              <span className="eyebrow">{t("Weekly reflection")} · 2 MIN</span>
              <h2>{t("How have you been feeling this week?")}</h2>
              <p>{t("A moment to reflect. This is not a diagnostic tool.")}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCheckin(answers);
                  setEditing(false);
                }}
              >
                {questions.map((q, i) => (
                  <div className="question" key={q}>
                    <label htmlFor={`q-${i}`}>
                      <span>0{i + 1}</span>
                      {t(q)}
                      <strong>{answers[i]}/5</strong>
                    </label>
                    <input
                      id={`q-${i}`}
                      type="range"
                      min="1"
                      max="5"
                      value={answers[i]}
                      onChange={(e) =>
                        setAnswers(
                          answers.map((v, j) =>
                            j === i ? Number(e.target.value) : v,
                          ),
                        )
                      }
                    />
                    <div>
                      <span>{t("Never")}</span>
                      <span>{t("Always")}</span>
                    </div>
                  </div>
                ))}
                <Button className="full">
                  {t("Submit check-in")}
                  <ArrowRight size={16} />
                </Button>
              </form>
            </>
          ) : (
            <div className="success-state">
              <span className="success-icon">
                <Check size={28} />
              </span>
              <h2>{t("Check-in completed.")}</h2>
              <p>{t("Thank you for making a little space for yourself.")}</p>
              <Badge>
                {Math.round((checkin!.reduce((a, b) => a + b, 0) / 25) * 100)} /
                100
              </Badge>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                {t("View responses")}
              </Button>
            </div>
          )}
        </section>
        <section className="wellbeing-history">
          <SectionTitle title={t("Well-being trend")} />
          <p>{t("Your weekly reflections over time.")}</p>
          <TrendChart />
          <div className="insight">
            <Heart size={20} />
            <div>
              <h3>{t("Every week is different.")}</h3>
              <p>
                {t(
                  "There is no right score. Your check-in is a starting point for a conversation.",
                )}
              </p>
            </div>
          </div>
          <Privacy>{t("Visible only to you and your psychologist")}</Privacy>
        </section>
      </div>
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
            <p>{article.body}</p>
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
