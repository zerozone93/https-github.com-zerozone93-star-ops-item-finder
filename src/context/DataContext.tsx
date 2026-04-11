import React, { createContext, useContext } from 'react';
import { useGameData } from '../utils/dataUtils';
import type { StarCitizenData } from '../types';

interface DataContextValue {
  data: StarCitizenData | null;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue>({ data: null, loading: true, error: null });

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useGameData();
  return <DataContext.Provider value={{ data, loading, error }}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  return useContext(DataContext);
}
