import type { ServiceId } from './services.js';

export type RequestCategoryId = 'consultation' | ServiceId;
export const defaultCategoryId: 'consultation';
export const requestCategories: ReadonlyArray<{ id: RequestCategoryId; title: string }>;
export function normalizeCategory(value: unknown): { id: RequestCategoryId; title: string } | null;
export function normalizePhone(value: unknown): string | null;
