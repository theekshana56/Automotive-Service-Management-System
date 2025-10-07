import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { sendMail } from '../utils/email.js';

// Send notifications to all available mechanics for a new service request
export async function sendMechanicNotifications(requestId) {
  try {
    console.log(`🔔 Starting notification process for request ${requestId}`);

    // Get the service request details
    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('assignedMechanic', 'name email phone');

    if (!serviceRequest) {
      console.error(`❌ Service request ${requestId} not found`);
      return { success: false, error: 'Service request not found' };
    }

    // Find all available mechanics
    const mechanics = await User.find({
      role: 'mechanic',
      isAvailable: true,
      email: { $exists: true, $ne: '' }
    }).select('name email phone location');

    console.log(`📧 Found ${mechanics.length} available mechanics to notify`);

    if (mechanics.length === 0) {
      console.log('⚠️ No available mechanics found to notify');
      return { success: true, notified: 0, message: 'No available mechanics to notify' };
    }

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Send notification to each mechanic
    for (const mechanic of mechanics) {
      try {
        const notificationResult = await sendServiceRequestNotification(mechanic, serviceRequest);
        if (notificationResult.success) {
          successCount++;
          results.push({
            mechanic: mechanic.name,
            email: mechanic.email,
            status: 'success'
          });
        } else {
          failureCount++;
          results.push({
            mechanic: mechanic.name,
            email: mechanic.email,
            status: 'failed',
            error: notificationResult.error
          });
        }
      } catch (error) {
        console.error(`❌ Failed to notify mechanic ${mechanic.email}:`, error.message);
        failureCount++;
        results.push({
          mechanic: mechanic.name,
          email: mechanic.email,
          status: 'error',
          error: error.message
        });
      }
    }

    // Update the service request with notification results
    serviceRequest.notificationsSent = true;
    serviceRequest.notificationCount = mechanics.length;
    serviceRequest.notificationResults = results;
    await serviceRequest.save();

    console.log(`✅ Notification process completed:`);
    console.log(`   📧 Total mechanics: ${mechanics.length}`);
    console.log(`   ✅ Successful notifications: ${successCount}`);
    console.log(`   ❌ Failed notifications: ${failureCount}`);

    return {
      success: true,
      total: mechanics.length,
      successful: successCount,
      failed: failureCount,
      results: results
    };

  } catch (error) {
    console.error('❌ Error in sendMechanicNotifications:', error);
    return { success: false, error: error.message };
  }
}

