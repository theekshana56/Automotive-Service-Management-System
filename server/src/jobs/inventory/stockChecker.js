import cron from 'node-cron';
import Part from '../models/Part';
// server/jobs/stockChecker.js


const { checkPartForLowStock } = require("../services/stockService");

/**
 * startStockChecker()
 * Runs every hour (adjust cron as needed)
 */
function startStockChecker() {
  // Run every hour at minute 0 => "0 * * * *"
  cron.schedule("0 * * * *", async () => {
    console.log("🔎 Running low-stock scan...");

    try {
      // Find all parts with available <= reorderLevel
      const lowStockParts = await Part.find({
        isActive: true,
        "stock.reorderLevel": { $gt: 0 },
        $expr: { $lte: [{ $subtract: ["$stock.onHand", "$stock.reserved"] }, "$stock.reorderLevel"] }
      });

      if (lowStockParts.length === 0) {
        console.log("✅ No low-stock parts detected.");
        return;
      }

      console.log(`📦 Found ${lowStockParts.length} low-stock parts`);

      for (const part of lowStockParts) {
        try {
          await checkPartForLowStock(part._id); // handles cooldown + socket + email
          console.log(`📦 Low-stock alert processed for ${part.name} (${part.partCode})`);
        } catch (err) {
          console.error(`⚠️ Failed to process alert for ${part.partCode}:`, err.message);
        }
      }
      
      console.log("✅ Low-stock scan completed successfully");
    } catch (err) {
      console.error("🔥 Low-stock scan failed:", err.message);
    }
  }, {
    scheduled: true,
    timezone: "UTC" // Use UTC to avoid timezone issues
  });

  console.log("⏰ Stock checker scheduled to run every hour.");
}

/**
 * Manual trigger for testing
 */
async function triggerManualCheck() {
  console.log("🔎 Manual low-stock scan triggered");
  
  try {
    const startTime = Date.now();
    
    // Find all parts with available <= reorderLevel
    const lowStockParts = await Part.find({
      isActive: true,
      "stock.reorderLevel": { $gt: 0 },
      $expr: { $lte: [{ $subtract: ["$stock.onHand", "$stock.reserved"] }, "$stock.reorderLevel"] }
    });

    if (lowStockParts.length === 0) {
      console.log("✅ No low-stock parts detected.");
      return { success: true, count: 0, duration: Date.now() - startTime };
    }

    console.log(`📦 Found ${lowStockParts.length} low-stock parts`);

    for (const part of lowStockParts) {
      try {
        await checkPartForLowStock(part._id); // handles cooldown + socket + email
        console.log(`📦 Low-stock alert processed for ${part.name} (${part.partCode})`);
      } catch (err) {
        console.error(`⚠️ Failed to process alert for ${part.partCode}:`, err.message);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Manual low-stock scan completed in ${duration}ms`);
    
    return { success: true, count: lowStockParts.length, duration };
  } catch (err) {
    console.error("🔥 Manual low-stock scan failed:", err.message);
    return { success: false, error: err.message };
  }
}

export default { 
  startStockChecker,
  triggerManualCheck 
};
