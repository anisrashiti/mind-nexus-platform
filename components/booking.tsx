"use client";
import { useState } from "react";
import { CalendarDays, Check, Clock3, Video, ArrowRight } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal, Privacy } from "./ui";
import {
  formatDate,
  endTime,
  psychologists,
  serviceNames,
  type Appointment,
} from "@/lib/data";
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
    setAppointments,
    updateAppointment,
    hours,
    timeOff,
    blocked,
    navigate,
    log,
  } = useDemo();
  const [day, setDay] = useState("2026-09-15"),
    [time, setTime] = useState(""),
    [success, setSuccess] = useState(false),
    [error, setError] = useState("");
  const upcoming = appointments.filter(
      (x) => x.patient === "MN-1042" && x.status === "Upcoming",
    ).length,
    completed = appointments.filter(
      (x) => x.patient === "MN-1042" && x.status === "Completed",
    ).length;
  // Two future reservations are allowed within the five-session allocation.
  const available = Math.max(0, 5 - completed - upcoming);
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date("2026-09-14T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  function slots(date: string) {
    const d = new Date(date + "T12:00:00");
    const h = hours[(d.getDay() + 6) % 7];
    if (!h.active || timeOff.some((x) => date >= x.start && date <= x.end))
      return [];
    const result: string[] = [];
    for (let m = 9 * 60; m < 18 * 60; m += 15) {
      const s = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const end = endTime(s);
      if (
        s < h.start ||
        end > h.end ||
        (s < h.breakEnd && end > h.breakStart) ||
        (date === "2026-09-14" && s < "14:00")
      )
        continue;
      if (
        appointments.some(
          (a) =>
            a.id !== appointment?.id &&
            a.date === date &&
            a.time === s &&
            a.status === "Upcoming" &&
            a.psychologist === psychologists[0],
        )
      )
        continue;
      if (blocked.some((b) => b.date === date && s < b.end && end > b.start))
        continue;
      result.push(s);
    }
    return result;
  }
  function book() {
    if (!time || !slots(day).includes(time)) {
      setError("That time is no longer available. Please select another.");
      return;
    }
    if (!appointment && available === 0) {
      setError(
        "All remaining sessions are reserved. Reschedule or cancel an existing appointment to change your plans.",
      );
      return;
    }
    if (appointment) {
      updateAppointment(appointment.id, { date: day, time });
    } else {
      setAppointments((a) => [
        ...a,
        {
          id: `APT-${Date.now()}`,
          patient: "MN-1042",
          psychologist: psychologists[0],
          date: day,
          time,
          service: serviceNames[0],
          status: "Upcoming",
        },
      ]);
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
      title={t(
        success
          ? appointment
            ? "Your session has been rescheduled."
            : "Your session has been booked."
          : appointment
            ? "Reschedule"
            : "Book a session",
      )}
      onClose={onClose}
      wide
    >
      {success ? (
        <div className="success-state">
          <span className="success-icon">
            <Check size={32} />
          </span>
          <h2>{t("A little time, just for you.")}</h2>
          <p>
            {formatDate(day, lang)} · {time}–{endTime(time)}
          </p>
          <p>
            {psychologists[0]} · {t("Online")}
          </p>
          <Button
            onClick={() => {
              onClose();
              navigate("Appointments");
            }}
          >
            {t("View appointments")}
            <ArrowRight size={17} />
          </Button>
        </div>
      ) : (
        <>
          <div className="booking-doctor">
            <Avatar name={psychologists[0]} size="large" />
            <div>
              <h3>{psychologists[0]}</h3>
              <p>
                {t("Clinical Psychologist")} · {t("Albanian / English")}
              </p>
            </div>
            <span>
              <Video size={16} />
              {t("15 minutes")}
            </span>
          </div>
          {!appointment && available === 0 ? (
            <div className="empty-state">
              <h3>{t("Your remaining sessions are reserved.")}</h3>
              <p>
                {t(
                  "Reschedule an existing appointment, or cancel one to free a session.",
                )}
              </p>
              <Button
                onClick={() => {
                  navigate("Appointments");
                  onClose();
                }}
              >
                {t("View appointments")}
              </Button>
            </div>
          ) : (
            <>
              <h3 className="form-section-title">
                {t("Choose a day")}{" "}
                <small>September 2026 · Europe/Tirane</small>
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
                    {s}
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
                <Button disabled={!time} onClick={book}>
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
