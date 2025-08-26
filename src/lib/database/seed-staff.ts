import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedStaff() {
  try {
    console.log('🌱 Seeding staff data...');

    // Sample staff data
    const staffData = [
      {
        username: 'john.manager',
        password: 'password123',
        fullName: 'John Manager',
        email: 'john.manager@horder.com',
        phone: '+1 (555) 123-4567',
        role: 'Manager',
        employeeId: 'EMP001',
        salary: 4500.00,
        shiftStart: '09:00',
        shiftEnd: '17:00',
        address: '123 Main St, City, State 12345',
        additionalDetails: 'Experienced restaurant manager with 5+ years in the industry.',
      },
      {
        username: 'sarah.cashier',
        password: 'password123',
        fullName: 'Sarah Cashier',
        email: 'sarah.cashier@horder.com',
        phone: '+1 (555) 234-5678',
        role: 'Cashier',
        employeeId: 'EMP002',
        salary: 2800.00,
        shiftStart: '08:00',
        shiftEnd: '16:00',
        address: '456 Oak Ave, City, State 12345',
        additionalDetails: 'Friendly cashier with excellent customer service skills.',
      },
      {
        username: 'mike.kitchen',
        password: 'password123',
        fullName: 'Mike Kitchen',
        email: 'mike.kitchen@horder.com',
        phone: '+1 (555) 345-6789',
        role: 'Kitchen Staff',
        employeeId: 'EMP003',
        salary: 3200.00,
        shiftStart: '10:00',
        shiftEnd: '18:00',
        address: '789 Pine Rd, City, State 12345',
        additionalDetails: 'Skilled chef with expertise in Italian cuisine.',
      },
      {
        username: 'lisa.staff',
        password: 'password123',
        fullName: 'Lisa Staff',
        email: 'lisa.staff@horder.com',
        phone: '+1 (555) 456-7890',
        role: 'Staff',
        employeeId: 'EMP004',
        salary: 2500.00,
        shiftStart: '11:00',
        shiftEnd: '19:00',
        address: '321 Elm St, City, State 12345',
        additionalDetails: 'Reliable staff member with great teamwork skills.',
      },
      {
        username: 'david.waiter',
        password: 'password123',
        fullName: 'David Waiter',
        email: 'david.waiter@horder.com',
        phone: '+1 (555) 567-8901',
        role: 'Staff',
        employeeId: 'EMP005',
        salary: 2400.00,
        shiftStart: '12:00',
        shiftEnd: '20:00',
        address: '654 Maple Dr, City, State 12345',
        additionalDetails: 'Professional waiter with excellent memory for orders.',
      },
    ];

    // Create staff members
    for (const staff of staffData) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: staff.username }
      });

      if (existingUser) {
        console.log(`⚠️  User ${staff.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(staff.password, saltRounds);

      // Create user and staff in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            username: staff.username,
            passwordHash,
            fullName: staff.fullName,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
          }
        });

        // Create staff
        const staffMember = await tx.staff.create({
          data: {
            userId: user.id,
            employeeId: staff.employeeId,
            salary: staff.salary,
            shiftStart: staff.shiftStart,
            shiftEnd: staff.shiftEnd,
            address: staff.address,
            additionalDetails: staff.additionalDetails,
          }
        });

        return { user, staff: staffMember };
      });

      console.log(`✅ Created staff member: ${result.user.fullName} (${result.staff.employeeId})`);
    }

    console.log('🎉 Staff seeding completed successfully!');
    
    // Display summary
    const totalStaff = await prisma.staff.count();
    const totalUsers = await prisma.user.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Total Staff: ${totalStaff}`);
    console.log(`   - Total Users: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error seeding staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedStaff();
