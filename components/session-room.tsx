"use client";
import { useState, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  PhoneOff,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal } from "./ui";
import { endTime, type Appointment } from "@/lib/data";
export function SessionRoom({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const { t, navigate } = useDemo();
  const [stage, setStage] = useState("waiting"),
    [mic, setMic] = useState(true),
    [camera, setCamera] = useState(true),
    [chat, setChat] = useState(false),
    [draft, setDraft] = useState(""),
    [messages, setMessages] = useState<string[]>([]);
  useEffect(() => {
    if (stage !== "connecting") return;
    const timer = setTimeout(() => setStage("joined"), 1400);
    return () => clearTimeout(timer);
  }, [stage]);
  return (
    <Modal
      title={`Mind Nexus · ${t("Secure session")}`}
      description={t(
        "Simulated room — no video, audio, or messages are transmitted.",
      )}
      onClose={onClose}
      wide
    >
      <div className="session-room">
        <div className="session-top">
          <span>
            <LockKeyhole size={14} />
            {t("Confidential")}
          </span>
          <span>
            {appointment.time}–{endTime(appointment.time)}
          </span>
        </div>
        <div className="video-stage">
          <div className="video-person">
            <Avatar name={appointment.psychologist} size="large" />
            <h2>{appointment.psychologist}</h2>
            <p>
              {t(
                stage === "waiting"
                  ? "Your psychologist’s room is ready."
                  : stage === "connecting"
                    ? "Connecting to your session…"
                    : "You are in the simulated session.",
              )}
            </p>
            {stage === "waiting" && (
              <Button onClick={() => setStage("connecting")}>
                {t("Enter waiting room")}
                <ArrowRight size={16} />
              </Button>
            )}
            {stage === "connecting" && <span className="spinner" />}
          </div>
          <div className="self-preview">
            {camera ? <Avatar name="Arta Krasniqi" /> : <VideoOff size={24} />}
            <span>
              {t("You")} · {t("Preview")}
            </span>
          </div>
        </div>
        {chat && (
          <form
            className="session-chat"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                setMessages([...messages, draft.trim()]);
                setDraft("");
              }
            }}
          >
            {messages.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
            <div className="message-compose">
              <input
                aria-label={t("Write a message…")}
                placeholder={t("Write a message…")}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button disabled={!draft.trim()}>{t("Send message")}</Button>
            </div>
          </form>
        )}
        <div className="session-controls">
          <button
            aria-label={t("Microphone")}
            aria-pressed={mic}
            onClick={() => setMic(!mic)}
          >
            {mic ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            aria-label={t("Camera")}
            aria-pressed={camera}
            onClick={() => setCamera(!camera)}
          >
            {camera ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button
            aria-label={t("Messages")}
            aria-pressed={chat}
            onClick={() => setChat(!chat)}
          >
            <MessageSquare size={20} />
          </button>
          <Button
            variant="danger"
            onClick={() => {
              onClose();
              navigate("Appointments");
            }}
          >
            <PhoneOff size={18} />
            {t("End session")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
