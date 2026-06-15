/** Map Prisma / Postgres errors to user-friendly API messages. */
export function toUserFacingDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? 'Database error');

  if (message.includes("Can't reach database server") || message.includes('P1001')) {
    return 'Database is waking up or temporarily unreachable. Wait a few seconds and try again.';
  }

  if (message.includes('P1000') || message.includes('authentication failed')) {
    return 'Database authentication failed. Check DATABASE_URL in your environment settings.';
  }

  if (message.includes('P2003') || message.includes('Foreign key constraint')) {
    return 'Your session is invalid. Please log out and sign in again.';
  }

  if (message.includes('P2021') || message.includes('does not exist')) {
    return 'Database tables are missing. Run: npx prisma db push';
  }

  return message || 'Database request failed.';
}
