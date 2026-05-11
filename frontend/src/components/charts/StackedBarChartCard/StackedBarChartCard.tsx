"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColorForKey } from "@/constants/chartColors";
import { formatNumber } from "@/lib/apiClient";
import { BiChartCard } from "@/components/charts/BiChartCard/BiChartCard";
import styles from "./StackedBarChartCard.module.css";

export type StackedDatum = { name: string } & Record<string, string | number>;

interface StackedBarChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: StackedDatum[];
  keys: string[];
  isLoading?: boolean;
}

export function StackedBarChartCard({ title, subtitle, insight, data, keys, isLoading }: StackedBarChartCardProps) {
  const chartData = data.filter((item) => keys.some((key) => Number(item[key]) > 0));

  return (
    <BiChartCard title={title} subtitle={subtitle} insight={insight} isLoading={isLoading} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%" className={styles.chart}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={54} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          {keys.map((key, index) => (
            <Bar key={key} dataKey={key} stackId="total" fill={chartColorForKey(key, index)} radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </BiChartCard>
  );
}
