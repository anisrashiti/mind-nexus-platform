"use client";
import { useState } from "react";
import { ArrowUpRight, Download } from "lucide-react";
import { program, formatDate } from "@/lib/data";
import { useDemo } from "./demo-context";
import { PageHeader } from "./patient";
import { Button, Badge, Tabs } from "./ui";
import {
  Eligibility,
  Psychologists,
  Contract,
  downloadCsv,
} from "./operations";

function Pool() {
  const { t, poolUsed, poolReserved, poolRemaining } = useDemo();
  return (
    <section className="pool-surface">
      <div className="pool-heading">
        <span className="eyebrow">{t("Employer-funded session pool")}</span>
        <span>{t("Contract year")} · 2026–27</span>
      </div>
      <div className="pool-numbers">
        <div>
          <strong>{program.purchased}</strong>
          <span>{t("Purchased")}</span>
        </div>
        <div>
          <strong>{poolUsed}</strong>
          <span>{t("Used")}</span>
        </div>
        <div>
          <strong>{poolReserved}</strong>
          <span>{t("Reserved")}</span>
        </div>
        <div>
          <strong>{poolRemaining}</strong>
          <span>{t("Available")}</span>
        </div>
      </div>
      <div className="pool-track" aria-label={t("Session pool allocation")}>
        <span style={{ width: `${poolUsed / 5}%` }} />
        <span style={{ width: `${poolReserved / 5}%` }} />
      </div>
      <p>
        {t(
          "Completed and no-show consultations use the pool. Reservations hold a place; cancellation releases it.",
        )}
      </p>
    </section>
  );
}
export function ProgramDashboard() {
  const {
    t,
    lang,
    navigate,
    employees,
    roster,
    appointments,
    changeRequested,
    privateRequested,
  } = useDemo();
  return (
    <>
      <PageHeader
        title="Program overview"
        subtitle="Mind Nexus · Program operations"
      />
      <section className="program-heading">
        <div>
          <span className="eyebrow">{t("Employee Psychological Support")}</span>
          <h2>Aurora Hospital</h2>
          <p>
            {formatDate(program.start, lang)} 2026 —{" "}
            {formatDate(program.end, lang)} 2027
          </p>
        </div>
        <Badge>{t("Active")}</Badge>
        <Button variant="secondary" onClick={() => navigate("Program")}>
          {t("Manage program")}
          <ArrowUpRight size={16} />
        </Button>
      </section>
      <Pool />
      <div className="program-facts">
        <button onClick={() => navigate("Program")}>
          <strong>03</strong>
          <div>
            <h3>{t("Consultations per employee")}</h3>
            <p>{t("Employer-funded · No employee payment")}</p>
          </div>
          <ArrowUpRight size={18} />
        </button>
        <button onClick={() => navigate("Employees")}>
          <strong>{employees.filter((e) => e.active).length}</strong>
          <div>
            <h3>{t("Eligible employees")}</h3>
            <p>{t("Eligibility determines access, not participation.")}</p>
          </div>
          <ArrowUpRight size={18} />
        </button>
        <button onClick={() => navigate("Psychologists")}>
          <strong>{roster.filter((r) => r.active).length}</strong>
          <div>
            <h3>{t("Psychologists")}</h3>
            <p>{t("Continuity through a chosen care relationship")}</p>
          </div>
          <ArrowUpRight size={18} />
        </button>
      </div>
      <div className="program-bottom">
        <section>
          <h2>{t("Operational sessions")}</h2>
          <p>{t("Appointments in this demo")}</p>
          <div className="operational-counts">
            {["Upcoming", "Completed", "Cancelled", "No-show"].map((status) => (
              <button key={status} onClick={() => navigate("Sessions")}>
                <strong>
                  {appointments.filter((a) => a.status === status).length}
                </strong>
                <span>{t(status)}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="report-preview">
          <span className="eyebrow">{t("Organization reporting")}</span>
          <h2>{t("A clear view of the program.")}</h2>
          <p>
            {t(
              "Individual participation and clinical information are never included in organization reports.",
            )}
          </p>
          <Button variant="secondary" onClick={() => navigate("Reports")}>
            {t("Generate report")}
            <ArrowUpRight size={16} />
          </Button>
        </section>
      </div>
      {(changeRequested || privateRequested) && (
        <div className="quiet-note">
          <p>
            {t("Demo requests")}:{" "}
            {changeRequested && t("Psychologist change requested")}{" "}
            {privateRequested && t("Private continuation interest")}
          </p>
        </div>
      )}
    </>
  );
}
export function ProgramWorkspace() {
  const { t } = useDemo();
  const [tab, setTab] = useState("Overview");
  const tabs = [
    "Overview",
    "Eligibility",
    "Psychologists",
    "Program rules",
    "Session pool",
    "Contract",
  ];
  return (
    <>
      <PageHeader
        title="Employee Psychological Support Program"
        subtitle="Mind Nexus × Aurora Hospital"
      />
      <Tabs
        items={tabs.map(t)}
        value={t(tab)}
        onChange={(value) => setTab(tabs.find((x) => t(x) === value)!)}
      />
      {tab === "Overview" ? (
        <>
          <Pool />
          <div className="program-rules">
            <h2>{t("Support, with continuity.")}</h2>
            <p>
              {t(
                "Each eligible employee receives three employer-funded consultations with their chosen psychologist. Mind Nexus manages delivery and provides agreed aggregate reports to Aurora Hospital.",
              )}
            </p>
          </div>
        </>
      ) : tab === "Eligibility" ? (
        <Eligibility />
      ) : tab === "Psychologists" ? (
        <Psychologists />
      ) : tab === "Contract" ? (
        <Contract />
      ) : tab === "Session pool" ? (
        <>
          <Pool />
          <p className="spaced">
            {t(
              "Historical aggregate usage plus appointments in this demo. Private continuation is excluded.",
            )}
          </p>
        </>
      ) : (
        <div className="program-rules">
          <h2>{t("Program rules")}</h2>
          <dl className="details">
            {[
              [
                "Individual allowance",
                "3 employer-funded consultations per employee",
              ],
              [
                "Continuity of care",
                "Future consultations stay with the chosen psychologist.",
              ],
              [
                "Session duration",
                "1-hour reserved slot · approximately 50-minute consultation",
              ],
              [
                "Availability",
                "Two consecutive 30-minute cells are required for a booking.",
              ],
              [
                "Private continuation",
                "Additional consultations are arranged privately through Mind Nexus.",
              ],
              [
                "Reporting",
                "Individual participation and clinical information are never included in organization reports.",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{t(label)}</dt>
                <dd>{t(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
}

// Dated, anonymous historical fixtures. No employee identifiers enter reports.
const historical = [12, 18, 21, 17, 28, 29].flatMap((count, month) =>
  Array.from({ length: count }, (_, i) => ({
    date: `2026-${String(month + 4).padStart(2, "0")}-${String(1 + (i % (month === 5 ? 9 : 28))).padStart(2, "0")}`,
    status: i === 0 ? "No-show" : "Completed",
  })),
);
const cancelled = Array.from({ length: 11 }, (_, i) => ({
  date: `2026-${String(4 + (i % 6)).padStart(2, "0")}-05`,
  status: "Cancelled",
}));
export function AggregateReports() {
  const { t, appointments, poolUsed, poolReserved, poolRemaining } = useDemo();
  const [start, setStart] = useState(program.start),
    [end, setEnd] = useState("2026-09-30"),
    [range, setRange] = useState({ start: program.start, end: "2026-09-30" });
  const rows = [
    ...historical,
    ...cancelled,
    ...appointments.filter((a) => a.funding !== "private"),
  ].filter((a) => a.date >= range.start && a.date <= range.end);
  const metrics: [string, number | string][] = [
    ["Completed", rows.filter((a) => a.status === "Completed").length],
    ["Reserved", rows.filter((a) => a.status === "Upcoming").length],
    ["Cancelled", rows.filter((a) => a.status === "Cancelled").length],
    ["No-show", rows.filter((a) => a.status === "No-show").length],
  ];
  function exportReport() {
    downloadCsv("mind-nexus-aggregate-report.csv", [
      [t("Program"), "Aurora Hospital"],
      [t("From"), range.start],
      [t("To"), range.end],
      [t("Purchased sessions"), program.purchased],
      [t("Used sessions"), poolUsed],
      [t("Reserved"), poolReserved],
      [t("Available"), poolRemaining],
      [t("Utilization"), `${(poolUsed / 5).toFixed(1)}%`],
      ...metrics.map(([label, value]): [string, string | number] => [
        t(label),
        value,
      ]),
      [
        t("Privacy"),
        t(
          "Individual participation and clinical information are never included in organization reports.",
        ),
      ],
      [
        t("Data source"),
        t("Fictional historical aggregate and local demo appointments"),
      ],
    ]);
  }
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Agreed aggregate reporting for Aurora Hospital"
      />
      <form
        className="report-filters"
        onSubmit={(e) => {
          e.preventDefault();
          if (start <= end) setRange({ start, end });
        }}
      >
        <label>
          {t("From")}
          <input
            type="date"
            required
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          {t("To")}
          <input
            type="date"
            required
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <Button>{t("Generate report")}</Button>
      </form>
      <article className="aggregate-report">
        <div className="report-heading">
          <div>
            <span className="eyebrow">
              Mind Nexus · {t("Aggregate report")}
            </span>
            <h2>Aurora Hospital</h2>
            <p>
              {range.start} — {range.end}
            </p>
          </div>
          <Button variant="secondary" onClick={exportReport}>
            <Download size={16} />
            {t("Export report")}
          </Button>
        </div>
        <p className="report-boundary">
          {t(
            "Individual participation and clinical information are never included in organization reports.",
          )}
        </p>
        <h3>{t("Contract pool · Current position")}</h3>
        <div className="report-metrics">
          {[
            ["Purchased", 500],
            ["Used", poolUsed],
            ["Reserved", poolReserved],
            ["Available", poolRemaining],
          ].map(([label, value]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{t(String(label))}</span>
            </div>
          ))}
        </div>
        <p>
          {t("Utilization")}: {(poolUsed / 5).toFixed(1)}%
        </p>
        <h3 className="spaced">{t("Sessions in selected period")}</h3>
        <div className="report-metrics">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{t(label)}</span>
            </div>
          ))}
        </div>
        <p className="report-source">
          {t("Fictional historical aggregate and local demo appointments")}.{" "}
          {t(
            "Private continuation is excluded. Wait-time data is not collected in this prototype.",
          )}
        </p>
      </article>
    </>
  );
}
