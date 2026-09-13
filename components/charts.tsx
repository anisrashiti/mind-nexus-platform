"use client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trend, usage } from "@/lib/data";
import { useDemo } from "./demo-context";
export function UsageChart() {
  const { t } = useDemo();
  return (
    <div
      className="chart"
      role="img"
      aria-label="Monthly session usage: April 12, May 18, June 21, July 17, August 28, September 30"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={usage} barSize={31}>
          <CartesianGrid
            vertical={false}
            stroke="#e8e9e3"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#777b75", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#777b75", fontSize: 12 }}
            width={30}
          />
          <Tooltip
            cursor={{ fill: "#f6f5f0" }}
            contentStyle={{ border: "1px solid #e6e7e1", borderRadius: 7 }}
          />
          <Bar
            name={t("Sessions")}
            dataKey="sessions"
            fill="#8a9c83"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function TrendChart() {
  const { checkin, t } = useDemo();
  const data = checkin
    ? [
        ...trend,
        {
          month: "Sep 14",
          score: Math.round((checkin.reduce((a, b) => a + b, 0) / 25) * 100),
        },
      ]
    : trend;
  return (
    <div className="chart" role="img" aria-label={t("Well-being trend")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a9c83" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#8a9c83" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e8e9e3"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#777b75", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            width={28}
            tick={{ fill: "#777b75", fontSize: 12 }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#738a6e"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={{ r: 3, fill: "#738a6e", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
