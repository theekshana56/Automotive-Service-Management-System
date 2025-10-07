import PartUsageLog from '../../models/inventory/PartUsageLog.js';
import Part from '../../models/inventory/Part.js';
import User from '../../models/User.js';

// POST /api/inventory/parts-usage-log
export const createUsageLog = async (req, res) => {
  try {
    const { partId, quantityUsed, jobId, note } = req.body;
    const usedBy = req.user?.id;
    if (!partId || !quantityUsed || !usedBy) {
      return res.status(400).json({ message: 'partId, quantityUsed, and user are required.' });
    }
    // Optionally, check if part exists
    const part = await Part.findById(partId);
    if (!part) return res.status(404).json({ message: 'Part not found.' });
    // Optionally, check if enough stock is available
    if ((part.stock.onHand || 0) < quantityUsed) {
      return res.status(400).json({ message: 'Not enough stock available.' });
    }
    // Deduct stock
    part.stock.onHand -= quantityUsed;
    await part.save();
    // Create log
    const log = await PartUsageLog.create({
      partId,
      quantityUsed,
      usedBy,
      jobId,
      note,
      usedAt: new Date(),
    });
    res.status(201).json(log);
  } catch (err) {
    console.error('createUsageLog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/inventory/parts-usage-log
export const getUsageLogs = async (req, res) => {
  try {
    const { partId, usedBy, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (partId) filter.partId = partId;
    if (usedBy) filter.usedBy = usedBy;
    if (startDate || endDate) {
      filter.usedAt = {};
      if (startDate) filter.usedAt.$gte = new Date(startDate);
      if (endDate) filter.usedAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: 'i' } },
        { jobId: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      PartUsageLog.find(filter)
        .populate('partId', 'name partCode')
        .populate('usedBy', 'name email')
        .sort('-usedAt')
        .skip(skip)
        .limit(Number(limit)),
      PartUsageLog.countDocuments(filter),
    ]);
    res.json({
      items: logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('getUsageLogs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/inventory/parts-usage-log/download.csv
export const downloadUsageLogCSV = async (req, res) => {
  try {
    const { partId, usedBy, startDate, endDate, search } = req.query;
    const filter = {};
    if (partId) filter.partId = partId;
    if (usedBy) filter.usedBy = usedBy;
    if (startDate || endDate) {
      filter.usedAt = {};
      if (startDate) filter.usedAt.$gte = new Date(startDate);
      if (endDate) filter.usedAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: 'i' } },
        { jobId: { $regex: search, $options: 'i' } }
      ];
    }
    const logs = await PartUsageLog.find(filter)
      .populate('partId', 'name partCode')
      .populate('usedBy', 'name email')
      .sort('-usedAt');
    const headers = ['Date','Part Name','Part Code','Quantity','User','Job ID','Note'];
    const rows = logs.map(log => [
      log.usedAt ? new Date(log.usedAt).toLocaleString() : '',
      log.partId?.name || '',
      log.partId?.partCode || '',
      log.quantityUsed,
      log.usedBy?.name || '',
      log.jobId || '',
      log.note ? String(log.note).replace(/\n/g, ' ') : ''
    ]);
    const csv = [headers.join(','), ...rows.map(cols => cols.map(val => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))].join('\n');
    const filename = `parts-usage-log-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('downloadUsageLogCSV error:', err);
    res.status(500).json({ message: 'Failed to download usage log CSV' });
  }
};
