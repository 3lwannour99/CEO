"use client";

import type { CSSProperties } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartColorForKey } from "@/constants/chartColors";
import { formatNumber } from "@/lib/apiClient";
import { BiChartCard } from "@/components/charts/BiChartCard/BiChartCard";
import styles from "./DonutChartCard.module.css";

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: DonutDatum[];
  isLoading?: boolean;
}

export function DonutChartCard({ title, subtitle, insight, data, isLoading }: DonutChartCardProps) {
  const chartData = data.filter((item) => item.value > 0);

  return (
    <BiChartCard title={title} subtitle={subtitle} insight={insight} isLoading={isLoading} isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height="78%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color ?? chartColorForKey(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatNumber(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.legend}>
        {chartData.slice(0, 6).map((item, index) => {
          const color = item.color ?? chartColorForKey(item.name, index);
          const swatchStyle = { "--swatch-color": color } as CSSProperties;

          return (
          <span className={styles.legendItem} key={item.name}>
            <span className={styles.swatch} style={swatchStyle} />
            {item.name}: {formatNumber(item.value)}
          </span>
          );
        })}
      </div>
    </BiChartCard>
  );
}
