import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import { FilterProvider } from "@/context/FilterContext";

// Import our work history components
import WorkHistoryDashboard from './components/WorkHistoryDashboard';
import WorkHistoryYear from './components/WorkHistoryYear';
import MetricDetail from './components/MetricDetail';

// Simple NotFound page
const NotFound = () => (
  <div className="p-5 text-center">
    <h2>Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
);

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workhistory" component={WorkHistoryDashboard} />
      <Route path="/workhistory/year/:year" component={WorkHistoryYear} />
      <Route path="/workhistory/metric/:metric" component={MetricDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </FilterProvider>
    </QueryClientProvider>
  );
}

export default App;
