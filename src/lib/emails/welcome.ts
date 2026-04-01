export function welcomeEmail(params: { displayName?: string; dashboardUrl: string }): {
	subject: string;
	html: string;
} {
	const { displayName, dashboardUrl } = params;
	const greeting = displayName ? `Hi ${displayName}` : 'Welcome';

	return {
		subject: 'Welcome to Polyglot',
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#4f46e5;">Polyglot</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#111827;">${greeting}!</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#374151;">
                Your account is ready. Here's how to get started:
              </p>
              <ol style="margin:16px 0;padding-left:20px;font-size:14px;line-height:1.8;color:#374151;">
                <li><strong>Create your workspace</strong> — organize your team and projects</li>
                <li><strong>Invite your team</strong> — add members and assign roles</li>
                <li><strong>Upgrade to Pro</strong> — unlock API keys, higher limits, and more</li>
              </ol>
              <div style="text-align:center;margin:28px 0;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                  Go to Dashboard
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                Sent by Polyglot
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
	};
}
