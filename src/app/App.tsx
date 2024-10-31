import './App.css';

import { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRouter } from '@/app/Router';
import { Loader, Toaster } from '@/components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Suspense fallback={<Loader />}>
          <AppRouter />
          <Toaster />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export default App;
