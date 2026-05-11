"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColors } from "@/constants/chartColors";
import { formatNumber } from "@/lib/apiClient";
import { BiChartCard } from "@/components/charts/BiChartCard/BiChartCard";
import styles from "./BarChartCard.module.css";

export interface BarDatum {
  name: string;
  value: number;
  color?: string;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: BarDatum[];
  valueKey?: string;
  isLoading?: boolean;
}

export function BarChartCard({ title, subtitle, insight, data, valueKey = "value", isLoading }: BarChartCardProps) {
  const chartData = data.filter((item) => Number((item as unknown as Record<string, unknown>)[valueKey]) > 0);

  return (
    <BiChartCard title={title} subtitle={subtitle} insight={insight} isLoading={isLoading} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="100%" className={styles.chart}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 18, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={54} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
          <Bar dataKey={valueKey} fill={chartColors.accent} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </BiChartCard>
  );
}
