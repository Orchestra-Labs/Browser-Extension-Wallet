import './App.css';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouter } from '@/app/Router';
import { Loader, Toaster } from '@/components';
import { AuthProvider } from '@/guards';
import { DataProvider } from '@/data';

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
      <AuthProvider>
        <DataProvider />
        <MemoryRouter>
          <Suspense fallback={<Loader />}>
            <AppRouter />
            <Toaster />
          </Suspense>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
