import { useState, useEffect } from 'react';
import type { StarCitizenData } from '../types';

export function useGameData() {
  const [data, setData] = useState<StarCitizenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}star-citizen-data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        return res.json() as Promise<StarCitizenData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

export function getByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  return ids.map((id) => items.find((item) => item.id === id)).filter((item): item is T => item !== undefined);
}

export function formatRiskLevel(level: string): string {
  const map: Record<string, string> = {
    safe: 'Safe',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    extreme: 'Extreme Risk',
  };
  return map[level] ?? level;
}

export function formatRarity(rarity: string): string {
  const map: Record<string, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    very_rare: 'Very Rare',
  };
  return map[rarity] ?? rarity;
}

export function formatObtainMethod(method: string): string {
  const map: Record<string, string> = {
    buy: 'Purchase',
    craft: 'Craft',
    loot: 'Loot',
    mission_reward: 'Mission Reward',
    rent: 'Rent',
    pledge: 'Pledge',
    research: 'Research',
  };
  return map[method] ?? method;
}

export function searchItems<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (typeof val === 'string') return val.toLowerCase().includes(lower);
      return false;
    })
  );
}