// Send individual notification to a mechanic
async function sendServiceRequestNotification(mechanic, serviceRequest) {
  try {
    const subject = `🚗 New Service Request: ${serviceRequest.serviceType}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Service Request Available</h2>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Service Details:</h3>
          <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
          <p><strong>Urgency:</strong>
            <span style="color: ${getUrgencyColor(serviceRequest.urgency)};">
              ${serviceRequest.urgency.charAt(0).toUpperCase() + serviceRequest.urgency.slice(1)}
            </span>
          </p>
          <p><strong>Problem:</strong> ${serviceRequest.problemDescription}</p>
          <p><strong>Location:</strong> ${serviceRequest.location?.address?.city || 'Location provided'}</p>
          <p><strong>Customer:</strong> ${serviceRequest.customerName}</p>
          <p><strong>Phone:</strong> ${serviceRequest.customerPhone}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Action Required:</strong> Please accept or decline this service request.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mechanic/dashboard?action=accept&requestId=${serviceRequest._id}"
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ✅ Accept Job
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mechanic/dashboard?action=decline&requestId=${serviceRequest._id}"
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            ❌ Decline Job
          </a>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mechanic/dashboard"
             style="background-color: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Full Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification from the Automotive Service Management System.
          If you have any questions, please contact support.
        </p>
      </div>
    `;

    const textContent = `
      New Service Request Available

      Service Details:
      - Service Type: ${serviceRequest.serviceType}
      - Urgency: ${serviceRequest.urgency}
      - Problem: ${serviceRequest.problemDescription}
      - Location: ${serviceRequest.location?.address?.city || 'Location provided'}
      - Customer: ${serviceRequest.customerName}
      - Phone: ${serviceRequest.customerPhone}

      Please check your mechanic dashboard to accept or decline this request.

      View in Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/mechanic/dashboard
    `;

    const emailResult = await sendMail({
      to: mechanic.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    console.log(`📧 Notification sent to ${mechanic.name} (${mechanic.email})`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Failed to send notification to ${mechanic.email}:`, error);
    return { success: false, error: error.message };
  }
}

// Send SMS notification (placeholder for future implementation)
export async function sendSMSNotification(phoneNumber, message) {
  // TODO: Implement SMS sending using Twilio or similar service
  console.log(`📱 SMS to ${phoneNumber}: ${message}`);
  return { success: true, message: 'SMS sending not implemented yet' };
}

// Send push notification (placeholder for future implementation)
export async function sendPushNotification(userId, title, message) {
  // TODO: Implement push notifications using Firebase or similar service
  console.log(`🔔 Push notification to ${userId}: ${title} - ${message}`);
  return { success: true, message: 'Push notifications not implemented yet' };
}

// Lightweight in-app event emitter via Socket.IO
let ioInstance = null;
export function setNotifier(io){ ioInstance = io; }
export function notifyUserEmail(email, event, payload){
  if (!ioInstance) return;
  ioInstance.emit(event, { email, ...payload });
}
export function emitToUser(email, event, payload){
  if (!ioInstance || !email) return;
  const trimmed = email.trim().toLowerCase();
  ioInstance.to(trimmed).emit(event, payload);
}
export function emitToRole(role, event, payload){
  if (!ioInstance || !role) return;
  const room = `role:${role.toLowerCase()}`;
  ioInstance.to(room).emit(event, payload);
}

// Helper function to get urgency color for email
function getUrgencyColor(urgency) {
  switch (urgency) {
    case 'emergency': return '#dc2626'; // red-600
    case 'urgent': return '#d97706'; // amber-600
    case 'normal': return '#2563eb'; // blue-600
    default: return '#6b7280'; // gray-500
  }
}

// Send notification when mechanic is assigned to a job
export async function sendAssignmentNotification(mechanicId, serviceRequest) {
  try {
    const mechanic = await User.findById(mechanicId);
    if (!mechanic || !mechanic.email) {
      console.log(`⚠️ Mechanic ${mechanicId} not found or has no email`);
      return { success: false, error: 'Mechanic not found or no email' };
    }

    const subject = `✅ Job Assigned: ${serviceRequest.serviceType}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Congratulations! Job Assigned</h2>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">Job Details:</h3>
          <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
          <p><strong>Customer:</strong> ${serviceRequest.customerName}</p>
          <p><strong>Phone:</strong> ${serviceRequest.customerPhone}</p>
          <p><strong>Location:</strong> ${serviceRequest.location?.address?.city || 'Location provided'}</p>
          <p><strong>Problem:</strong> ${serviceRequest.problemDescription}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/mechanic/dashboard"
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Job Details
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Please contact the customer as soon as possible to arrange service.
        </p>
      </div>
    `;

    await sendMail({
      to: mechanic.email,
      subject: subject,
      html: htmlContent,
      text: `Job Assigned!\n\nService: ${serviceRequest.serviceType}\nCustomer: ${serviceRequest.customerName}\nPhone: ${serviceRequest.customerPhone}\n\nPlease check your dashboard for details.`
    });

    console.log(`✅ Assignment notification sent to ${mechanic.name}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending assignment notification:', error);
    return { success: false, error: error.message };
  }
}

// Send notification to customer when mechanic is assigned
export async function sendCustomerNotification(serviceRequest) {
  try {
    if (!serviceRequest.customerEmail) {
      console.log('⚠️ No customer email provided');
      return { success: false, error: 'No customer email' };
    }

    const subject = `🚗 Mechanic Assigned: ${serviceRequest.serviceType}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Great News! Mechanic Assigned</h2>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">Your Service Details:</h3>
          <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
          <p><strong>Mechanic:</strong> ${serviceRequest.assignedMechanic?.name || 'Assigned mechanic'}</p>
          <p><strong>Phone:</strong> ${serviceRequest.assignedMechanic?.phone || 'Contact information provided'}</p>
        </div>

        <p>Your mechanic will contact you shortly to arrange the service appointment.</p>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Next Steps:</strong> Wait for your mechanic to contact you, or you can reach out directly using the contact information above.
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: serviceRequest.customerEmail,
      subject: subject,
      html: htmlContent,
      text: `Mechanic Assigned!\n\nService: ${serviceRequest.serviceType}\nMechanic: ${serviceRequest.assignedMechanic?.name || 'Assigned mechanic'}\nPhone: ${serviceRequest.assignedMechanic?.phone || 'Contact information provided'}\n\nYour mechanic will contact you soon.`
    });

    console.log(`✅ Customer notification sent to ${serviceRequest.customerEmail}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending customer notification:', error);
    return { success: false, error: error.message };
  }
}
