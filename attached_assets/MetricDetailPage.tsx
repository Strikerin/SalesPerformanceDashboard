import { useRoute } from 'wouter';
import MetricDetail from '@/components/MetricDetail';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MetricDetailPage() {
  const [match, params] = useRoute('/workhistory/metric/:metric');
  const metric = params?.metric || '';

  if (!metric) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No metric specified</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MetricDetail metric={metric} />
    </div>
  );
} 