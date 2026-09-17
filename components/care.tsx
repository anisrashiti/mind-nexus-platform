"use client";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal } from "./ui";
import Logo from "./logo";
import { availableSlots } from "@/lib/scheduling";
import { formatDate } from "@/lib/data";

export const privacyStatements = [
  "Your employer can confirm your eligibility for the program.",
  "Your employer cannot see whether you book or attend a consultation.",
  "Your employer cannot see your psychologist, messages, consultation content or clinical notes.",
  "Mind Nexus provides only agreed aggregate program reports to your employer.",
];
export function PrivacyExplanation() {
  const { t } = useDemo();
  return (
    <div className="privacy-explanation">
      {privacyStatements.map((text, i) => (
        <div key={text}>
          <span>0{i + 1}</span>
          <p>{t(text)}</p>
        </div>
      ))}
    </div>
  );
}
export function PsychologistCard({
  name,
  choose,
  compact = false,
}: {
  name: string;
  choose?: () => void;
  compact?: boolean;
}) {
  const { t, roster, profiles, scheduleFor, appointments, lang } = useDemo();
  const [view, setView] = useState(false);
  const person = roster.find((r) => r.name === name);
  if (!person) return null;
  const saved =
    profiles[name] ??
    (name === roster[0].name ? profiles.psychologist : undefined);
  const bio =
    saved?.bio ||
    "A thoughtful space to explore work pressures, personal boundaries and the changes that matter to you.";
  const focus = saved?.specialty || person.specialty;
  let next = "";
  for (let i = 0; i < 14; i++) {
    const date = `2026-09-${String(14 + i).padStart(2, "0")}`;
    const slot = availableSlots(
      date,
      name,
      "MN-1042",
      scheduleFor(name),
      appointments,
    )[0];
    if (slot) {
      next = `${formatDate(date, lang)} · ${slot}`;
      break;
    }
  }
  const details = (
    <>
      <p className="doctor-focus">{t(focus)}</p>
      <p>{t(person.languages)}</p>
      <p>{t(bio)}</p>
      <small>
        {t("Next available")}: {next || t("No availability published")}
      </small>
    </>
  );
  return (
    <article className={`care-card ${compact ? "compact" : ""}`}>
      <div className="care-identity">
        <Avatar name={name} size="large" />
        <div>
          <h2>{name}</h2>
          <p>{t("Clinical Psychologist")}</p>
        </div>
      </div>
      {details}
      <div className="care-actions">
        <Button variant="secondary" onClick={() => setView(true)}>
          {t("View profile")}
        </Button>
        {choose && (
          <Button onClick={choose}>
            {t("Choose psychologist")}
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
      {view && (
        <Modal title={name} onClose={() => setView(false)}>
          <div className="profile-modal">
            <Avatar name={name} size="large" />
            <h3>{t("Clinical Psychologist")}</h3>
            {details}
            <small>
              {t("Fictional professional profile · Client prototype")}
            </small>
            {choose && (
              <Button
                onClick={() => {
                  setView(false);
                  choose();
                }}
              >
                {t("Choose psychologist")}
              </Button>
            )}
          </div>
        </Modal>
      )}
    </article>
  );
}
export function Onboarding() {
  const {
    t,
    lang,
    setLang,
    roster,
    choosePsychologist,
    primaryPsychologist,
    setOnboarded,
    switchRole,
  } = useDemo();
  const [step, setStep] = useState(0),
    [acknowledged, setAcknowledged] = useState(false);
  const steps = [
    "Welcome",
    "Your privacy",
    "Your psychologist",
    "Ready when you are",
  ];
  return (
    <div className="onboarding">
      <header>
        <Logo />
        <div className="language">
          <button onClick={() => setLang("sq")} aria-pressed={lang === "sq"}>
            SQ
          </button>
          <span>/</span>
          <button onClick={() => setLang("en")} aria-pressed={lang === "en"}>
            EN
          </button>
        </div>
      </header>
      <div className="onboarding-layout">
        <aside>
          <p className="eyebrow">Mind Nexus × Aurora Hospital</p>
          <ol>
            {steps.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined}>
                <span>{i < step ? <Check size={15} /> : `0${i + 1}`}</span>
                {t(s)}
              </li>
            ))}
          </ol>
          <small>{t("Fictional data · Client prototype")}</small>
        </aside>
        <main
          key={step}
          className={
            step === 2 ? "onboarding-main selection" : "onboarding-main"
          }
        >
          <span className="eyebrow">{t(steps[step])}</span>
          {step === 0 && (
            <>
              <h1>{t("Support for you, with privacy at its core.")}</h1>
              <p className="onboarding-lead">
                {t(
                  "Aurora Hospital has partnered with Mind Nexus to provide confidential individual psychological support.",
                )}
              </p>
              <div className="onboarding-benefit">
                <strong>03</strong>
                <div>
                  <h2>{t("Consultations covered by your employer.")}</h2>
                  <p>{t("No payment is required for these three sessions.")}</p>
                </div>
              </div>
              <Button onClick={() => setStep(1)}>
                {t("Get started")}
                <ArrowRight size={17} />
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <h1>{t("Your support. Your confidence.")}</h1>
              <p className="onboarding-lead">
                {t(
                  "Your relationship is with Mind Nexus, independently of hospital HR.",
                )}
              </p>
              <PrivacyExplanation />
              <label className="checkbox privacy-ack">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                {t("I understand how my privacy is protected")}
              </label>
              <Button disabled={!acknowledged} onClick={() => setStep(2)}>
                {t("Continue")}
                <ArrowRight size={17} />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <h1>{t("Choose your psychologist.")}</h1>
              <p className="onboarding-lead">
                {t(
                  "Choose the psychologist you feel most comfortable working with.",
                )}
              </p>
              <div className="care-grid">
                {roster
                  .filter((r) => r.active)
                  .map((r) => (
                    <PsychologistCard
                      key={r.name}
                      name={r.name}
                      choose={() => {
                        choosePsychologist(r.name);
                        setStep(3);
                      }}
                    />
                  ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Avatar name={primaryPsychologist} size="large" />
              <h1>{primaryPsychologist}</h1>
              <h2>{t("is now your psychologist.")}</h2>
              <p className="onboarding-lead">
                {t(
                  "For continuity, future consultations will remain with your chosen psychologist.",
                )}
              </p>
              <p>
                {t(
                  "Need to change psychologist? Contact Mind Nexus through your account.",
                )}
              </p>
              <Button onClick={() => setOnboarded(true)}>
                {t("Go to Home")}
                <ArrowRight size={17} />
              </Button>
            </>
          )}
          {step > 0 && step < 3 && (
            <button
              className="text-button onboarding-back"
              onClick={() => setStep(step - 1)}
            >
              {t("Back")}
            </button>
          )}
        </main>
      </div>
      <footer>
        <span>© 2026 Mind Nexus</span>
        <button className="text-button" onClick={() => switchRole(null)}>
          {t("Back to prototype access")}
        </button>
      </footer>
    </div>
  );
}
export function PrivateContinuation({ onClose }: { onClose: () => void }) {
  const { t, primaryPsychologist, privateRequested, setPrivateRequested } =
    useDemo();
  return (
    <Modal title={t("Continue privately")} onClose={onClose}>
      <div className="form-stack">
        <p>
          {t(
            "You can continue with your psychologist privately if you would like further support.",
          )}
        </p>
        <div className="booking-doctor">
          <Avatar name={primaryPsychologist} />
          <strong>{primaryPsychologist}</strong>
        </div>
        <p>
          {t(
            "Additional sessions are separate from your employer-funded allowance and the hospital session pool.",
          )}
        </p>
        <p>
          {t(
            "Payment and consultation details would be arranged privately through Mind Nexus. No payment is collected in this prototype.",
          )}
        </p>
        {privateRequested ? (
          <p role="status">
            {t(
              "Your interest has been saved in this demo. No request was sent.",
            )}
          </p>
        ) : (
          <Button onClick={() => setPrivateRequested(true)}>
            {t("Register interest in this demo")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
