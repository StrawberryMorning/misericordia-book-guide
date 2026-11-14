export const ADMIN_EMAILS: string[] = [
  'quebragelo@proton.me',
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase(),
].filter(Boolean);

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(cleanEmail);
}
