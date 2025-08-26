import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTables() {
  try {
    console.log('Starting table migration...');

    // Create default floor if it doesn't exist
    let defaultFloor = await prisma.floor.findFirst({
      where: { name: 'Ground Floor' }
    });

    if (!defaultFloor) {
      defaultFloor = await prisma.floor.create({
        data: {
          name: 'Ground Floor',
          description: 'Main dining area'
        }
      });
      console.log('Created default floor:', defaultFloor.name);
    }

    // Create default areas if they don't exist
    const defaultAreas = [
      { name: 'A/C', description: 'Air conditioned section' },
      { name: 'Non A/C', description: 'Non-air conditioned section' },
      { name: 'Bar', description: 'Bar area' }
    ];

    for (const areaData of defaultAreas) {
      let area = await prisma.area.findFirst({
        where: { 
          name: areaData.name,
          floorId: defaultFloor.id
        }
      });

      if (!area) {
        area = await prisma.area.create({
          data: {
            ...areaData,
            floorId: defaultFloor.id
          }
        });
        console.log('Created area:', area.name);
      }
    }

    // Get existing tables and migrate them
    const existingTables = await prisma.table.findMany();
    
    if (existingTables.length > 0) {
      console.log(`Found ${existingTables.length} existing tables to migrate...`);
      
      // Get the A/C area for migration
      const acArea = await prisma.area.findFirst({
        where: { name: 'A/C', floorId: defaultFloor.id }
      });

      if (acArea) {
        for (const table of existingTables) {
          // Update existing table with new structure
          await prisma.table.update({
            where: { id: table.id },
            data: {
              areaId: acArea.id,
              floorId: defaultFloor.id,
              status: 'available' // Set default status
            }
          });
        }
        console.log('Migrated existing tables to new schema');
      }
    } else {
      // Create some sample tables if none exist
      const acArea = await prisma.area.findFirst({
        where: { name: 'A/C', floorId: defaultFloor.id }
      });

      if (acArea) {
        const sampleTables = Array.from({ length: 28 }, (_, i) => ({
          tableNumber: `${i + 1}`,
          capacity: 4,
          areaId: acArea.id,
          floorId: defaultFloor.id,
          status: 'available' as const
        }));

        await prisma.table.createMany({
          data: sampleTables
        });
        console.log('Created 28 sample tables in A/C area');
      }

      // Create tables for Non A/C area
      const nonAcArea = await prisma.area.findFirst({
        where: { name: 'Non A/C', floorId: defaultFloor.id }
      });

      if (nonAcArea) {
        const nonAcTables = Array.from({ length: 9 }, (_, i) => ({
          tableNumber: `${i + 1}`,
          capacity: 4,
          areaId: nonAcArea.id,
          floorId: defaultFloor.id,
          status: 'available' as const
        }));

        await prisma.table.createMany({
          data: nonAcTables
        });
        console.log('Created 9 sample tables in Non A/C area');
      }
    }

    console.log('Table migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTables };
