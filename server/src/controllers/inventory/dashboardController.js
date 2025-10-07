import mongoose from 'mongoose';
import Part from '../../models/inventory/Part.js';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';
import InventoryAuditLog from '../../models/inventory/AuditLog.js';

function getDateNDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function getOverview(req, res) {
  try {
    // Total active parts
    const totalPartsPromise = Part.countDocuments({ isActive: true });

    // Low stock count (available <= reorderLevel)
    const lowStockCountPromise = Part.countDocuments({
      isActive: true,
      'stock.reorderLevel': { $gt: 0 },
      $expr: { $lte: [ { $subtract: [ '$stock.onHand', '$stock.reserved' ] }, '$stock.reorderLevel' ] }
    });

    // Pending/Submitted/Approved purchase orders (not delivered)
    const poBreakdownPromise = PurchaseOrder.aggregate([
      { $match: { status: { $in: ['draft','submitted','approved'] } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } }
    ]);

    // Stock value estimation: use latest PO item unitPrice per part * onHand
    const stockValuePromise = (async () => {
      // Get latest unitPrice by part from POs
      const latestPrices = await PurchaseOrder.aggregate([
        { $unwind: '$items' },
        { $project: { part: '$items.part', unitPrice: '$items.unitPrice', createdAt: '$createdAt' } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$part', unitPrice: { $first: '$unitPrice' } } }
      ]);
      const partIdToPrice = new Map(latestPrices.map(p => [String(p._id), p.unitPrice || 0]));
      const parts = await Part.find({ isActive: true }).select('stock.onHand');
      let total = 0;
      for (const p of parts) {
        const qty = p?.stock?.onHand || 0;
        const price = partIdToPrice.get(String(p._id)) || 0;
        total += qty * price;
      }
      return total;
    })();

    const [ totalParts, lowStockCount, poBreakdown, stockValue ] = await Promise.all([
      totalPartsPromise,
      lowStockCountPromise,
      poBreakdownPromise,
      stockValuePromise
    ]);

    res.json({
      totalParts,
      stockValue,
      lowStockCount,
      purchaseOrders: {
        breakdown: poBreakdown,
        pendingCount: poBreakdown.reduce((acc, r) => acc + (r._id === 'submitted' ? r.count : 0), 0),
      }
    });
  } catch (error) {
    console.error('getOverview error:', error);
    res.status(500).json({ message: 'Failed to load inventory dashboard overview' });
  }
}

export async function getTopUsedParts(req, res) {
  try {
    const days = Number(req.query.days || 30);
    const since = getDateNDaysAgo(days);

    // Infer usage from InventoryAuditLog entries where stock.onHand decreased
    const pipeline = [
      { $match: {
        entityType: 'Part',
        action: 'update',
        createdAt: { $gte: since },
        'before.stock.onHand': { $type: 'number' },
        'after.stock.onHand': { $type: 'number' }
      } },
      { $project: {
        entityId: 1,
        delta: { $subtract: [ '$after.stock.onHand', '$before.stock.onHand' ] }
      } },
      { $match: { delta: { $lt: 0 } } },
      { $group: { _id: '$entityId', usedQty: { $sum: { $abs: '$delta' } } } },
      { $sort: { usedQty: -1 } },
      { $limit: 5 }
    ];

    const agg = await InventoryAuditLog.aggregate(pipeline);
    if (agg.length === 0) {
      return res.json({ items: [] });
    }

    const partIds = agg.map(a => a._id);
    const parts = await Part.find({ _id: { $in: partIds } }).select('name partCode category');
    const map = new Map(parts.map(p => [String(p._id), p]));
    const items = agg.map(a => ({
      partId: a._id,
      usedQty: a.usedQty,
      name: map.get(String(a._id))?.name || 'Unknown',
      partCode: map.get(String(a._id))?.partCode || '',
      category: map.get(String(a._id))?.category || ''
    }));

    res.json({ items });
  } catch (error) {
    console.error('getTopUsedParts error:', error);
    res.status(500).json({ message: 'Failed to load top used parts' });
  }
}


