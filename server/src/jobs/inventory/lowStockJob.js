import cron from 'node-cron';

const { scanAllPartsForLowStock } = require('../services/stockService');

/**
 * Schedule the low-stock scanning job
 * Runs every 15 minutes to check all parts for low stock conditions
 */
function scheduleLowStockScan() {
  try {
    // Schedule job to run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('🔄 Running scheduled low-stock scan...');
        const startTime = Date.now();
        
        await scanAllPartsForLowStock();
        
        const duration = Date.now() - startTime;
        console.log(`✅ Scheduled low-stock scan completed in ${duration}ms`);
      } catch (err) {
        console.error('❌ Scheduled low-stock scan failed:', err.message);
        // Don't crash the server, just log the error
        // The scan will retry on the next scheduled run
      }
    }, {
      scheduled: true,
      timezone: "UTC" // Use UTC to avoid timezone issues
    });
    
    console.log('📅 Low-stock scan scheduled for every 15 minutes');
  } catch (err) {
    console.error('❌ Failed to schedule low-stock scan:', err.message);
    // Don't throw - let the server continue running without the job
    console.log('ℹ️ Low-stock alerts will not be available, but server will continue running');
  }
}

/**
 * Manual trigger for low-stock scan (for testing/debugging)
 */
async function triggerManualScan() {
  try {
    console.log('🔄 Manual low-stock scan triggered');
    const startTime = Date.now();
    
    await scanAllPartsForLowStock();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Manual low-stock scan completed in ${duration}ms`);
    
    return { success: true, duration };
  } catch (err) {
    console.error('❌ Manual low-stock scan failed:', err.message);
    return { success: false, error: err.message };
  }
}

export default { 
  scheduleLowStockScan,
  triggerManualScan 
};
