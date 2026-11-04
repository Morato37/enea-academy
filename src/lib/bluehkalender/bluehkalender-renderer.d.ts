/** Type definitions for bluehkalender-renderer.js */

export interface BluehkalenderOptions {
  title: string;
  centerText: string;
  showLogo: boolean;
  showPlantList: boolean;
  showMonths: boolean;
  showFauna: boolean;
  showSide: boolean;
  showClimate: boolean;
}

export interface BluehkalenderClimate {
  loc: string;
  tmax: number[];
  tmin: number[];
  prec: number[];
  wind: number[];
  th: { frost: number; warm: number; wet: number; windy: number };
}

export type MonthEntry = null | ['f', string] | ['b', string] | ['b', string, string];

export interface CalendarPlant {
  id?: number | string;
  bot: string;
  en: string;
  bloom: string;
  leaf: string;
  traits?: string[];
  rem?: string;
  m: MonthEntry[];
}

export interface BluehkalenderData {
  plants: CalendarPlant[];
  climate?: Partial<BluehkalenderClimate>;
  options?: Partial<BluehkalenderOptions>;
}

export const DEFAULT_OPTIONS: BluehkalenderOptions;
export const DEFAULT_CLIMATE: BluehkalenderClimate;
export const MONTHS: string[];
export const TRAITS: { key: string; icon: string; de: string; month?: string; re: RegExp }[];
export const POSTER_WIDTH: number;
export const POSTER_HEIGHT: number;

export function bluehkalenderReady(): Promise<void>;
export function renderBluehkalender(
  canvas: HTMLCanvasElement,
  data: BluehkalenderData,
  scale?: number
): HTMLCanvasElement;
export function plantFromDb(row: Record<string, unknown>): CalendarPlant;
export function monthEntry(c1: string | null | undefined, c2: string | null | undefined): MonthEntry;
