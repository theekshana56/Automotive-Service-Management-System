// Direct database seeding script for 45 parts
import mongoose from 'mongoose';
import Part from './src/models/inventory/Part.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection - use the correct database from .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AutoElite';

// Supplier IDs from the database
const SUPPLIERS = {
  BRAKE_SYSTEMS: new mongoose.Types.ObjectId('68d0c008a5ef9d715cfff4d0'),
  AUTO_PARTS_CENTRAL: new mongoose.Types.ObjectId('68d0c008a5ef9d715cfff4cf'), 
  ELECTRICAL_AUTO: new mongoose.Types.ObjectId('68d0c008a5ef9d715cfff4d1')
};

// Function to generate random stock values
const randomStock = () => ({
  onHand: Math.floor(Math.random() * 100) + 10,
  minLevel: Math.floor(Math.random() * 10) + 5,
  maxLevel: Math.floor(Math.random() * 50) + 100,
  reorderLevel: Math.floor(Math.random() * 20) + 10
});

// Function to generate random price
const randomPrice = (min = 10, max = 500) => 
  Math.floor((Math.random() * (max - min) + min) * 100) / 100;

const parts = [
  // BRAKES CATEGORY (12 parts)
  {
    name: "Ceramic Brake Pads - Front",
    partCode: "BRK-PAD-CER-F001",
    description: "High-performance ceramic brake pads for front wheels. Excellent heat dissipation and minimal dust.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(40, 80), currency: "USD" },
    sellingPrice: randomPrice(60, 120),
    isActive: true
  },
  {
    name: "Brake Disc Rotor - Rear",
    partCode: "BRK-DSC-ROT-R002", 
    description: "Ventilated brake disc rotor for rear axle. Cross-drilled for improved cooling.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(80, 150), currency: "USD" },
    sellingPrice: randomPrice(120, 220),
    isActive: true
  },
  {
    name: "Brake Fluid DOT 4",
    partCode: "BRK-FLD-DOT4-003",
    description: "High-grade DOT 4 brake fluid with excellent boiling point. 1 liter bottle.",
    category: "Brakes", 
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(15, 25), currency: "USD" },
    sellingPrice: randomPrice(25, 40),
    isActive: true
  },
  {
    name: "Brake Caliper - Front Left",
    partCode: "BRK-CAL-FL-004",
    description: "Remanufactured brake caliper for front left position. Includes mounting hardware.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(120, 200), currency: "USD" },
    sellingPrice: randomPrice(180, 300),
    isActive: true
  },
  {
    name: "Brake Master Cylinder",
    partCode: "BRK-MST-CYL-005",
    description: "Complete brake master cylinder assembly with reservoir. Direct OEM replacement.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(150, 250), currency: "USD" },
    sellingPrice: randomPrice(220, 380),
    isActive: true
  },
  {
    name: "Brake Shoe Set - Rear",
    partCode: "BRK-SHO-SET-006",
    description: "Complete brake shoe set for rear drums. Includes springs and hardware.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(60, 100), currency: "USD" },
    sellingPrice: randomPrice(90, 150),
    isActive: true
  },
  {
    name: "Brake Line Kit",
    partCode: "BRK-LIN-KIT-007",
    description: "Stainless steel braided brake line kit. Improves pedal feel and durability.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(80, 120), currency: "USD" },
    sellingPrice: randomPrice(120, 180),
    isActive: true
  },
  {
    name: "ABS Sensor - Front",
    partCode: "BRK-ABS-SNS-008",
    description: "Anti-lock brake system wheel speed sensor for front wheels.",
    category: "Brakes",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(45, 75), currency: "USD" },
    sellingPrice: randomPrice(70, 110),
    isActive: true
  },
  {
    name: "Brake Booster",
    partCode: "BRK-BST-009",
    description: "Vacuum brake booster assembly. Provides power assistance for brake pedal.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(200, 300), currency: "USD" },
    sellingPrice: randomPrice(300, 450),
    isActive: true
  },
  {
    name: "Emergency Brake Cable",
    partCode: "BRK-EMG-CBL-010",
    description: "Heavy-duty emergency brake cable assembly. Adjustable length.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(30, 50), currency: "USD" },
    sellingPrice: randomPrice(45, 75),
    isActive: true
  },
  {
    name: "Brake Drum - Rear",
    partCode: "BRK-DRM-R-011",
    description: "Cast iron brake drum for rear axle. Precision machined surface.",
    category: "Brakes",
    suppliers: [SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(70, 120), currency: "USD" },
    sellingPrice: randomPrice(105, 180),
    isActive: true
  },
  {
    name: "Brake Pad Wear Sensor",
    partCode: "BRK-PAD-SNS-012",
    description: "Electronic brake pad wear sensor. Alerts when pads need replacement.",
    category: "Brakes",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(20, 35), currency: "USD" },
    sellingPrice: randomPrice(35, 55),
    isActive: true
  },

  // FILTERS CATEGORY (11 parts)
  {
    name: "Engine Oil Filter",
    partCode: "FLT-OIL-ENG-013",
    description: "Premium oil filter with synthetic media. Fits most 4-cylinder engines.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(8, 15), currency: "USD" },
    sellingPrice: randomPrice(15, 25),
    isActive: true
  },
  {
    name: "Air Filter - High Flow",
    partCode: "FLT-AIR-HF-014",
    description: "High-flow air filter with cotton gauze media. Reusable and washable.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(25, 40), currency: "USD" },
    sellingPrice: randomPrice(40, 65),
    isActive: true
  },
  {
    name: "Fuel Filter Inline",
    partCode: "FLT-FUL-INL-015",
    description: "Inline fuel filter with 10-micron filtration. Prevents fuel system contamination.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(12, 20), currency: "USD" },
    sellingPrice: randomPrice(20, 35),
    isActive: true
  },
  {
    name: "Cabin Air Filter",
    partCode: "FLT-CAB-AIR-016",
    description: "Activated carbon cabin air filter. Removes odors and allergens.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(15, 25), currency: "USD" },
    sellingPrice: randomPrice(25, 40),
    isActive: true
  },
  {
    name: "Transmission Filter Kit",
    partCode: "FLT-TRN-KIT-017",
    description: "Complete transmission filter kit with gasket and fluid. For automatic transmissions.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(35, 55), currency: "USD" },
    sellingPrice: randomPrice(55, 85),
    isActive: true
  },
  {
    name: "Hydraulic Filter",
    partCode: "FLT-HYD-018",
    description: "Hydraulic system filter for power steering and other hydraulic systems.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(20, 35), currency: "USD" },
    sellingPrice: randomPrice(35, 55),
    isActive: true
  },
  {
    name: "PCV Valve Filter",
    partCode: "FLT-PCV-019",
    description: "Positive crankcase ventilation filter. Prevents oil vapor recirculation.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(8, 15), currency: "USD" },
    sellingPrice: randomPrice(15, 25),
    isActive: true
  },
  {
    name: "Diesel Particulate Filter",
    partCode: "FLT-DPF-020",
    description: "Diesel particulate filter for emission control. Regenerable design.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(800, 1200), currency: "USD" },
    sellingPrice: randomPrice(1200, 1800),
    isActive: true
  },
  {
    name: "Coolant Filter",
    partCode: "FLT-COL-021",
    description: "Coolant system filter with corrosion inhibitors. Extends coolant life.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(18, 30), currency: "USD" },
    sellingPrice: randomPrice(30, 45),
    isActive: true
  },
  {
    name: "Breather Filter",
    partCode: "FLT-BRT-022",
    description: "Crankcase breather filter. Prevents contamination of intake system.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(12, 20), currency: "USD" },
    sellingPrice: randomPrice(20, 32),
    isActive: true
  },
  {
    name: "Adblue Filter",
    partCode: "FLT-ADB-023",
    description: "AdBlue/DEF system filter for diesel exhaust fluid injection systems.",
    category: "Filters",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(25, 40), currency: "USD" },
    sellingPrice: randomPrice(40, 65),
    isActive: true
  },

  // ENGINES CATEGORY (11 parts)
  {
    name: "Engine Gasket Set Complete",
    partCode: "ENG-GSK-CMP-024",
    description: "Complete engine gasket set including head gasket, manifold gaskets, and seals.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(150, 250), currency: "USD" },
    sellingPrice: randomPrice(225, 375),
    isActive: true
  },
  {
    name: "Timing Belt Kit",
    partCode: "ENG-TMG-BLT-025",
    description: "Complete timing belt kit with tensioner and water pump. For interference engines.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(120, 200), currency: "USD" },
    sellingPrice: randomPrice(180, 300),
    isActive: true
  },
  {
    name: "Engine Oil Pump",
    partCode: "ENG-OIL-PMP-026",
    description: "High-pressure engine oil pump assembly. Ensures proper lubrication flow.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(180, 280), currency: "USD" },
    sellingPrice: randomPrice(270, 420),
    isActive: true
  },
  {
    name: "Cylinder Head Assembly",
    partCode: "ENG-CYL-HD-027",
    description: "Remanufactured cylinder head assembly with valves and springs installed.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(800, 1200), currency: "USD" },
    sellingPrice: randomPrice(1200, 1800),
    isActive: true
  },
  {
    name: "Piston Ring Set",
    partCode: "ENG-PST-RNG-028",
    description: "Premium piston ring set for one cylinder. Cast iron with chrome facing.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(60, 100), currency: "USD" },
    sellingPrice: randomPrice(90, 150),
    isActive: true
  },
  {
    name: "Engine Mount - Front",
    partCode: "ENG-MNT-FRT-029",
    description: "Hydraulic engine mount for front position. Reduces vibration and noise.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL, SUPPLIERS.BRAKE_SYSTEMS],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(80, 130), currency: "USD" },
    sellingPrice: randomPrice(120, 195),
    isActive: true
  },
  {
    name: "Valve Cover Gasket",
    partCode: "ENG-VLV-GSK-030",
    description: "High-temperature valve cover gasket with integrated spark plug seals.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(25, 40), currency: "USD" },
    sellingPrice: randomPrice(40, 65),
    isActive: true
  },
  {
    name: "Engine Cooling Fan",
    partCode: "ENG-FAN-COL-031",
    description: "Electric cooling fan assembly with shroud. Variable speed control.",
    category: "Engines",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(120, 180), currency: "USD" },
    sellingPrice: randomPrice(180, 270),
    isActive: true
  },
  {
    name: "Thermostat Housing",
    partCode: "ENG-THM-HSG-032",
    description: "Complete thermostat housing assembly with gasket and thermostat.",
    category: "Engines",
    suppliers: [SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(45, 75), currency: "USD" },
    sellingPrice: randomPrice(70, 110),
    isActive: true
  },
  {
    name: "Engine Block Heater",
    partCode: "ENG-BLK-HTR-033",
    description: "Engine block heater for cold weather starting. 120V with cord.",
    category: "Engines",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(60, 90), currency: "USD" },
    sellingPrice: randomPrice(90, 135),
    isActive: true
  },
  {
    name: "Crankshaft Position Sensor",
    partCode: "ENG-CRK-SNS-034",
    description: "Magnetic crankshaft position sensor for engine timing control.",
    category: "Engines",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(35, 55), currency: "USD" },
    sellingPrice: randomPrice(55, 85),
    isActive: true
  },

  // ELECTRIC CATEGORY (11 parts)
  {
    name: "Alternator Assembly",
    partCode: "ELC-ALT-ASM-035",
    description: "High-output alternator assembly. 120A capacity with built-in voltage regulator.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(150, 250), currency: "USD" },
    sellingPrice: randomPrice(225, 375),
    isActive: true
  },
  {
    name: "Starter Motor",
    partCode: "ELC-STR-MTR-036",
    description: "Gear reduction starter motor. High-torque design for reliable starting.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(120, 200), currency: "USD" },
    sellingPrice: randomPrice(180, 300),
    isActive: true
  },
  {
    name: "Battery - AGM Deep Cycle",
    partCode: "ELC-BAT-AGM-037",
    description: "AGM deep cycle battery. 12V 75Ah with maintenance-free design.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(180, 250), currency: "USD" },
    sellingPrice: randomPrice(270, 375),
    isActive: true
  },
  {
    name: "Ignition Coil Pack",
    partCode: "ELC-IGN-COL-038",
    description: "Direct ignition coil pack for distributorless ignition systems.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(60, 100), currency: "USD" },
    sellingPrice: randomPrice(90, 150),
    isActive: true
  },
  {
    name: "Spark Plug Set - Iridium",
    partCode: "ELC-SPK-IRD-039",
    description: "Premium iridium spark plugs. Extended life and improved performance.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(40, 60), currency: "USD" },
    sellingPrice: randomPrice(60, 90),
    isActive: true
  },
  {
    name: "Wiring Harness - Engine",
    partCode: "ELC-WIR-HRN-040",
    description: "Complete engine wiring harness with connectors. OEM-quality construction.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(200, 300), currency: "USD" },
    sellingPrice: randomPrice(300, 450),
    isActive: true
  },
  {
    name: "ECU Engine Control Unit",
    partCode: "ELC-ECU-ENG-041",
    description: "Engine control unit (ECU) with latest firmware. Plug-and-play installation.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(800, 1200), currency: "USD" },
    sellingPrice: randomPrice(1200, 1800),
    isActive: true
  },
  {
    name: "Headlight Assembly - LED",
    partCode: "ELC-HED-LED-042",
    description: "LED headlight assembly with adaptive beam technology. DOT approved.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(250, 350), currency: "USD" },
    sellingPrice: randomPrice(375, 525),
    isActive: true
  },
  {
    name: "Fuse Box Assembly",
    partCode: "ELC-FSE-BOX-043",
    description: "Complete under-hood fuse box assembly with relays and fuses included.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(80, 120), currency: "USD" },
    sellingPrice: randomPrice(120, 180),
    isActive: true
  },
  {
    name: "Power Window Motor",
    partCode: "ELC-PWR-WIN-044",
    description: "Electric power window motor with gear assembly. For front doors.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO, SUPPLIERS.AUTO_PARTS_CENTRAL],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(70, 110), currency: "USD" },
    sellingPrice: randomPrice(105, 165),
    isActive: true
  },
  {
    name: "Oxygen Sensor - Wideband",
    partCode: "ELC-O2S-WB-045",
    description: "Wideband oxygen sensor for precise air-fuel ratio monitoring.",
    category: "Electric",
    suppliers: [SUPPLIERS.ELECTRICAL_AUTO],
    stock: randomStock(),
    cost: { lastPurchasePrice: randomPrice(80, 120), currency: "USD" },
    sellingPrice: randomPrice(120, 180),
    isActive: true
  }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedParts() {
  try {
    console.log('🌱 Starting to seed 45 parts...');
    console.log(`📦 Distribution: Brakes(12), Filters(11), Engines(11), Electric(11)`);
    console.log('');

    // Check for existing parts to avoid duplicates
    const existingCodes = await Part.find({}, 'partCode').lean();
    const existingCodeSet = new Set(existingCodes.map(p => p.partCode));

    const partsToInsert = parts.filter(part => !existingCodeSet.has(part.partCode));
    
    if (partsToInsert.length === 0) {
      console.log('⚠️  All parts already exist in database');
      return;
    }

    console.log(`📝 Inserting ${partsToInsert.length} new parts...`);
    
    const result = await Part.insertMany(partsToInsert);
    
    console.log('');
    console.log('📊 Seeding Summary:');
    console.log(`✅ Successfully created: ${result.length} parts`);
    console.log(`⏭️  Skipped (already exist): ${parts.length - partsToInsert.length} parts`);
    console.log(`📈 Total attempted: ${parts.length} parts`);

    // Category breakdown
    const breakdown = partsToInsert.reduce((acc, part) => {
      acc[part.category] = (acc[part.category] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📋 Category Breakdown (new parts):');
    Object.entries(breakdown).forEach(([category, count]) => {
      console.log(`${category}: ${count} parts`);
    });

  } catch (error) {
    console.error('❌ Error seeding parts:', error);
  }
}

async function main() {
  await connectDB();
  await seedParts();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
}

main().catch(console.error);