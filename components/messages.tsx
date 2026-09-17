"use client";
import { useState, useEffect, useRef } from "react";
import { Send, LockKeyhole, Info, Search, ArrowLeft } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Badge } from "./ui";
import { PageHeader } from "./patient";
export function Messages() {
  const {
    t,
    role,
    people,
    messages,
    setMessages,
    selectedPatient,
    appointments,
    hasCareRelationship,
  } = useDemo();
  const doctors = Array.from(
    new Set(
      appointments
        .filter((a) => a.patient === "MN-1042" && a.status !== "Cancelled")
        .map((a) => a.psychologist),
    ),
  );
  const [doctor, setDoctor] = useState(doctors[0] ?? "");
  const [patient, setPatient] = useState(
      role === "patient" ? "MN-1042" : selectedPatient,
    ),
    [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [mobileConversation, setMobileConversation] = useState(false);
  const carePatients = people.filter((p) => hasCareRelationship(p.id));
  const person = people.find((p) => p.id === patient)!;
  const clinician = role === "patient" ? doctor : "Dr. Luljeta Berisha";
  const name = role === "patient" ? doctor : person.name;
  const list = messages.filter(
    (m) =>
      m.patient === patient &&
      (m.psychologist ?? "Dr. Luljeta Berisha") === clinician,
  );
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    history.current?.scrollTo({
      top: history.current.scrollHeight,
      behavior: "instant",
    });
  }, [patient, list.length]);
  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((m) => [
      ...m,
      {
        id: `m${Date.now()}`,
        patient,
        psychologist: clinician,
        from: role === "patient" ? "patient" : "psychologist",
        text: draft.trim(),
        time:
          "Today · " +
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
    ]);
    setDraft("");
  }
  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="A private space to stay connected."
      />
      <div className="message-notice">
        <Info size={17} />
        {t(
          "Messages are intended for non-urgent communication and are not monitored continuously.",
        )}
      </div>
      <div
        className={`messaging surface ${mobileConversation ? "show-conversation" : ""}`}
      >
        <aside className="conversation-list">
          <div className="conversation-search">
            <Search size={16} />
            <input
              placeholder={t("Search")}
              aria-label={t("Search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(role === "patient"
            ? doctors.map((name) => ({ ...people[0], psychologist: name }))
            : carePatients
          )
            .filter((p) =>
              (role === "patient" ? p.psychologist : p.name)
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((p) => (
              <button
                className={
                  p.id === patient &&
                  (role !== "patient" || p.psychologist === doctor)
                    ? "active"
                    : ""
                }
                key={role === "patient" ? p.psychologist : p.id}
                onClick={() => {
                  setPatient(p.id);
                  if (role === "patient") setDoctor(p.psychologist);
                  setMobileConversation(true);
                }}
              >
                <Avatar name={role === "patient" ? p.psychologist : p.name} />
                <span>
                  <strong>
                    {role === "patient" ? p.psychologist : p.name}
                  </strong>
                  <small>
                    {messages
                      .filter(
                        (m) =>
                          m.patient === p.id &&
                          (m.psychologist ?? "Dr. Luljeta Berisha") ===
                            (role === "patient" ? p.psychologist : clinician),
                      )
                      .at(-1)?.text ?? t("Start a conversation")}
                  </small>
                </span>
                {p.id !== "MN-1045" && <i />}
              </button>
            ))}
          <div className="conversation-privacy">
            <LockKeyhole size={15} />
            {t(
              role === "patient"
                ? "Visible only to you and your psychologist"
                : "Patients who chose you",
            )}
          </div>
        </aside>
        <section className="conversation">
          <header>
            <button
              className="icon-button mobile-only"
              aria-label={t("Back")}
              onClick={() => setMobileConversation(false)}
            >
              <ArrowLeft size={18} />
            </button>
            <Avatar name={name} />
            <div>
              <h3>{name}</h3>
              <p>
                {role === "patient" ? t("Clinical Psychologist") : person.id}
              </p>
            </div>
            <Badge tone="neutral">
              <LockKeyhole size={12} />
              {t("Confidential")}
            </Badge>
          </header>
          <div ref={history} className="message-history">
            <div className="conversation-date">10–14 September 2026</div>
            {list.map((m) => (
              <div
                className={`message ${m.from === role ? "outgoing" : "incoming"}`}
                key={m.id}
              >
                <div>{m.text}</div>
                <small>
                  {m.time}
                  {m.from === role ? " · ✓✓" : ""}
                </small>
              </div>
            ))}
            {!list.length && (
              <div className="empty-state">{t("Start a conversation")}</div>
            )}
          </div>
          <form className="message-compose" onSubmit={send}>
            <input
              value={draft}
              maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("Write a message…")}
              aria-label={t("Write a message…")}
            />
            <Button disabled={!draft.trim()} aria-label={t("Send message")}>
              <Send size={18} />
            </Button>
          </form>
          <small className="message-footnote">
            {t("Demo messages stay in this browser session.")}
          </small>
        </section>
      </div>
    </>
  );
}
