export function normalizeAgentStatus(value) {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const normalized = value.trim().toLowerCase().replace(/[\s_]+/g, '-');

  switch (normalized) {
    case 'queued':
    case 'in-progress':
    case 'blocked':
    case 'ready-for-review':
      return normalized;
    default:
      return 'unknown';
  }
}
