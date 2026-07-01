/**
 * The single app-wide date format: "June 02, 2026" — long month, zero-padded
 * day, numeric year, locale-independent. Used everywhere a calendar date is
 * shown (reports, exports) so the app never falls back to the ambiguous
 * locale default like "7/1/2025". Relative labels ("5 min ago") are a separate
 * concern and stay as they are.
 */
export function formatDate(value: number | Date): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}
