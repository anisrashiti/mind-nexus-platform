"use client";
import { useState } from "react";
import { LockKeyhole, ShieldCheck, Download, ChevronRight } from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Button, Modal, Privacy, SectionTitle, Badge } from "./ui";
import { PageHeader } from "./patient";
export function Profile({ settings = false }: { settings?: boolean }) {
  const { t, role, lang, setLang, notify, profiles, setProfiles } = useDemo();
  const name =
    role === "patient"
      ? "Arta Krasniqi"
      : role === "psychologist"
        ? "Dr. Luljeta Berisha"
        : role === "organization"
          ? "Aurora Hospital"
          : "Mind Nexus Team";
  const saved = profiles[role!];
  const [email, setEmail] = useState(
      saved?.email ??
        (role === "patient"
          ? "arta.k@aurora.example"
          : role === "psychologist"
            ? "luljeta@mindnexus.example"
            : "programs@aurora.example"),
    ),
    [bio, setBio] = useState(
      saved?.bio ??
        "Clinical psychologist supporting workplace well-being through thoughtful, evidence-informed conversations. Focused on stress, personal resilience, and sustainable working routines.",
    ),
    [notices, setNotices] = useState(saved?.notices ?? [true, true, false]),
    [specialty, setSpecialty] = useState(
      saved?.specialty ?? "Workplace stress, resilience",
    ),
    [modal, setModal] = useState("");
  return (
    <>
      <PageHeader
        title={settings ? "Settings" : "Profile"}
        subtitle="Your details and preferences, in one place."
      />
      <div className="settings-grid">
        <section>
          {!settings && (
            <>
              <div className="profile-identity">
                <Avatar name={name} size="large" />
                <div>
                  <h2>{name}</h2>
                  <p>
                    {t(
                      role === "psychologist"
                        ? "Clinical Psychologist"
                        : role === "patient"
                          ? "Patient / Employee"
                          : "Program administrator",
                    )}
                  </p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setProfiles({
                    ...profiles,
                    [role!]: { email, bio, specialty, notices },
                  });
                  notify("Saved successfully.");
                }}
              >
                <div className="form-grid">
                  <label>
                    {t("Name")}
                    <input value={name} readOnly />
                  </label>
                  <label>
                    {t("Email")}
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    {t("Preferred language")}
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as "en" | "sq")}
                    >
                      <option value="sq">Shqip</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                  {role === "patient" && (
                    <label>
                      {t("Assigned psychologist")}
                      <input value="Dr. Luljeta Berisha" readOnly />
                    </label>
                  )}
                </div>
                {role === "psychologist" && (
                  <>
                    <label className="spaced">
                      {t("Professional bio")}
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                    <div className="form-grid spaced">
                      <label>
                        {t("Specialties")}
                        <input
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                        />
                      </label>
                      <label>
                        {t("Languages")}
                        <input value="Albanian / English" readOnly />
                      </label>
                    </div>
                    <SectionTitle title={t("Session services")} />
                    <Badge>
                      {t("Individual Psychological Consultation")} · 15 min
                    </Badge>
                  </>
                )}
                <div className="spaced">
                  <Button>{t("Save changes")}</Button>
                </div>
              </form>
            </>
          )}
          <SectionTitle title={t("Notification preferences")} />
          {[
            "Appointment reminders",
            "New message notifications",
            "Well-being check-in reminders",
          ].map((n, i) => (
            <label className="preference-row" key={n}>
              <span>{t(n)}</span>
              <input
                type="checkbox"
                role="switch"
                checked={notices[i]}
                onChange={(e) => {
                  const next = notices.map((v, j) =>
                    i === j ? e.target.checked : v,
                  );
                  setNotices(next);
                  setProfiles({
                    ...profiles,
                    [role!]: { email, bio, specialty, notices: next },
                  });
                  notify("Saved successfully.");
                }}
              />
            </label>
          ))}
          <SectionTitle title={t("Security")} />
          <button
            className="settings-row"
            onClick={() => setModal("Two-factor authentication")}
          >
            <ShieldCheck size={20} />
            <div>
              <strong>{t("Two-factor authentication")}</strong>
              <p>{t("Additional account verification")}</p>
            </div>
            <Badge tone="neutral">{t("Preview")}</Badge>
            <ChevronRight size={17} />
          </button>
        </section>
        <aside>
          <SectionTitle title={t("Privacy & consent")} />
          <div className="privacy-settings">
            <LockKeyhole size={26} strokeWidth={1.3} />
            <h2>{t("Your privacy matters.")}</h2>
            <p>
              {t(
                role === "organization"
                  ? "Organization receives aggregate reporting only"
                  : "Clinical information is accessible only within the assigned care relationship.",
              )}
            </p>
            <button onClick={() => setModal("Privacy preferences")}>
              {t("Privacy preferences")}
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setModal("Download my data")}>
              <Download size={16} />
              {t("Download my data")}
              <Badge tone="neutral">{t("Preview")}</Badge>
            </button>
          </div>
          <Privacy>
            {t(
              "This is a client prototype with fictional data. It is not a production healthcare system and does not claim HIPAA or GDPR compliance.",
            )}
          </Privacy>
        </aside>
      </div>
      {modal && (
        <Modal title={t(modal)} onClose={() => setModal("")}>
          <div className="form-stack">
            {modal === "Two-factor authentication" ? (
              <>
                <ShieldCheck size={30} />
                <h2>{t("An additional layer of protection.")}</h2>
                <p>
                  {t(
                    "In the future platform, an authenticator app will provide a second verification step. No authentication is enabled in this prototype.",
                  )}
                </p>
              </>
            ) : modal === "Download my data" ? (
              <>
                <Download size={28} />
                <p>
                  {t(
                    "A future data request workflow would verify your identity before preparing a private export. No personal data is collected or exported in this demo.",
                  )}
                </p>
              </>
            ) : (
              <>
                <Privacy>
                  {t("Organization receives aggregate reporting only")}
                </Privacy>
                <p>
                  {t(
                    "Consultations, messages, and check-in responses remain within the assigned care relationship. Program administrators manage eligibility and aggregate usage.",
                  )}
                </p>
                <Badge>{t("Program consent acknowledged")} · 24 Aug 2026</Badge>
                <p>
                  {t("Consent controls are illustrative in this prototype.")}
                </p>
              </>
            )}
            <Button variant="secondary" onClick={() => setModal("")}>
              {t("Close")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
