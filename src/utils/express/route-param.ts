/**
 * Normalize Express route param to a single string (Express 5 types allow string[]).
 */
export const routeParam = (value: string | string[] | undefined): string => {
  if (value === undefined) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
};
