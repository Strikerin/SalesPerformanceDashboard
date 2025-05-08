import { formatMoney } from "@/lib/formatters";
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
    quarter: number;
    overrun_cost: number;
}

interface ChartProps {
    data: QuarterlyData[];
}

export default function OverrunCostChart({ data }: ChartProps) {
    if (!data?.length) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                No overrun data available
            </div>
        );
    }

    // Format data for the chart
    const chartData = data.map(q => ({
        name: `Q${q.quarter}`,
        Overrun: q.overrun_cost,
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
                    tickFormatter={(value) => formatMoney(value)}
                />
                <Tooltip
                    formatter={(value: number) => formatMoney(value)}
                    contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid #ddd",
                    }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar
                    dataKey="Overrun"
                    name="Overrun Cost"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}