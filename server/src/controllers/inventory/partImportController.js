import csv from 'csv-parser';
import fs from 'fs';
import Part from '../../models/inventory/Part';



const { logAudit } = require('../../utils/logAudit');

export const handleImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let processed = 0;
    let created = 0;
    let updated = 0;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            processed++;
            
            try {
              // Validate required fields
              if (!row.name || !row.partCode) {
                errors.push(`Row ${processed}: Missing required fields (name, partCode)`);
                continue;
              }

              // Check if part exists
              const existingPart = await Part.findOne({ 
                partCode: row.partCode.toUpperCase().trim() 
              });

              const partData = {
                name: row.name.trim(),
                partCode: row.partCode.toUpperCase().trim(),
                description: row.description || '',
                category: row.category || '',
                stock: {
                  onHand: parseInt(row.onHand) || 0,
                  reserved: parseInt(row.reserved) || 0,
                  minLevel: parseInt(row.minLevel) || 0,
                  maxLevel: parseInt(row.maxLevel) || 0,
                  reorderLevel: parseInt(row.reorderLevel) || 0,
                },
                isActive: row.isActive !== 'false'
              };

              if (existingPart) {
                // Update existing part
                const oldPart = existingPart.toObject();
                Object.assign(existingPart, partData);
                await existingPart.save();
                updated++;

                // Log audit
                await logAudit({
                  userId: req.user?.id,
                  entityType: 'Part',
                  entityId: existingPart._id,
                  action: 'update',
                  before: oldPart,
                  after: existingPart.toObject(),
                  source: 'CSV_IMPORT'
                });
              } else {
                // Create new part
                const newPart = await Part.create(partData);
                created++;

                // Log audit
                await logAudit({
                  userId: req.user?.id,
                  entityType: 'Part',
                  entityId: newPart._id,
                  action: 'create',
                  after: newPart.toObject(),
                  source: 'CSV_IMPORT'
                });
              }
            } catch (rowError) {
              errors.push(`Row ${processed}: ${rowError.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'CSV import completed',
            summary: {
              processed,
              created,
              updated,
              errors: errors.length
            },
            errors: errors.length > 0 ? errors : undefined
          });

        } catch (error) {
          console.error('CSV import error:', error);
          res.status(500).json({ 
            message: 'Import failed', 
            error: error.message 
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ 
          message: 'Failed to parse CSV file', 
          error: error.message 
        });
      });

  } catch (error) {
    console.error('CSV import handler error:', error);
    res.status(500).json({ 
      message: 'Import failed', 
      error: error.message 
    });
  }
};