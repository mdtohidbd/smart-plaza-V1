/**
 * Formats a date string or object to DD/MM/YYYY format.
 * @param {string|Date} dateInput - The date to format
 * @param {boolean} includeTime - Whether to include hours and minutes
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';

  if (includeTime) {
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};
