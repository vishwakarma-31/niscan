const { sendEmail } = require('../config/mailer');


async function sendPolicyCreatedEmail(policy, downloadUrl) {
  const customerName = policy.customer_name || 'Valued Customer';
  const statusBadge =
    policy.status === 'active'
      ? '<span style="background:#22c55e;color:#fff;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:600;">Active</span>'
      : '<span style="background:#eab308;color:#000;padding:2px 12px;border-radius:9999px;font-size:12px;font-weight:600;">Pending</span>';

  const subject =
    policy.policy_number
      ? `Your Policy is Ready — ${policy.policy_number} | Nicsan CRM`
      : 'Your Insurance Policy Has Been Processed | Nicsan CRM';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0f1a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#f59e0b;letter-spacing:-0.02em;">Nicsan CRM</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;">Insurance Policy Management</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-top:4px solid #f59e0b;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Your Insurance Policy Has Been Processed</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;">Dear ${customerName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Your insurance policy has been successfully uploaded and processed in our system. Please find your policy details below.</p>

              <!-- Policy Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#f8fafc;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr>
                  <td colspan="2" style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Policy Details</p>
                  </td>
                </tr>

                ${policy.policy_number ? `
                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Policy Number</p>
                  </td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;font-family:monospace;">${policy.policy_number}</p>
                  </td>
                </tr>` : ''}

                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Customer Name</p>
                  </td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">${policy.customer_name || 'N/A'}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Vehicle Number</p>
                  </td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;font-family:monospace;">${policy.vehicle_number || 'N/A'}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Insurer</p>
                  </td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">${policy.insurer || 'N/A'}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Premium Amount</p>
                  </td>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">${policy.premium ? '₹' + Number(policy.premium).toLocaleString('en-IN') : 'N/A'}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 20px;background:#f1f5f9;width:40%;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">Status</p>
                  </td>
                  <td style="padding:12px 20px;">
                    ${statusBadge}
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display:inline-block;background:#f59e0b;color:#0a0f1a;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
                      Download Your Policy PDF
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">This download link is valid for 24 hours. If you need a new link, please contact your administrator.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-align:center;">This is an automated notification from Nicsan CRM.</p>
              <p style="margin:0 0 4px;font-size:13px;color:#64748b;text-align:center;">For queries contact <a href="tel:+919686449289" style="color:#f59e0b;text-decoration:none;">+91 9686449289</a></p>
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Nicsan Insurance Marketing LLP</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    if (!policy.customer_email) {
      console.log(`no email for policy ${policy.id}`);
      return;
    }
    await sendEmail({ to: policy.customer_email, subject, html });
    console.log(`email sent to ${policy.customer_email}`);
  } catch (err) {
    console.error(`email error:`, err.message);
    // don't crash if email fails
  }
}

module.exports = { sendPolicyCreatedEmail };