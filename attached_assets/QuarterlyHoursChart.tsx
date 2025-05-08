import { formatNumber } from "@/lib/formatters";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface QuarterlyData {
    quarter: string;
    planned_hours: number;
    actual_hours: number;
    overrun_hours: number;
    overrun_cost: number;
    total_jobs: number;
}

interface ChartProps {
    data: QuarterlyData[];
}

export default function QuarterlyHoursChart({ data }: ChartProps) {
    if (!data?.length) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No quarterly data available
            </div>
        );
    }

    // Format data for the chart
    const chartData = data.map(q => ({
        name: `Q${q.quarter}`,
        Planned: q.planned_hours,
        Actual: q.actual_hours,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: "#ddd" }}
                    axisLine={{ stroke: "#ddd" }}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: "#ddd" }}
                    axisLine={{ stroke: "#ddd" }}
                    tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                    }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar
                    dataKey="Planned"
                    name="Planned Hours"
                    fill="#1e40af"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="Actual"
                    name="Actual Hours"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}