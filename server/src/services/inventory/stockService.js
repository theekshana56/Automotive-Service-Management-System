import Part from '../../models/inventory/Part.js';
import Notification from '../../models/inventory/Notification.js';
import { sendMail } from './emailService.js';

const ALERT_TO = process.env.ALERT_TO || '';
const ALERT_MIN_INTERVAL_HOURS = Number(process.env.ALERT_MIN_INTERVAL_HOURS || 12);

// Socket.IO emitter is injected at runtime
let ioInstance = null;
export function setIo(io) { 
  ioInstance = io; 
}

/**
 * Returns { isLow, reason }
 */
function evaluateLowStock(part) {
  const stock = part.stock || {};
  const available = Math.max(0, (stock.onHand || 0) - (stock.reserved || 0));
  if (available <= (stock.reorderLevel || 0)) {
    return { isLow: true, reason: `Available ${available} ≤ Reorder ${stock.reorderLevel}` };
  }
  return { isLow: false, reason: '' };
}

function canSendAlert(lastAlertedAt) {
  if (!lastAlertedAt) return true;
  
  const hours = parseInt(process.env.ALERT_MIN_INTERVAL_HOURS || "12", 10);
  const cooldownMs = hours * 60 * 60 * 1000;
  const now = new Date();
  
  return (now - lastAlertedAt) >= cooldownMs;
}

async function createInAppNotification(part, message) {
  // Prevent duplicate notifications for the same part
  const existing = await Notification.findOne({
    type: 'LOW_STOCK',
    'meta.partId': part._id
  });
  if (existing) return existing;

  const notif = await Notification.create({
    type: 'LOW_STOCK',
    title: `Low stock: ${part.name} (${part.partCode})`,
    message,
    link: '/parts?lowStock=1',
    meta: { partId: part._id, partCode: part.partCode }
  });
  if (ioInstance) ioInstance.emit('notification:new', notif);
  return notif;
}

async function sendLowStockEmail(part, message) {
  if (!ALERT_TO) return;
  
  // Check if SMTP is properly configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('ℹ️ SMTP not configured, skipping email alert');
    return;
  }
  
  try {
    const stock = part.stock || {};
    const available = Math.max(0, (stock.onHand || 0) - (stock.reserved || 0));
    const reorder = stock.reorderLevel || 0;
    const subject = `Low Stock Alert: ${part.name} (${part.partCode})`;
    const html = `
      <h3>${subject}</h3>
      <p><strong>⚠️ Low Stock Alert</strong></p>
      <p><strong>Available:</strong> ${available} | <strong>Reorder Level:</strong> ${reorder}</p>
      <ul>
        <li><strong>Part Name:</strong> ${part.name}</li>
        <li><strong>Part Code:</strong> ${part.partCode}</li>
        <li><strong>Quantity On Hand:</strong> ${stock.onHand || 0}</li>
        <li><strong>Reserved:</strong> ${stock.reserved || 0}</li>
        <li><strong>Category:</strong> ${part.category || 'General'}</li>
      </ul>
      <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/parts?lowStock=1">
        Open Low-Stock List
      </a></p>
    `;
    const result = await sendMail({ to: ALERT_TO, subject, html });
    if (result) {
      console.log(`📧 Low-stock email sent for ${part.name}`);
    } else {
      console.log(`📧 Low-stock email failed for ${part.name} (SMTP not available)`);
    }
  } catch (err) {
    console.error(`❌ Failed to send low-stock email for ${part.name}:`, err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    // Don't crash the process, just log the error
  }
}

/**
 * Check one part and generate alerts if needed.
 * Returns { alerted: boolean, low: boolean }
 */
export async function checkPartForLowStock(partId) {
  const part = await Part.findById(partId);
  if (!part || !part.isActive) return { alerted: false, low: false };

  const { isLow, reason } = evaluateLowStock(part);
  if (!isLow) return { alerted: false, low: false };

  // Check cooldown for alerts
  if (!canSendAlert(part.lastAlertedAt)) {
    console.log(
      `⏰ Skipping alert for ${part.name} — last sent at ${part.lastAlertedAt}`
    );
    return { alerted: false, low: true }; // Still low, but no alert sent
  }

  const stock = part.stock || {};
  const available = Math.max(0, (stock.onHand || 0) - (stock.reserved || 0));
  const reorder = stock.reorderLevel || 0;
  const message = `⚠️ Low Stock Alert: ${part.name} (Code: ${part.partCode})
Available: ${available} | Reorder Level: ${reorder}`;

  // Send in-app notification
  await createInAppNotification(part, message);

  // Send email
  try {
    await sendLowStockEmail(part, message);
  } catch (emailErr) {
          console.warn(`⚠️ Email failed for ${part.name}:`, emailErr && emailErr.message ? emailErr.message : emailErr);
          if (emailErr && emailErr.stack) console.warn(emailErr.stack);
    // Continue with other notifications even if email fails
  }

  // Update last alerted timestamp
  part.lastAlertedAt = new Date();
  await part.save();

  // push to live low-stock stream
  if (ioInstance) ioInstance.emit('stock:low', { partId: String(part._id) });

  console.log(`🔔 Alert sent for ${part.name} (${part.partCode})`);
  return { alerted: true, low: true };
}

/**
 * Scan all parts for low stock (cron job).
 */
export async function scanAllPartsForLowStock() {
  try {
    const parts = await Part.find({ isActive: true });
    console.log(`🔍 Scanning ${parts.length} active parts for low stock...`);
    
    for (const part of parts) {
      try {
        const { isLow } = evaluateLowStock(part);
        if (!isLow) continue;

        // Check cooldown for alerts
        if (!canSendAlert(part.lastAlertedAt)) {
          console.log(
            `⏰ Skipping alert for ${part.name} — last sent at ${part.lastAlertedAt}`
          );
          continue; // Skip this part, try next one
        }

        const stock = part.stock || {};
        const available = Math.max(0, (stock.onHand || 0) - (stock.reserved || 0));
        const reorder = stock.reorderLevel || 0;
        const message = `⚠️ Low Stock Alert: ${part.name} (Code: ${part.partCode})
Available: ${available} | Reorder Level: ${reorder}`;

        // Send in-app notification
        await createInAppNotification(part, message);

        // Send email
        try {
          await sendLowStockEmail(part, message);
        } catch (emailErr) {
          console.warn(`⚠️ Email failed for ${part.name}:`, emailErr.message);
          // Continue with other notifications even if email fails
        }

        // Update last alerted timestamp
        part.lastAlertedAt = new Date();
        await part.save();

        if (ioInstance) ioInstance.emit('stock:low', { partId: String(part._id) });
        
        console.log(`🔔 Alert sent for ${part.name} (${part.partCode})`);
      } catch (partErr) {
        console.error(`❌ Error processing part ${part.partCode}:`, partErr.message);
        // Continue with next part instead of crashing
      }
    }
    
    console.log('✅ Low-stock scan completed');
  } catch (err) {
    console.error('❌ Low-stock scan failed:', err.message);
    // Don't crash the server, just log the error
  }
}

export { evaluateLowStock };