import { redirect } from 'next/navigation';

/**
 * Redirect legacy /company-profile URL to /settings (company tab).
 * Keeps old bookmarks working.
 */
export default function CompanyProfileRedirect() {
    redirect('/settings');
}
