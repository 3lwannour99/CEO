"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColorForKey } from "@/constants/chartColors";
import { formatNumber } from "@/lib/apiClient";
import { BiChartCard } from "@/components/charts/BiChartCard/BiChartCard";
import styles from "./LineChartCard.module.css";

export type LineDatum = { name: string } & Record<string, string | number>;

interface LineChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: LineDatum[];
  keys: string[];
  isLoading?: boolean;
  valueFormatter?: (value: number, key: string) => string;
  yAxisFormatter?: (value: number) => string;
  labels?: Record<string, string>;
}

export function LineChartCard({ title, subtitle, insight, data, keys, isLoading, valueFormatter, yAxisFormatter, labels }: LineChartCardProps) {
  const chartData = data.filter((item) => keys.some((key) => Number(item[key]) > 0));

  return (
    <BiChartCard title={title} subtitle={subtitle} insight={insight} isLoading={isLoading} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%" className={styles.chart}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} tickFormatter={(value) => yAxisFormatter ? yAxisFormatter(Number(value)) : formatNumber(Number(value))} />
          <Tooltip formatter={(value, name) => [valueFormatter ? valueFormatter(Number(value), String(name)) : formatNumber(Number(value)), labels?.[String(name)] ?? String(name)]} />
          <Legend />
          {keys.map((key, index) => (
            <Line key={key} type="monotone" dataKey={key} name={labels?.[key] ?? key} stroke={chartColorForKey(key, index)} strokeWidth={2.5} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </BiChartCard>
  );
}
