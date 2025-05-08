import { formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface YearlyData {
  year: string;
  planned_hours: number;
  actual_hours: number;
  overrun_percent: number;
  total_cost: number;
}

interface ChartProps {
  data: YearlyData[];
}

export default function YearlyTrendsChart({ data }: ChartProps) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No yearly trend data available
      </div>
    );
  }

  // Calculate percent data for each year
  const chartData = data.map(y => ({
    name: y.year,
    "Planned Hours": y.planned_hours,
    "Actual Hours": y.actual_hours,
    "Overrun %": y.overrun_percent,
    "Total Cost": y.total_cost
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: "#ddd" }}
          axisLine={{ stroke: "#ddd" }}
        />
        <YAxis
          yAxisId="hours"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: "#ddd" }}
          axisLine={{ stroke: "#ddd" }}
          tickFormatter={(value) => formatNumber(value)}
          label={{
            value: "Hours",
            angle: -90,
            position: "insideLeft",
            offset: 0,
          }}
        />
        <YAxis
          yAxisId="percentage"
          orientation="right"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: "#ddd" }}
          axisLine={{ stroke: "#ddd" }}
          tickFormatter={(value) => formatPercent(value / 100)}
          label={{
            value: "Overrun %",
            angle: 90,
            position: "insideRight",
            offset: 0,
          }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "Overrun %") return formatPercent(value / 100);
            if (name === "Total Cost") return formatMoney(value);
            return formatNumber(value);
          }}
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        <Area
          yAxisId="hours"
          type="monotone"
          dataKey="Planned Hours"
          stackId="1"
          stroke="#1e40af"
          fill="rgba(30, 64, 175, 0.1)"
        />
        <Area
          yAxisId="hours"
          type="monotone"
          dataKey="Actual Hours"
          stackId="2"
          stroke="#dc2626"
          fill="rgba(220, 38, 38, 0.1)"
        />
        <Area
          yAxisId="percentage"
          type="monotone"
          dataKey="Overrun %"
          stroke="#f59e0b"
          fill="rgba(245, 158, 11, 0.1)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
