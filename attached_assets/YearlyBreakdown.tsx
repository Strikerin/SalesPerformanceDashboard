import { useLocation } from "wouter";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { Skeleton } from "./ui/skeleton";
import { useYearlyData } from "@/hooks/useWorkHistoryData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuarterlyHoursChart from "./charts/QuarterlyHoursChart";
import OverrunCostChart from "./charts/OverrunCostChart";
import OverrunsTab from "./tabs/OverrunsTab";
import NCRSummaryTab from "./tabs/NCRSummaryTab";
import WorkCentersTab from "./tabs/WorkCentersTab";
import RepeatNCRTab from "./tabs/RepeatNCRTab";
import AdjustmentsTab from "./tabs/AdjustmentsTab";
import { YearlySummary, QuarterlySummary, WorkcenterSummary, NCRSummary, RepeatNCRFailure } from "@/types/workHistory";

interface QuarterlyData {
  quarter: string;
  planned_hours: number;
  actual_hours: number;
  overrun_hours: number;
  overrun_cost: number;
  total_jobs: number;
}

interface YearData {
  summary: {
    total_planned_hours: number;
    total_actual_hours: number;
    total_overrun_hours: number;
    total_ncr_hours: number;
    total_planned_cost: number;
    total_actual_cost: number;
    opportunity_cost_dollars: number;
    total_jobs: number;
    total_operations: number;
    total_unique_parts: number;
    planning_accuracy?: number;
  };
  quarterly_summary: QuarterlyData[];
  top_overruns: {
    job_number: string;
    part_name: string;
    work_center: string;
    task_description: string;
    planned_hours: number;
    actual_hours: number;
    overrun_hours: number;
    overrun_cost: number;
  }[];
  workcenter_summary: {
    work_center: string;
    job_count: number;
    planned_hours: number;
    actual_hours: number;
    overrun_hours: number;
    overrun_cost: number;
    utilization?: number;
  }[];
  ncr_summary: {
    job_number: string;
    part_name: string;
    work_center: string;
    failure_reason: string;
    planned_hours: number;
    actual_hours: number;
    overrun_hours: number;
    overrun_cost: number;
  }[];
  repeat_ncr_failures?: {
    part_name: string;
    total_failures: number;
    total_cost: number;
    total_hours: number;
    failure_rate: number;
    affected_jobs: string[];
  }[];
  job_adjustments?: any[];
  part_overruns?: any[];
  part_task_details?: any[];
  ncr_averages?: {
    avg_ncr_cost_per_year: number;
    avg_parts_with_ncr_per_year: number;
  };
}

interface YearlySummaryTableProps {
  data: YearlySummary[];
  onYearClick: (year: string) => void;
}

export default function YearlyBreakdown() {
  const [_, navigate] = useLocation();
  const { data: yearlyData, isLoading } = useYearlyData();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!yearlyData || yearlyData.length === 0) {
    return <EmptyState />;
  }

  // Sort data by year in descending order (newest first)
  const sortedData = [...yearlyData].sort((a, b) => parseInt(b.year) - parseInt(a.year));
  const currentYearData = sortedData[0] as YearData;

  if (!currentYearData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <YearlySummaryTable data={sortedData} onYearClick={year => navigate(`/workhistory/year/${year}`)} />

      {/* Quarterly Breakdown */}
      {currentYearData.quarterly_summary?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quarterly Breakdown</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quarter</TableHead>
                    <TableHead className="text-right">Planned Hours</TableHead>
                    <TableHead className="text-right">Actual Hours</TableHead>
                    <TableHead className="text-right">Overrun Hours</TableHead>
                    <TableHead className="text-right">Overrun Cost</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentYearData.quarterly_summary.map((q: QuarterlyData) => (
                    <TableRow key={q.quarter}>
                      <TableCell>{q.quarter}</TableCell>
                      <TableCell className="text-right">{formatNumber(q.planned_hours)}</TableCell>
                      <TableCell className="text-right">{formatNumber(q.actual_hours)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatNumber(q.overrun_hours)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatMoney(q.overrun_cost)}</TableCell>
                      <TableCell className="text-right">{formatNumber(q.total_jobs, 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Analysis Sections */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="overruns">
            <TabsList className="mb-4">
              <TabsTrigger value="overruns">🔥 Overruns</TabsTrigger>
              <TabsTrigger value="ncr">⚠️ NCR Summary</TabsTrigger>
              <TabsTrigger value="workcenters">🏭 Work Centers</TabsTrigger>
              <TabsTrigger value="repeat-ncr">🔁 Repeat NCRs</TabsTrigger>
              <TabsTrigger value="adjustments">🛠 Adjustments</TabsTrigger>
            </TabsList>

            <TabsContent value="overruns">
              <OverrunsTab data={currentYearData.top_overruns || []} />
            </TabsContent>

            <TabsContent value="ncr">
              <NCRSummaryTab
                data={currentYearData.ncr_summary || []}
                averages={currentYearData.ncr_averages || {}}
              />
            </TabsContent>

            <TabsContent value="workcenters">
              <WorkCentersTab
                data={currentYearData.workcenter_summary || []}
                summary={{
                  most_used_work_center: currentYearData.workcenter_summary?.sort((a, b) => b.actual_hours - a.actual_hours)[0]?.work_center || 'N/A',
                  highest_overrun_work_center: currentYearData.workcenter_summary?.sort((a, b) => b.overrun_hours - a.overrun_hours)[0]?.work_center || 'N/A',
                  avg_utilization: currentYearData.workcenter_summary?.reduce((sum, wc) => sum + (wc.actual_hours / wc.planned_hours * 100), 0) / (currentYearData.workcenter_summary?.length || 1)
                }}
              />
            </TabsContent>

            <TabsContent value="repeat-ncr">
              <RepeatNCRTab data={currentYearData.repeat_ncr_failures || []} />
            </TabsContent>

            <TabsContent value="adjustments">
              <AdjustmentsTab
                jobAdjustments={currentYearData.job_adjustments || []}
                partOverruns={currentYearData.part_overruns || []}
                taskDetails={currentYearData.part_task_details || []}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      {currentYearData.quarterly_summary?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <QuarterlyHoursChart data={currentYearData.quarterly_summary} />
              </div>
              <div className="h-[300px]">
                <OverrunCostChart data={currentYearData.quarterly_summary} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Utility Components
function LoadingSkeleton() {
  return (
    <Card className="shadow mb-6">
      <CardContent className="p-4">
        <Skeleton className="w-full h-[300px]" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="shadow mb-6">
      <CardContent className="p-4 text-center">
        <p className="text-gray-500">No yearly data available</p>
      </CardContent>
    </Card>
  );
}

function YearlySummaryTable({ data, onYearClick }: YearlySummaryTableProps) {
  return (
    <Card className="shadow">
      <CardContent className="p-4">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Year</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">Parts</TableHead>
                <TableHead className="text-right">Planned Hours</TableHead>
                <TableHead className="text-right">Actual Hours</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((year) => (
                <TableRow
                  key={year.year}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => onYearClick(year.year)}
                >
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {year.companies && Array.isArray(year.companies)
                        ? year.companies.join(", ")
                        : "No companies"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(year.job_count)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.unique_parts || 0)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.planned_hours)}</TableCell>
                  <TableCell className="text-right">{formatNumber(year.actual_hours)}</TableCell>
                  <TableCell className="text-right">{formatMoney(year.actual_cost || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
