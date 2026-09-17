"use client";
import { useState, useEffect } from "react";
import { Onboarding, PrivacyExplanation } from "./care";
import {
  ProgramWorkspace,
  ProgramDashboard,
  AggregateReports,
} from "./program";
import Logo from "./logo";
import { Button, Modal } from "./ui";
import { DemoProvider, useDemo } from "./demo-context";
import { Shell, roleNames, navigation } from "./shell";
import { type Role } from "@/lib/data";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import {
  PatientHome,
  PatientAppointments,
  Wellbeing,
  Resources,
} from "./patient";
import {
  ClinicianHome,
  Patients,
  PatientDetail,
  Assessments,
  Availability,
  ClinicianSessions,
  ClinicianCalendar,
} from "./clinician";
import { Messages } from "./messages";
import { Profile } from "./profile";
import {
  Eligibility,
  Contract,
  Psychologists,
  OperationalAppointments,
  Services,
  AuditLog,
} from "./operations";
function Login() {
  const { t, lang, setLang, switchRole } = useDemo();
  const [forgot, setForgot] = useState(false);
  return (
    <div className="login">
      <section className="login-brand">
        <Logo />
        <div className="login-statement">
          <span className="eyebrow">
            MIND NEXUS · {t("WORKPLACE WELL-BEING")}
          </span>
          <h1>
            {t("Private support. Built around you.").replace(
              "well-being",
              "well‑being",
            )}
          </h1>
          <p>
            {t("Confidential psychological support for healthier workplaces.")}
          </p>
          <div className="brand-orbits" aria-hidden="true">
            <span />
            <span />
            <span />
            <i />
          </div>
        </div>
        <div className="login-foot">
          <ShieldCheck size={18} />
          {t("Employee Psychological Support")} · Aurora Hospital
        </div>
      </section>
      <section className="login-form">
        <div className="language">
          <button onClick={() => setLang("sq")} aria-pressed={lang === "sq"}>
            SQ
          </button>
          <span>/</span>
          <button onClick={() => setLang("en")} aria-pressed={lang === "en"}>
            EN
          </button>
        </div>
        <div className="login-inner">
          <span className="eyebrow">{t("YOUR MIND. YOUR SPACE.")}</span>
          <h2>{t("Welcome back.")}</h2>
          <p>{t("Sign in to your Mind Nexus workspace.")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              switchRole("patient");
            }}
          >
            <label>
              {t("Email")}
              <input
                type="email"
                placeholder="you@organization.example"
                required
                autoComplete="off"
              />
            </label>
            <label>
              {t("Password")}
              <input
                type="password"
                placeholder={t("Enter your password")}
                required
                autoComplete="off"
              />
            </label>
            <div className="form-between">
              <label className="checkbox">
                <input type="checkbox" />
                {t("Remember me")}
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setForgot(true)}
              >
                {t("Forgot password?")}
              </button>
            </div>
            <Button className="full">
              {t("Sign in")}
              <ArrowRight size={18} />
            </Button>
          </form>
          <div className="demo-divider">
            <span>{t("Prototype access")}</span>
          </div>
          <div className="demo-options">
            {(Object.keys(roleNames) as Role[]).map((r) => (
              <button onClick={() => switchRole(r)} key={r}>
                <span>{t(roleNames[r])}</span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
          <p className="demo-note">
            {t("Fictional data · Client prototype")}
            <br />
            {t("No real credentials needed. Choose a role above.")}
          </p>
        </div>
        <footer>
          © 2026 Mind Nexus <span>Shqip / English</span>
        </footer>
      </section>
      {forgot && (
        <Modal
          title={t("Forgot password?")}
          description={t(
            "No real credentials are used in this prototype. Choose a demo role to explore the platform.",
          )}
          onClose={() => setForgot(false)}
        >
          <Button onClick={() => setForgot(false)}>{t("Explore demo")}</Button>
        </Modal>
      )}
    </div>
  );
}
function App() {
  const { role, page, lang, navigate, onboarded } = useDemo();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const doc = document as Document & {
      modelContext?: {
        registerTool: (tool: unknown, options: { signal: AbortSignal }) => void;
      };
    };
    if (!doc.modelContext?.registerTool || !role) return;
    const lifecycle = new AbortController();
    try {
      doc.modelContext.registerTool(
        {
          name: "navigate_workspace",
          description: "Open a page available to the current demo role.",
          inputSchema: {
            type: "object",
            properties: { page: { type: "string", enum: navigation[role] } },
            required: ["page"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: unknown) => {
            const requested = (input as { page?: string })?.page;
            if (!requested || !navigation[role].includes(requested))
              throw new Error("Page is unavailable to this role");
            navigate(requested);
            return { page: requested, role };
          },
        },
        { signal: lifecycle.signal },
      );
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, [role, navigate]);
  if (!role) return <Login />;
  if (role === "patient" && !onboarded) return <Onboarding />;
  let content: React.ReactNode = null;
  if (page === "Privacy")
    content = (
      <>
        <h1>{lang === "sq" ? "Privatësia juaj" : "Your privacy"}</h1>
        <PrivacyExplanation />
      </>
    );
  else if (page === "Profile" || page === "Settings")
    content = (
      <Profile key={`${role}-${page}`} settings={page === "Settings"} />
    );
  else if (
    page === "Messages" &&
    (role === "patient" || role === "psychologist")
  )
    content = <Messages />;
  else if (role === "patient")
    content =
      page === "Home" ? (
        <PatientHome />
      ) : page === "Sessions" ? (
        <PatientAppointments />
      ) : page === "Reflection" ? (
        <Wellbeing />
      ) : (
        <Resources />
      );
  else if (role === "psychologist")
    content =
      page === "Today" ? (
        <ClinicianHome />
      ) : page === "Clients" ? (
        <Patients />
      ) : page === "Patient detail" ? (
        <PatientDetail />
      ) : page === "Calendar" ? (
        <ClinicianCalendar />
      ) : page === "Sessions" ? (
        <ClinicianSessions />
      ) : page === "Assessments" ? (
        <Assessments />
      ) : (
        <Availability />
      );
  else if (page === "Employees") content = <Eligibility />;
  else if (page === "Reports") content = <AggregateReports />;
  else if (page === "Contract") content = <Contract />;
  else
    content =
      page === "Overview" ? (
        <ProgramDashboard />
      ) : page === "Program" ? (
        <ProgramWorkspace />
      ) : page === "Psychologists" ? (
        <Psychologists />
      ) : page === "Sessions" ? (
        <OperationalAppointments />
      ) : page === "Services" ? (
        <Services />
      ) : (
        <AuditLog />
      );
  return <Shell>{content}</Shell>;
}
export default function Platform() {
  return (
    <DemoProvider>
      <App />
    </DemoProvider>
  );
}
