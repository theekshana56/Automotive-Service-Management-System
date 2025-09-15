import nodemailer from 'nodemailer';

const {
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_FROM
} = process.env;

// Configure transporter for SMTP only when properly configured
let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    // Determine secure flag: use SSL when port 465 or when explicitly configured
    const portNum = Number(SMTP_PORT || 0);
    const secureFlag = process.env.SMTP_SECURE === 'true' || portNum === 465;

    // Common base options
    const baseOpts = {
      host: SMTP_HOST,
      port: portNum || 587,
      secure: secureFlag,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    };

    // Add sensible TLS options for common providers
    if (SMTP_HOST === 'smtp.gmail.com') {
      transporter = nodemailer.createTransport({
        ...baseOpts,
        requireTLS: true,
        tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' }
      });
    } else if (SMTP_HOST === 'smtp.mailtrap.io') {
      transporter = nodemailer.createTransport({
        ...baseOpts,
        port: portNum || 2525,
        tls: { rejectUnauthorized: false }
      });
    } else {
      transporter = nodemailer.createTransport({
        ...baseOpts,
        tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' }
      });
    }

    // Skip verification to prevent timeouts and crashes
    console.log(`ℹ️ SMTP transporter created (${SMTP_HOST}:${baseOpts.port}) - verification skipped`);
  } catch (error) {
    console.warn('⚠️ Failed to create SMTP transporter:', error.message);
    transporter = null;
  }
} else {
  console.log('ℹ️ SMTP not configured (SMTP_HOST/USER/PASS missing) – email notifications disabled');
}

async function sendMail({ to, subject, html }) {
  try {
    if (!transporter) {
      console.log('📭 Email send skipped (SMTP not configured)');
      return null;
    }
    const from = ALERT_FROM || 'noreply@yourapp.local';
    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Using SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
    // Try once, if it fails attempt a single retry after a short delay
    try {
      const result = await transporter.sendMail({ from, to, subject, html });
      console.log(`✅ Email sent successfully to: ${to}`);
      return result;
    } catch (firstErr) {
      console.warn('⚠️ First sendMail attempt failed:', firstErr && firstErr.message ? firstErr.message : firstErr);
      if (firstErr && firstErr.stack) console.warn(firstErr.stack);
      // small retry
      await new Promise((r) => setTimeout(r, 800));
      const retryResult = await transporter.sendMail({ from, to, subject, html });
      console.log(`✅ Email sent successfully on retry to: ${to}`);
      return retryResult;
    }
  } catch (error) {
    console.error(`❌ Email sending failed:`, error && error.message ? error.message : error);
    if (error && error.stack) console.error(error.stack);
    // Don't throw error, just return null to prevent crashes
    return null;
  }
}

export { sendMail };
