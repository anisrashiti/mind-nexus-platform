"use client";
import { useState, useEffect, useRef } from "react";
import { Send, LockKeyhole, Info, Search, ArrowLeft } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal } from "./ui";
import { PageHeader } from "./patient";
export function Messages() {
  const {
    activePsychologist,
    t,
    role,
    people,
    messages,
    setMessages,
    selectedPatient,
    primaryPsychologist,
    hasCareRelationship,
  } = useDemo();
  const doctors = primaryPsychologist ? [primaryPsychologist] : [];
  const [urgent, setUrgent] = useState(false);
  const [doctor, setDoctor] = useState(doctors[0] ?? "");
  const [patient, setPatient] = useState(
      role === "patient"
        ? "MN-1042"
        : hasCareRelationship(selectedPatient)
          ? selectedPatient
          : (people.find((p) => hasCareRelationship(p.id))?.id ?? ""),
    ),
    [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [mobileConversation, setMobileConversation] = useState(false);
  const carePatients = people.filter((p) => hasCareRelationship(p.id));
  const person = people.find((p) => p.id === patient);
  const clinician = role === "patient" ? doctor : activePsychologist;
  const name = role === "patient" ? doctor : (person?.name ?? "");
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
    if (!draft.trim() || !hasCareRelationship(patient, clinician)) return;
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
  if (!person || !hasCareRelationship(patient, clinician))
    return (
      <p className="empty-state">{t("No care relationship available.")}</p>
    );
  return (
    <>
      {urgent && (
        <Modal title={t("Need urgent help?")} onClose={() => setUrgent(false)}>
          <p>
            {t(
              "Mind Nexus messaging is not an emergency service. In an emergency, contact local emergency services or seek immediate in-person help.",
            )}
          </p>
          <p className="spaced">
            {t(
              "Local support contacts will be confirmed before launch. This prototype does not provide an emergency response.",
            )}
          </p>
        </Modal>
      )}
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
          </header>
          <div className="async-notice">
            <p>{t("For non-urgent communication between sessions.")}</p>
            <small>{t("Your psychologist may not respond immediately.")}</small>
            <button className="text-button" onClick={() => setUrgent(true)}>
              {t("Need urgent help?")}
            </button>
          </div>
          <div ref={history} className="message-history">
            <div className="conversation-date">10–14 September 2026</div>
            {list.map((m) => (
              <div
                className={`message ${m.from === role ? "outgoing" : "incoming"}`}
                key={m.id}
              >
                <div>{t(m.text)}</div>
                <small>{m.time}</small>
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
