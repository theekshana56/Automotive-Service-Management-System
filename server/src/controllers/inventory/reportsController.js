import mongoose from 'mongoose';
import Part from '../../models/inventory/Part.js';
import PurchaseOrder from '../../models/inventory/PurchaseOrder.js';

// Build common filters from query
function buildFilters(query) {
  const { startDate, endDate, supplierId, category } = query;
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const partMatch = {};
  if (category) partMatch.category = category;

  const poMatch = {};
  if (supplierId) poMatch.supplier = new mongoose.Types.ObjectId(supplierId);
  if (dateFilter.$gte || dateFilter.$lte) poMatch.createdAt = dateFilter;

  return { partMatch, poMatch };
}

// GET /api/inventory/reports/stock-summary
// Returns current stock levels and valuation, optionally filtered by category
export async function getStockSummary(req, res) {
  try {
    const { partMatch, poMatch } = buildFilters(req.query);

    // Latest prices per part from Purchase Orders (respect supplier/date filters if provided)
    const latestPrices = await PurchaseOrder.aggregate([
      { $match: poMatch },
      { $unwind: '$items' },
      { $project: { part: '$items.part', unitPrice: '$items.unitPrice', createdAt: 1 } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$part', unitPrice: { $first: '$unitPrice' } } }
    ]);

    console.log('Latest prices found:', latestPrices.length, 'parts with pricing data');

    const partIdToPrice = new Map(latestPrices.map(p => [String(p._id), p.unitPrice || 0]));

    const parts = await Part.find({ isActive: true, ...partMatch })
      .select('name partCode category stock.onHand stock.reserved stock.minLevel stock.maxLevel stock.reorderLevel cost.lastPurchasePrice sellingPrice');

    let totalOnHand = 0;
    let totalAvailable = 0;
    let totalValuation = 0;

    const items = parts.map(p => {
      const onHand = p?.stock?.onHand || 0;
      const reserved = p?.stock?.reserved || 0;
      const available = Math.max(0, onHand - reserved);
      const minLevel = p?.stock?.minLevel || 0;
      const maxLevel = p?.stock?.maxLevel || 0;
      const reorderLevel = p?.stock?.reorderLevel || 0;
      let price = partIdToPrice.get(String(p._id)) || 0;
      
      // Fallback to part's own pricing if no PO pricing available
      if (price === 0) {
        price = p.cost?.lastPurchasePrice || p.sellingPrice || 0;
        if (price > 0) {
          console.log(`Part ${p.partCode || p.name} using fallback price: $${price}`);
        } else {
          console.log(`Part ${p.partCode || p.name} (${p._id}) has no pricing data at all`);
        }
      }
      
      const value = onHand * price;

      let status = 'OK';
      if (onHand <= reorderLevel) status = 'REORDER';
      if (onHand < minLevel) status = 'LOW';
      if (maxLevel && onHand > maxLevel) status = 'OVERSTOCK';

      const reorderSuggestion = Math.max(0, reorderLevel - available);
      totalOnHand += onHand;
      totalAvailable += available;
      totalValuation += value;
      return {
        partId: p._id,
        name: p.name,
        partCode: p.partCode,
        category: p.category,
        onHand,
        reserved,
        available,
        minLevel,
        maxLevel,
        reorderLevel,
        status,
        reorderSuggestion,
        unitPrice: price,
        value
      };
    });

    res.json({
      summary: {
        totalParts: parts.length,
        totalOnHand,
        totalAvailable,
        totalValuation
      },
      items
    });
  } catch (error) {
    console.error('getStockSummary error:', error);
    res.status(500).json({ message: 'Failed to generate stock summary report' });
  }
}

// Internal: fetch the same data without sending response
async function fetchStockSummaryData(query) {
  const { partMatch, poMatch } = buildFilters(query);

  const latestPrices = await PurchaseOrder.aggregate([
    { $match: poMatch },
    { $unwind: '$items' },
    { $project: { part: '$items.part', unitPrice: '$items.unitPrice', createdAt: 1 } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$part', unitPrice: { $first: '$unitPrice' } } }
  ]);

  console.log('Latest prices found (internal):', latestPrices.length, 'parts with pricing data');

  const partIdToPrice = new Map(latestPrices.map(p => [String(p._id), p.unitPrice || 0]));

  const parts = await Part.find({ isActive: true, ...partMatch })
    .select('name partCode category stock.onHand stock.reserved stock.minLevel stock.maxLevel stock.reorderLevel cost.lastPurchasePrice sellingPrice');

  let totalOnHand = 0;
  let totalAvailable = 0;
  let totalValuation = 0;

  const items = parts.map(p => {
    const onHand = p?.stock?.onHand || 0;
    const reserved = p?.stock?.reserved || 0;
    const available = Math.max(0, onHand - reserved);
    const minLevel = p?.stock?.minLevel || 0;
    const maxLevel = p?.stock?.maxLevel || 0;
    const reorderLevel = p?.stock?.reorderLevel || 0;
    let price = partIdToPrice.get(String(p._id)) || 0;
    
    // Fallback to part's own pricing if no PO pricing available
    if (price === 0) {
      price = p.cost?.lastPurchasePrice || p.sellingPrice || 0;
      if (price > 0) {
        console.log(`Part ${p.partCode || p.name} using fallback price: $${price} (internal)`);
      } else {
        console.log(`Part ${p.partCode || p.name} (${p._id}) has no pricing data at all (internal)`);
      }
    }
    
    const value = onHand * price;

    let status = 'OK';
    if (onHand <= reorderLevel) status = 'REORDER';
    if (onHand < minLevel) status = 'LOW';
    if (maxLevel && onHand > maxLevel) status = 'OVERSTOCK';

    const reorderSuggestion = Math.max(0, reorderLevel - available);

    totalOnHand += onHand;
    totalAvailable += available;
    totalValuation += value;
    return {
      partId: p._id,
      name: p.name,
      partCode: p.partCode,
      category: p.category,
      onHand,
      reserved,
      available,
      minLevel,
      maxLevel,
      reorderLevel,
      status,
      reorderSuggestion,
      unitPrice: price,
      value
    };
  });

  return {
    summary: {
      totalParts: parts.length,
      totalOnHand,
      totalAvailable,
      totalValuation
    },
    items
  };
}

export async function downloadStockSummaryCSV(req, res) {
  try {
    const data = await fetchStockSummaryData(req.query);
    const headers = ['Part Code','Name','Category','On Hand','Reserved','Available','Min Level','Max Level','Reorder Level','Status','Reorder Suggestion','Unit Price','Value'];
    const rows = data.items.map(r => [
      r.partCode,
      r.name,
      r.category,
      r.onHand,
      r.reserved,
      r.available,
      r.minLevel,
      r.maxLevel,
      r.reorderLevel,
      r.status,
      r.reorderSuggestion,
      Number(r.unitPrice || 0).toFixed(2),
      Number(r.value || 0).toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(cols => cols.map(val => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))].join('\n');

    const filename = `stock-summary-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('downloadStockSummaryCSV error:', error);
    res.status(500).json({ message: 'Failed to download stock summary CSV' });
  }
}

export async function downloadStockSummaryPDF(req, res) {
  try {
    const data = await fetchStockSummaryData(req.query);
    const { generateStockSummaryPDF } = await import('../../services/inventory/pdfService.js');
    const pdfBuffer = await generateStockSummaryPDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="stock-summary-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadStockSummaryPDF error:', error);
    res.status(500).json({ message: 'Failed to download stock summary PDF' });
  }
}

// GET /api/inventory/reports/supplier-spend
// Aggregates purchase order spend by supplier within date range
export async function getSupplierSpend(req, res) {
  try {
    const { poMatch } = buildFilters(req.query);

    const pipeline = [
      { $match: poMatch },
      {
        $group: {
          _id: '$supplier',
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          minOrderValue: { $min: '$totalAmount' },
          maxOrderValue: { $max: '$totalAmount' },
          firstOrderDate: { $min: '$createdAt' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          supplierId: '$_id',
          companyName: { $ifNull: ['$supplier.companyName', '$supplier.name'] },
          totalOrders: 1,
          totalAmount: 1,
          avgOrderValue: 1,
          minOrderValue: 1,
          maxOrderValue: 1,
          firstOrderDate: 1,
          lastOrderDate: 1
        }
      }
    ];

    const rows = await PurchaseOrder.aggregate(pipeline);
    res.json({ rows });
  } catch (error) {
    console.error('getSupplierSpend error:', error);
    res.status(500).json({ message: 'Failed to generate supplier spend report' });
  }
}

// Internal: fetch data for supplier spend with same shape as API
async function fetchSupplierSpendData(query) {
  const { poMatch } = buildFilters(query);
  const pipeline = [
    { $match: poMatch },
    {
      $group: {
        _id: '$supplier',
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        minOrderValue: { $min: '$totalAmount' },
        maxOrderValue: { $max: '$totalAmount' },
        firstOrderDate: { $min: '$createdAt' },
        lastOrderDate: { $max: '$createdAt' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        supplierId: '$_id',
        companyName: { $ifNull: ['$supplier.companyName', '$supplier.name'] },
        totalOrders: 1,
        totalAmount: 1,
        avgOrderValue: 1,
        minOrderValue: 1,
        maxOrderValue: 1,
        firstOrderDate: 1,
        lastOrderDate: 1
      }
    }
  ];
  const rows = await PurchaseOrder.aggregate(pipeline);
  return { rows };
}

export async function downloadSupplierSpendCSV(req, res) {
  try {
    const data = await fetchSupplierSpendData(req.query);
    const headers = ['Supplier','Total Orders','Total Spend','Avg Order','Min Order','Max Order','First Order','Last Order'];
    const rows = data.rows.map(r => [
      r.companyName || '',
      r.totalOrders || 0,
      Number(r.totalAmount || 0).toFixed(2),
      Number(r.avgOrderValue || 0).toFixed(2),
      Number(r.minOrderValue || 0).toFixed(2),
      Number(r.maxOrderValue || 0).toFixed(2),
      r.firstOrderDate ? new Date(r.firstOrderDate).toISOString().split('T')[0] : '',
      r.lastOrderDate ? new Date(r.lastOrderDate).toISOString().split('T')[0] : ''
    ]);
    const csv = [headers.join(','), ...rows.map(cols => cols.map(val => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))].join('\n');
    const filename = `supplier-spend-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('downloadSupplierSpendCSV error:', error);
    res.status(500).json({ message: 'Failed to download supplier spend CSV' });
  }
}

export async function downloadSupplierSpendPDF(req, res) {
  try {
    const data = await fetchSupplierSpendData(req.query);
    const { generateSupplierSpendPDF } = await import('../../services/inventory/pdfService.js');
    const pdfBuffer = await generateSupplierSpendPDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="supplier-spend-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadSupplierSpendPDF error:', error);
    res.status(500).json({ message: 'Failed to download supplier spend PDF' });
  }
}

// GET /api/inventory/reports/supplier-performance
// Evaluate suppliers based on delivery history and timeliness
export async function getSupplierPerformance(req, res) {
  try {
    const { poMatch } = buildFilters(req.query);
    const lateThresholdDays = parseInt(req.query.lateDays || '2', 10);

    const pipeline = [
      { $match: { ...poMatch, status: 'delivered' } },
      {
        $project: {
          supplier: 1,
          approvedAt: 1,
          deliveredAt: 1,
          expectedDeliveryDate: 1,
          items: 1,
          totalAmount: 1,
          approvalToDeliveryDays: {
            $divide: [ { $subtract: ['$deliveredAt', '$approvedAt'] }, 1000 * 60 * 60 * 24 ]
          },
          lateByDays: {
            $cond: [
              { $and: [ { $ifNull: ['$expectedDeliveryDate', false] }, { $ifNull: ['$deliveredAt', false] } ] },
              { $divide: [ { $subtract: ['$deliveredAt', '$expectedDeliveryDate'] }, 1000 * 60 * 60 * 24 ] },
              null
            ]
          }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$supplier',
          totalPOs: { $sum: 1 },
          avgDeliveryDays: { $avg: '$approvalToDeliveryDays' },
          deliveredLateCount: {
            $sum: {
              $cond: [
                { $and: [ { $ne: ['$lateByDays', null] }, { $gt: ['$lateByDays', lateThresholdDays] } ] },
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          supplierId: '$_id',
          _id: 0,
          totalPOs: 1,
          avgDeliveryDays: 1,
          deliveredLatePct: {
            $cond: [ { $gt: ['$totalPOs', 0] }, { $multiply: [ { $divide: ['$deliveredLateCount', '$totalPOs'] }, 100 ] }, 0 ]
          },
          totalAmount: 1
        }
      },
      { $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          supplierId: 1,
          companyName: { $ifNull: ['$supplier.companyName', '$supplier.name'] },
          totalPOs: 1,
          avgDeliveryDays: 1,
          deliveredLatePct: 1,
          totalAmount: 1
        }
      },
      { $sort: { deliveredLatePct: -1 } }
    ];

    const rows = await PurchaseOrder.aggregate(pipeline);
    res.json({ lateThresholdDays, rows });
  } catch (error) {
    console.error('getSupplierPerformance error:', error);
    res.status(500).json({ message: 'Failed to generate supplier performance report' });
  }
}

// Internal: fetch supplier performance data
async function fetchSupplierPerformanceData(query) {
  const { poMatch } = buildFilters(query);
  const lateThresholdDays = parseInt(query.lateDays || '2', 10);
  const pipeline = [
    { $match: { ...poMatch, status: 'delivered' } },
    {
      $project: {
        supplier: 1,
        approvedAt: 1,
        deliveredAt: 1,
        expectedDeliveryDate: 1,
        items: 1,
        totalAmount: 1,
        approvalToDeliveryDays: {
          $divide: [ { $subtract: ['$deliveredAt', '$approvedAt'] }, 1000 * 60 * 60 * 24 ]
        },
        lateByDays: {
          $cond: [
            { $and: [ { $ifNull: ['$expectedDeliveryDate', false] }, { $ifNull: ['$deliveredAt', false] } ] },
            { $divide: [ { $subtract: ['$deliveredAt', '$expectedDeliveryDate'] }, 1000 * 60 * 60 * 24 ] },
            null
          ]
        }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$supplier',
        totalPOs: { $sum: 1 },
        avgDeliveryDays: { $avg: '$approvalToDeliveryDays' },
        deliveredLateCount: {
          $sum: {
            $cond: [ { $and: [ { $ne: ['$lateByDays', null] }, { $gt: ['$lateByDays', lateThresholdDays] } ] }, 1, 0 ]
          }
        },
        totalAmount: { $sum: '$totalAmount' }
      }
    },
    {
      $project: {
        supplierId: '$_id',
        _id: 0,
        totalPOs: 1,
        avgDeliveryDays: 1,
        deliveredLatePct: {
          $cond: [ { $gt: ['$totalPOs', 0] }, { $multiply: [ { $divide: ['$deliveredLateCount', '$totalPOs'] }, 100 ] }, 0 ]
        },
        totalAmount: 1
      }
    },
    { $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
    { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        supplierId: 1,
        companyName: { $ifNull: ['$supplier.companyName', '$supplier.name'] },
        totalPOs: 1,
        avgDeliveryDays: 1,
        deliveredLatePct: 1,
        totalAmount: 1
      }
    },
    { $sort: { deliveredLatePct: -1 } }
  ];
  const rows = await PurchaseOrder.aggregate(pipeline);
  return { lateThresholdDays, rows };
}

export async function downloadSupplierPerformancePDF(req, res) {
  try {
    const data = await fetchSupplierPerformanceData(req.query);
    const { generateSupplierPerformancePDF } = await import('../../services/inventory/pdfService.js');
    const pdfBuffer = await generateSupplierPerformancePDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="supplier-performance-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadSupplierPerformancePDF error:', error);
    res.status(500).json({ message: 'Failed to download supplier performance PDF' });
  }
}

// GET /api/inventory/reports/part-price-trend
// Returns avg unit price trend per part over time (monthly buckets)
export async function getPartPriceTrend(req, res) {
  try {
    const { poMatch } = buildFilters(req.query);
    const limitParts = parseInt(req.query.limit || '5', 10);
    const months = parseInt(req.query.months || '6', 10);

    const pipeline = [
      { $match: poMatch },
      { $unwind: '$items' },
      {
        $project: {
          part: '$items.part',
          unitPrice: '$items.unitPrice',
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' }
        }
      },
      {
        $group: {
          _id: { part: '$part', y: '$y', m: '$m' },
          avgPrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { '_id.y': -1, '_id.m': -1 } }
    ];

    const rows = await PurchaseOrder.aggregate(pipeline);

    // Build last N months labels
    const now = new Date();
    const labelSet = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labelSet.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Map part -> label -> price
    const partMap = new Map();
    for (const r of rows) {
      const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
      if (!partMap.has(String(r._id.part))) partMap.set(String(r._id.part), new Map());
      partMap.get(String(r._id.part)).set(key, r.avgPrice);
    }

    // Pick top parts by recent activity (number of months with data)
    const rankedParts = Array.from(partMap.entries())
      .map(([partId, m]) => ({ partId, count: m.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limitParts)
      .map(p => p.partId);

    // Fetch part names
    const parts = await Part.find({ _id: { $in: rankedParts } }).select('name partCode').lean();
    const partIdToName = new Map(parts.map(p => [String(p._id), p.partCode || p.name || String(p._id)]));

    // Build datasets
    const datasets = rankedParts.map((partId, idx) => ({
      label: partIdToName.get(partId) || partId,
      data: labelSet.map(label => {
        const map = partMap.get(partId);
        const val = map ? map.get(label) : null;
        return val != null ? Number(val.toFixed(2)) : null;
      })
    }));

    res.json({ labels: labelSet, datasets });
  } catch (error) {
    console.error('getPartPriceTrend error:', error);
    res.status(500).json({ message: 'Failed to fetch part price trend' });
  }
}


