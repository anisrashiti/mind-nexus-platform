"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Download,
  Upload,
  Building2,
  ShieldCheck,
  Search,
  Users,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { useDemo } from "./demo-context";
import { Avatar, Badge, Button, Modal, Privacy, SectionTitle } from "./ui";
import { PageHeader } from "./patient";
import { UsageChart } from "./charts";
import { formatDate, endTime, psychologists, usage } from "@/lib/data";
export const aggregatePrivacy =
  "Individual participation and clinical information remain confidential. Organization reporting is provided in aggregate form.";
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const content = rows
    .map((row) =>
      row
        .map(
          (v) =>
            '"' +
            String(v)
              .replace(/^([=+@-])/, "\t$1")
              .replaceAll('"', '""') +
            '"',
        )
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadAggregate() {
  downloadCsv("mind-nexus-aggregate-report.csv", [
    ["Aurora Hospital", "Aggregate program report"],
    ["Purchased", 500],
    ["Used", 126],
    ["Remaining", 374],
    ["Completed", 109],
    ["Cancelled", 11],
    ["No-show", 6],
    ["Average wait (days)", 1.8],
    ["Month", "Sessions"],
    ...usage.map((u) => [u.month, u.sessions]),
  ]);
}
export function ProgramOverview({
  usageOnly = false,
}: {
  usageOnly?: boolean;
}) {
  const { t, navigate } = useDemo();
  return (
    <>
      <PageHeader
        title={
          usageOnly ? "Program Usage" : "Employee Psychological Support Program"
        }
        subtitle="Aurora Hospital"
      >
        <Button variant="secondary" onClick={downloadAggregate}>
          <Download size={16} />
          {t("Download report")}
        </Button>
      </PageHeader>
      <div className="program-banner">
        <div className="hospital-mark">
          <Building2 size={25} strokeWidth={1.3} />
        </div>
        <div>
          <h3>Mind Nexus × Aurora Hospital</h3>
          <p>{t("Supporting the people who care for others.")}</p>
        </div>
        <Badge>{t("Active")} · 2026</Badge>
      </div>
      <div className="metrics org-metrics">
        {[
          ["Purchased sessions", "500"],
          ["Used sessions", "126"],
          ["Remaining", "374"],
          ["Utilization", "25.2%"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="eyebrow">{t(label)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="aggregate-notice">
        <ShieldCheck size={23} />
        <div>
          <strong>{t("Aggregate reporting only")}</strong>
          <p>{t(aggregatePrivacy)}</p>
        </div>
      </div>
      <div className="report-grid">
        <section className="chart-panel">
          <SectionTitle title={t("Monthly usage")} />
          <p className="section-subtitle">
            {t("Sessions used")} · April–September 2026
          </p>
          <UsageChart />
        </section>
        <section className="distribution">
          <SectionTitle title={t("Service distribution")} />
          {[
            ["Psychological Consultation", 54],
            ["Stress & Burnout Support", 25],
            ["Well-being Check-in", 13],
            ["Professional Coaching", 8],
          ].map(([name, value], i) => (
            <div key={name}>
              <div>
                <span>{t(String(name))}</span>
                <strong>{value}%</strong>
              </div>
              <div className="distribution-track">
                <span
                  style={{
                    width: `${value}%`,
                    background: ["#869a7e", "#b3bea8", "#b5a591", "#c8bdb0"][i],
                  }}
                />
              </div>
            </div>
          ))}
          <small>
            {t(
              "Broad service categories only. No individual consultation details.",
            )}
          </small>
        </section>
      </div>
      <section className="program-activity">
        <SectionTitle title={t("Program activity")} />
        <div className="activity-stats">
          {[
            ["109", "Completed"],
            ["11", "Cancelled"],
            ["6", "No-show"],
            ["1.8 days", "Average wait"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{t(label)}</span>
            </div>
          ))}
        </div>
      </section>
      {!usageOnly && (
        <div className="program-links">
          <button onClick={() => navigate("Eligibility")}>
            <Users size={20} />
            <span>{t("Manage employee eligibility")}</span>
            <ArrowUpRight size={18} />
          </button>
          <button onClick={() => navigate("Contract")}>
            <FileText size={20} />
            <span>{t("View program contract")}</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
export function Eligibility() {
  const { t, employees, setEmployees, log, notify } = useDemo();
  const [search, setSearch] = useState(""),
    [modal, setModal] = useState(""),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [department, setDepartment] = useState("Nursing"),
    [csv, setCsv] = useState(""),
    [error, setError] = useState(""),
    [deactivate, setDeactivate] = useState<string | null>(null);
  const list = employees.filter((e) =>
    (e.name + " " + e.email + " " + e.department)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function add(e: React.FormEvent) {
    e.preventDefault();
    if (employees.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
      setError("This email is already on the eligibility list.");
      return;
    }
    setEmployees((v) => [
      ...v,
      {
        id: `EMP-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        department,
        active: true,
      },
    ]);
    log("Mind Nexus Admin", "Added employee eligibility", "ELIGIBILITY");
    setModal("");
    setName("");
    setEmail("");
    notify("Employee added.");
  }
  function importCsv() {
    const lines = csv.trim().split(/\r?\n/);
    if (
      lines[0]?.toLowerCase().replaceAll(" ", "") !== "name,email,department"
    ) {
      setError("Use the header name,email,department.");
      return;
    }
    const parsed = lines
      .slice(1)
      .filter(Boolean)
      .map((l) => l.split(",").map((x) => x.trim()));
    if (
      !parsed.length ||
      parsed.some(
        (r) => r.length !== 3 || !r[0] || !/^\S+@\S+\.\S+$/.test(r[1]) || !r[2],
      )
    ) {
      setError("Check each row has a name, valid email, and department.");
      return;
    }
    const seen = new Set(employees.map((e) => e.email.toLowerCase()));
    const additions = parsed
      .filter((r) => {
        if (seen.has(r[1].toLowerCase())) return false;
        seen.add(r[1].toLowerCase());
        return true;
      })
      .map((r, i) => ({
        id: `EMP-${Date.now()}-${i}`,
        name: r[0],
        email: r[1],
        department: r[2],
        active: true,
      }));
    setEmployees((e) => [...e, ...additions]);
    notify(`${additions.length} employees imported.`);
    log("Mind Nexus Admin", "Imported eligibility list", "ELIGIBILITY");
    setModal("");
  }
  return (
    <>
      <PageHeader
        title="Eligibility"
        subtitle="Manage access to the program, with participation kept private."
      >
        <div className="button-group">
          <Button
            variant="secondary"
            onClick={() => {
              setModal("csv");
              setError("");
            }}
          >
            <Upload size={16} />
            {t("Upload CSV")}
          </Button>
          <Button
            onClick={() => {
              setModal("add");
              setError("");
            }}
          >
            <Plus size={16} />
            {t("Add employee")}
          </Button>
        </div>
      </PageHeader>
      <Privacy>
        {t(
          "Eligibility does not indicate whether an employee has used the program.",
        )}
      </Privacy>
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label={t("Search employees")}
            placeholder={t("Search employees")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span>
          {employees.filter((e) => e.active).length}{" "}
          {t("eligible employees in demo")}
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["Employee", "Work email", "Department", "Eligibility", ""].map(
                (h) => (
                  <th key={h}>{t(h)}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.name}</strong>
                </td>
                <td>{e.email}</td>
                <td>{t(e.department)}</td>
                <td>
                  <Badge tone={e.active ? "green" : "neutral"}>
                    {t(e.active ? "Active" : "Inactive")}
                  </Badge>
                </td>
                <td>
                  <button
                    className="text-button"
                    onClick={() =>
                      e.active
                        ? setDeactivate(e.id)
                        : (setEmployees(
                            employees.map((x) =>
                              x.id === e.id ? { ...x, active: true } : x,
                            ),
                          ),
                          log(
                            "Mind Nexus Admin",
                            "Activated eligibility",
                            e.id,
                          ))
                    }
                  >
                    {t(e.active ? "Deactivate" : "Activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="empty-state">{t("No results found.")}</p>
        )}
      </div>
      {modal && (
        <Modal
          title={t(modal === "csv" ? "Upload CSV" : "Add employee")}
          description={t(
            "Use fictional employee details for this demonstration.",
          )}
          onClose={() => setModal("")}
        >
          {modal === "add" ? (
            <form onSubmit={add}>
              <div className="form-stack">
                <label>
                  {t("Name")}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("Work email")}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("Department")}
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {[
                      "Nursing",
                      "Operations",
                      "Emergency",
                      "Administration",
                      "Laboratory",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              {error && (
                <p role="alert" className="error">
                  {t(error)}
                </p>
              )}
              <div className="modal-actions">
                <Button>{t("Add employee")}</Button>
              </div>
            </form>
          ) : (
            <div className="form-stack">
              <label>
                {t("Choose CSV file")}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setCsv(await f.text());
                  }}
                />
              </label>
              <label>
                {t("Or paste CSV")}
                <textarea
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  placeholder={
                    "name,email,department\nBora Dervishi,bora@aurora.example,Nursing"
                  }
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {t(error)}
                </p>
              )}
              <Button disabled={!csv.trim()} onClick={importCsv}>
                {t("Import employees")}
              </Button>
            </div>
          )}
        </Modal>
      )}
      {deactivate && (
        <Modal
          title={t("Deactivate eligibility?")}
          description={t(
            "This changes program access only. Clinical records remain confidential.",
          )}
          onClose={() => setDeactivate(null)}
        >
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeactivate(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setEmployees(
                  employees.map((x) =>
                    x.id === deactivate ? { ...x, active: false } : x,
                  ),
                );
                log("Mind Nexus Admin", "Deactivated eligibility", deactivate);
                setDeactivate(null);
                notify("Eligibility updated.");
              }}
            >
              {t("Deactivate")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Contract() {
  const { t } = useDemo();
  return (
    <>
      <PageHeader
        title="Contract"
        subtitle="Your partnership with Mind Nexus."
      />
      <section className="contract-document">
        <div className="contract-title">
          <div>
            <span className="eyebrow">MIND NEXUS × AURORA HOSPITAL</span>
            <h1>{t("Mind Nexus Employee Support Program")}</h1>
          </div>
          <Badge>{t("Active")}</Badge>
        </div>
        <dl className="contract-details">
          <div>
            <dt>{t("Purchased sessions")}</dt>
            <dd>
              500 <small>{t("Session duration: 50 minutes")}</small>
            </dd>
          </div>
          <div>
            <dt>{t("Contract period")}</dt>
            <dd>01 Jan — 31 Dec 2026</dd>
          </div>
          <div>
            <dt>{t("Program manager")}</dt>
            <dd>
              Diellza Morina<small>programs@mindnexus.example</small>
            </dd>
          </div>
          <div>
            <dt>{t("Available psychologists")}</dt>
            <dd>4</dd>
          </div>
          <div>
            <dt>{t("Payment responsibility")}</dt>
            <dd>
              Aurora Hospital<small>{t("No payment needed from you.")}</small>
            </dd>
          </div>
          <div>
            <dt>{t("Session delivery")}</dt>
            <dd>
              {t("Online")} · {t("Albanian / English")}
              <small>{t("1-hour reserved slot")}</small>
              <small>{t("Maximum 3 sessions per employee")}</small>
            </dd>
          </div>
        </dl>
        <Privacy>{t(aggregatePrivacy)}</Privacy>
      </section>
    </>
  );
}
export function Reports() {
  const { t } = useDemo();
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="A clear picture of program impact, without individual details."
      />
      <Privacy>{t(aggregatePrivacy)}</Privacy>
      <div className="report-document">
        <div>
          <span className="eyebrow">SEPTEMBER 2026 · AURORA HOSPITAL</span>
          <h2>{t("Program utilization report")}</h2>
          <p>
            {t("Session totals, monthly activity, and service distribution.")}
          </p>
        </div>
        <Button onClick={downloadAggregate}>
          <Download size={16} />
          {t("Download report")}
        </Button>
      </div>
      <div className="surface chart-surface">
        <SectionTitle title={t("Monthly usage")} />
        <UsageChart />
      </div>
    </>
  );
}
export function AdminHome() {
  const { t, navigate, people, roster, employees, audit, appointments } =
    useDemo();
  return (
    <>
      <PageHeader
        title="A clear view of your care network."
        subtitle="Mind Nexus operations · September 2026"
      ></PageHeader>
      <div className="metrics org-metrics">
        {[
          ["Active organizations", "1"],
          ["Active psychologists", roster.filter((p) => p.active).length],
          ["Eligible employees", 500 + employees.length - 6],
          ["Sessions this month", "30"],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="eyebrow">{t(String(label))}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-main">
        <section>
          <SectionTitle
            title={t("Organization utilization")}
            action={t("View all")}
            onAction={() => navigate("Organizations")}
          />
          <div className="org-utilization">
            <span className="hospital-mark">
              <Building2 size={24} />
            </span>
            <div>
              <h3>Aurora Hospital</h3>
              <p>126 / 500 {t("sessions")}</p>
              <div className="distribution-track">
                <span style={{ width: "25.2%" }} />
              </div>
            </div>
            <strong>25.2%</strong>
          </div>
          <SectionTitle
            title={t("Upcoming sessions")}
            action={t("View all")}
            onAction={() => navigate("Appointments")}
          />
          {appointments
            .filter((a) => a.status === "Upcoming")
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .slice(0, 4)
            .map((a) => (
              <div className="admin-appointment" key={a.id}>
                <span>
                  {a.time}?{endTime(a.time)}
                </span>
                <div>
                  <h3>{people.find((p) => p.id === a.patient)?.name}</h3>
                  <p>{a.psychologist} · Aurora Hospital</p>
                </div>
                <Badge>{t("Upcoming")}</Badge>
              </div>
            ))}
        </section>
        <aside>
          <SectionTitle
            title={t("Recent activity")}
            action={t("Audit Log")}
            onAction={() => navigate("Audit Log")}
          />
          <div className="activity-feed">
            {audit.slice(0, 4).map((a, i) => (
              <div key={i}>
                <i />
                <strong>{t(a.action)}</strong>
                <p>{a.actor}</p>
                <small>
                  {a.time}?{endTime(a.time)}
                </small>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
export function Organizations() {
  const { t, navigate } = useDemo();
  const [detail, setDetail] = useState(false);
  return detail ? (
    <>
      <button
        className="text-button back-link"
        onClick={() => setDetail(false)}
      >
        <ChevronLeft size={16} />
        {t("Organizations")}
      </button>
      <ProgramOverview />
      <section className="surface chart-surface">
        <SectionTitle title={t("Available psychologists")} />
        <p>{psychologists.join(" · ")}</p>
        <div className="button-group spaced">
          <Button variant="secondary" onClick={() => navigate("Eligibility")}>
            {t("Eligibility")}
          </Button>
          <Button variant="secondary" onClick={() => navigate("Reports")}>
            {t("Reports")}
          </Button>
        </div>
      </section>
    </>
  ) : (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Your workplace support partnerships."
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Organization",
                "Purchased sessions",
                "Used",
                "Remaining",
                "Psychologists",
                "Status",
                "",
              ].map((x) => (
                <th key={x}>{t(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <button className="person-cell" onClick={() => setDetail(true)}>
                  <span className="hospital-mark">
                    <Building2 size={20} />
                  </span>
                  <strong>Aurora Hospital</strong>
                </button>
              </td>
              <td>500</td>
              <td>126</td>
              <td>374</td>
              <td>4</td>
              <td>
                <Badge>{t("Active")}</Badge>
              </td>
              <td>
                <Button variant="secondary" onClick={() => setDetail(true)}>
                  {t("Open")}
                  <ArrowUpRight size={15} />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
export function Psychologists() {
  const { t, roster, setRoster, log, notify } = useDemo();
  const [modal, setModal] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [name, setName] = useState(""),
    [specialty, setSpecialty] = useState(""),
    [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        title="Psychologists"
        subtitle="The professionals behind your care network."
      >
        <Button onClick={() => setModal(true)}>
          <Plus size={16} />
          {t("Add psychologist")}
        </Button>
      </PageHeader>
      <input
        className="search-field"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("Search")}
        aria-label={t("Search")}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Name",
                "Specialties",
                "Languages",
                "Active patients",
                "Availability",
                "Status",
                "",
              ].map((x) => (
                <th key={x}>{t(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster
              .filter((r) =>
                (r.name + r.specialty)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((r) => (
                <tr key={r.name}>
                  <td>
                    <button
                      className="person-cell"
                      onClick={() => setSelected(r.name)}
                    >
                      <Avatar name={r.name} />
                      <strong>{r.name}</strong>
                    </button>
                  </td>
                  <td>{r.specialty}</td>
                  <td>{t(r.languages)}</td>
                  <td>{r.count}</td>
                  <td>{t(r.active ? "Available" : "Unavailable")}</td>
                  <td>
                    <Badge tone={r.active ? "green" : "neutral"}>
                      {t(r.active ? "Active" : "Inactive")}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => {
                        setRoster(
                          roster.map((x) =>
                            x.name === r.name ? { ...x, active: !x.active } : x,
                          ),
                        );
                        log(
                          "Mind Nexus Admin",
                          r.active
                            ? "Deactivated psychologist"
                            : "Activated psychologist",
                          r.name,
                        );
                      }}
                    >
                      {t(r.active ? "Deactivate" : "Activate")}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={t("Add psychologist")} onClose={() => setModal(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (roster.some((r) => r.name === name.trim())) {
                notify("Psychologist already exists.");
                return;
              }
              setRoster([
                ...roster,
                {
                  name: name.trim(),
                  active: true,
                  specialty,
                  languages: "Albanian / English",
                  count: 0,
                },
              ]);
              setModal(false);
              notify("Psychologist added.");
            }}
          >
            <div className="form-stack">
              <label>
                {t("Name")}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                {t("Specialties")}
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                />
              </label>
              <label>
                {t("Languages")}
                <input value="Albanian / English" readOnly />
              </label>
            </div>
            <div className="modal-actions">
              <Button>{t("Add psychologist")}</Button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal title={selected} onClose={() => setSelected(null)}>
          <div className="profile-modal">
            <Avatar name={selected} size="large" />
            <h2>{t("Clinical Psychologist")}</h2>
            <p>{roster.find((r) => r.name === selected)?.specialty}</p>
            <Badge>{t("Albanian / English")}</Badge>
            <p>{t("Session duration: 50 minutes")}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
export function OperationalAppointments() {
  const { t, appointments, people } = useDemo();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("All");
  const list = appointments.filter(
    (a) =>
      (status === "All" || a.status === status) &&
      (a.id + a.psychologist + people.find((p) => p.id === a.patient)?.name)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Scheduling oversight across the program."
      />
      <div className="table-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label={t("Search")}
            placeholder={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label={t("Status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All", "Upcoming", "Completed", "Cancelled"].map((x) => (
            <option value={x} key={x}>
              {t(x)}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Appointment ID",
                "Psychologist",
                "Patient",
                "Organization",
                "Date",
                "Status",
              ].map((x) => (
                <th key={x}>{t(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.psychologist}</td>
                <td>{people.find((p) => p.id === a.patient)?.name}</td>
                <td>Aurora Hospital</td>
                <td>
                  {formatDate(a.date)}
                  <small>
                    {a.time}–{endTime(a.time)}
                  </small>
                </td>
                <td>
                  <Badge tone={a.status === "Cancelled" ? "neutral" : "green"}>
                    {t(a.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <p className="empty-state">{t("No results found.")}</p>
        )}
      </div>
      <Privacy>
        {t(
          "Operational scheduling only. Clinical notes and assessment responses are restricted to the care workspace.",
        )}
      </Privacy>
    </>
  );
}
export function Services() {
  const { t, services, setServices, notify, log } = useDemo();
  const [edit, setEdit] = useState<number | null>(null),
    [name, setName] = useState("");
  return (
    <>
      <PageHeader
        title="Services"
        subtitle="A focused, consistent support offering."
      />
      <div className="service-list">
        {services.map((s, i) => (
          <div className="service-row" key={i}>
            <span className="service-number">0{i + 1}</span>
            <div>
              <h2>{s.name}</h2>
              <p>
                {t("Session duration: 50 minutes")} · {t("Online")}
              </p>
            </div>
            <Badge tone={s.active ? "green" : "neutral"}>
              {t(s.active ? "Active" : "Inactive")}
            </Badge>
            <Button
              variant="secondary"
              onClick={() => {
                setEdit(i);
                setName(s.name);
              }}
            >
              {t("Edit")}
            </Button>
            <button
              className="text-button"
              onClick={() => {
                setServices(
                  services.map((x, j) =>
                    j === i ? { ...x, active: !x.active } : x,
                  ),
                );
                log("Mind Nexus Admin", "Updated service status", s.name);
              }}
            >
              {t(s.active ? "Deactivate" : "Activate")}
            </button>
          </div>
        ))}
      </div>
      {edit !== null && (
        <Modal title={t("Edit service")} onClose={() => setEdit(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setServices(
                services.map((x, i) =>
                  i === edit ? { ...x, name: name.trim() } : x,
                ),
              );
              setEdit(null);
              notify("Saved successfully.");
            }}
          >
            <label>
              {t("Name")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <p className="spaced">
              {t(
                "Each reservation lasts 1 hour: 50 minutes of consultation and 10 minutes of buffer time.",
              )}
            </p>
            <div className="modal-actions">
              <Button>{t("Save changes")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function AuditLog() {
  const { t, audit } = useDemo();
  const [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Accountability without exposing confidential content."
      />
      <input
        className="search-field"
        placeholder={t("Search")}
        aria-label={t("Search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {["Timestamp", "Actor", "Action", "Resource"].map((x) => (
                <th key={x}>{t(x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audit
              .filter((a) =>
                Object.values(a)
                  .join(" ")
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((a, i) => (
                <tr key={i}>
                  <td>{a.time}</td>
                  <td>{a.actor}</td>
                  <td>{t(a.action)}</td>
                  <td>
                    <code>{a.resource}</code>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Privacy>
        {t(
          "Audit records describe access and actions. They never contain session note content.",
        )}
      </Privacy>
    </>
  );
}
