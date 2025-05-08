import React from 'react';
import { useLocation, Link as WouterLink } from 'wouter';

// Adapter for react-router-dom's useParams to work with wouter
export function useParams<T extends Record<string, string>>(): T {
  const [location] = useLocation();
  const params = {} as T;
  
  // Extract parameters from the URL path
  // This is a simplified version and might need to be enhanced
  // based on your specific route patterns
  const pathSegments = location.split('/');
  
  if (pathSegments.length >= 3 && pathSegments[1] === 'workhistory') {
    if (pathSegments[2] === 'year' && pathSegments.length >= 4) {
      params['year' as keyof T] = pathSegments[3] as T[keyof T];
    }
    else if (pathSegments[2] === 'metric' && pathSegments.length >= 4) {
      params['metric' as keyof T] = pathSegments[3] as T[keyof T];
    }
  }
  
  return params;
}

// Adapter for react-router-dom's Link to work with wouter
export function Link(props: React.ComponentProps<typeof WouterLink>) {
  return <WouterLink {...props} />;
}

// Adapter for react-router-dom's useNavigate to work with wouter
export function useNavigate() {
  const [_, navigate] = useLocation();
  return navigate;
} 