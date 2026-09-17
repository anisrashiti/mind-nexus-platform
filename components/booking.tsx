"use client";
import { PrivateContinuation } from "./care";
import { availableSlots, allowance } from "@/lib/scheduling";
import { useState } from "react";
import { CalendarDays, Check, Clock3, Video, ArrowRight } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal, Privacy } from "./ui";
import { formatDate, endTime, type Appointment } from "@/lib/data";
export function Booking({
  onClose,
  appointment,
}: {
  onClose: () => void;
  appointment?: Appointment;
}) {
  const {
    t,
    lang,
    appointments,
    primaryPsychologist,
    scheduleFor,
    reserveAppointment,
    navigate,
    log,
  } = useDemo();
  const psychologist = appointment?.psychologist ?? primaryPsychologist;
  const [continuation, setContinuation] = useState(false);
  const [day, setDay] = useState(appointment?.date ?? "2026-09-15"),
    [time, setTime] = useState(""),
    [success, setSuccess] = useState(false),
    [error, setError] = useState("");
  const available = allowance(appointments, "MN-1042").remaining;
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date("2026-09-14T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  function slots(date: string, name = psychologist) {
    return name
      ? availableSlots(
          date,
          name,
          "MN-1042",
          scheduleFor(name),
          appointments,
          appointment?.id,
        )
      : [];
  }
  function book() {
    const issue = reserveAppointment(psychologist, day, time, appointment);
    if (issue) {
      setError(issue);
      return;
    }
    log(
      "Arta K.",
      appointment ? "Rescheduled appointment" : "Booked appointment",
      appointment?.id ?? "New appointment",
    );
    setSuccess(true);
  }
  return (
    <Modal
      title={
        t(
          success
            ? appointment
              ? "Your session has been rescheduled."
              : "Your session is booked."
            : appointment
              ? "Reschedule"
              : "Book with",
        ) + (!success && !appointment ? ` ${psychologist}` : "")
      }
      onClose={onClose}
      wide
    >
      {continuation && (
        <PrivateContinuation onClose={() => setContinuation(false)} />
      )}
      <p className="section-subtitle">
        {t("1-hour reserved slot")} · {t("Session duration: 50 minutes")}
        <br />
        {t("10-minute buffer")}
      </p>
      {success ? (
        <div className="success-state">
          <span className="success-icon">
            <Check size={32} />
          </span>
          <h2>{t("Your consultation will last approximately 50 minutes.")}</h2>
          <p>
            {formatDate(day, lang)} · {time}–{endTime(time)}
          </p>
          <p>
            {psychologist} · {t("Online")}
          </p>
          <Button
            onClick={() => {
              onClose();
              navigate("Sessions");
            }}
          >
            {t("View appointments")}
            <ArrowRight size={17} />
          </Button>
        </div>
      ) : (
        <>
          {psychologist && (
            <div className="booking-doctor">
              <Avatar name={psychologist} size="large" />
              <div>
                <h3>{psychologist}</h3>
                <p>
                  {t("Clinical Psychologist")} · {t("Albanian / English")}
                </p>
              </div>
              <span>
                <Video size={16} />
                {t("Online")}
              </span>
            </div>
          )}
          {!appointment && available === 0 ? (
            <div className="empty-state">
              <h3>
                {t(
                  "Your employer-covered consultations are complete or reserved.",
                )}
              </h3>
              <p>
                {t(
                  "You can continue with your psychologist privately if you would like further support.",
                )}
              </p>
              <Button
                onClick={() => {
                  setContinuation(true);
                }}
              >
                {t("Continue privately")}
              </Button>
            </div>
          ) : (
            <>
              {psychologist && (
                <>
                  <h3 className="form-section-title">
                    {t("Choose a day")}{" "}
                    <small>{t("September 2026")} · Europe/Prishtina</small>
                  </h3>
                  <div className="date-selector">
                    {dates.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDay(d);
                          setTime("");
                        }}
                        aria-pressed={day === d}
                      >
                        <span>
                          {new Date(d + "T12:00:00").toLocaleDateString(
                            lang === "sq" ? "sq-AL" : "en",
                            { weekday: "short" },
                          )}
                        </span>
                        <strong>{Number(d.slice(-2))}</strong>
                      </button>
                    ))}
                  </div>
                  <h3 className="form-section-title">{t("Available times")}</h3>
                  <div className="slot-grid">
                    {slots(day).map((s) => (
                      <button
                        key={s}
                        aria-pressed={time === s}
                        onClick={() => setTime(s)}
                      >
                        {s}–{endTime(s)}
                      </button>
                    ))}
                  </div>
                  {slots(day).length === 0 && (
                    <p className="empty-state">
                      {t("No available times. Please choose another day.")}
                    </p>
                  )}
                  {time && (
                    <div className="booking-summary">
                      <CalendarDays size={18} />
                      {formatDate(day, lang)}
                      <Clock3 size={18} />
                      {time}–{endTime(time)}
                    </div>
                  )}
                </>
              )}
              <Privacy>
                {t("Visible only to you and your psychologist")}
              </Privacy>
              {error && (
                <p role="alert" className="error">
                  {t(error)}
                </p>
              )}
              <div className="modal-actions">
                <Button variant="secondary" onClick={onClose}>
                  {t("Cancel")}
                </Button>
                <Button disabled={!psychologist || !time} onClick={book}>
                  {t("Confirm appointment")}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
