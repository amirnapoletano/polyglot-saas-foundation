export function inviteEmail(params: {
	orgName: string;
	inviterName: string;
	role: string;
	acceptUrl: string;
}): { subject: string; html: string } {
	const { orgName, inviterName, role, acceptUrl } = params;

	return {
		subject: `You've been invited to ${orgName}`,
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
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827;">You're invited to join</h1>
              <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#4f46e5;">${orgName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${acceptUrl}" style="display:inline-block;padding:12px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                  Accept Invitation
                </a>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
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
