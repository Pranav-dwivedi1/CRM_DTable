require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const RefreshToken = require('../models/RefreshToken');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected.');

    // 1. Clear existing data
    console.log('Clearing existing collections...');
    await Company.deleteMany({});
    await User.deleteMany({});
    await Lead.deleteMany({});
    await ActivityLog.deleteMany({});
    await RefreshToken.deleteMany({});
    console.log('Collections cleared.');

    // 2. Create Companies
    console.log('Seeding company "AeroCorp" and "ByteTech"...');
    const aeroCorp = await Company.create({
      name: 'AeroCorp Ltd',
      timezone: 'America/New_York',
      leadSources: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'],
      leadStatuses: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost']
    });

    const byteTech = await Company.create({
      name: 'ByteTech Solutions',
      timezone: 'Europe/London',
      leadSources: ['Inbound Email', 'LinkedIn Outreach', 'Partner Referral'],
      leadStatuses: ['Lead Seeding', 'Active Discussion', 'Contract Offered', 'Closed Won', 'Closed Lost']
    });

    // 3. Create Users for AeroCorp
    console.log('Seeding users for AeroCorp...');
    
    const adminAero = await User.create({
      companyId: aeroCorp._id,
      name: 'Alice Admin',
      email: 'admin@aerocorp.com',
      password: 'password123',
      role: 'masterAdmin',
      status: 'active'
    });

    const managerAero = await User.create({
      companyId: aeroCorp._id,
      name: 'Bob Manager',
      email: 'manager@aerocorp.com',
      password: 'password123',
      role: 'manager',
      status: 'active'
    });

    const employee1Aero = await User.create({
      companyId: aeroCorp._id,
      name: 'Charlie Employee',
      email: 'employee1@aerocorp.com',
      password: 'password123',
      role: 'employee',
      managerId: managerAero._id,
      status: 'active'
    });

    const employee2Aero = await User.create({
      companyId: aeroCorp._id,
      name: 'Diana Employee',
      email: 'employee2@aerocorp.com',
      password: 'password123',
      role: 'employee',
      managerId: managerAero._id,
      status: 'active'
    });

    // 4. Create Users for ByteTech (To test multi-tenant separation)
    console.log('Seeding users for ByteTech...');
    const adminByte = await User.create({
      companyId: byteTech._id,
      name: 'Zack ByteAdmin',
      email: 'admin@bytetech.com',
      password: 'password123',
      role: 'masterAdmin',
      status: 'active'
    });

    // 5. Create Leads for AeroCorp
    console.log('Seeding leads for AeroCorp...');

    // Lead 1: Charlie's Lead (New)
    const lead1 = await Lead.create({
      companyId: aeroCorp._id,
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      phone: '+1 555-0199',
      clientCompanyName: 'JD Consulting',
      source: 'Website',
      status: 'New',
      assignedTo: employee1Aero._id,
      createdBy: employee1Aero._id,
      priority: 'high',
      estimatedValue: 5000,
      tags: ['SaaS', 'Q3 Deal']
    });

    // Lead 2: Charlie's Lead (Won)
    const lead2 = await Lead.create({
      companyId: aeroCorp._id,
      name: 'Jane Smith',
      email: 'jane.smith@corporation.com',
      phone: '+1 555-0210',
      clientCompanyName: 'Global Corp',
      source: 'Referral',
      status: 'Won',
      assignedTo: employee1Aero._id,
      createdBy: employee1Aero._id,
      priority: 'high',
      estimatedValue: 25000,
      tags: ['Enterprise', 'Core System'],
      notes: [
        {
          text: 'Initial outreach call completed. Client is very interested.',
          authorId: employee1Aero._id,
          authorName: employee1Aero.name,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          text: 'Proposal submitted for standard package.',
          authorId: employee1Aero._id,
          authorName: employee1Aero.name,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          text: 'Deal signed! Contract finalized.',
          authorId: employee1Aero._id,
          authorName: employee1Aero.name,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Lead 3: Diana's Lead (Qualified)
    const lead3 = await Lead.create({
      companyId: aeroCorp._id,
      name: 'Arthur Pendragon',
      email: 'arthur@camelot.org',
      phone: '+44 7911 123456',
      clientCompanyName: 'Camelot IT Services',
      source: 'Social Media',
      status: 'Qualified',
      assignedTo: employee2Aero._id,
      createdBy: employee2Aero._id,
      priority: 'medium',
      estimatedValue: 12000,
      tags: ['Outsource', 'UK Market'],
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Tomorrow
    });

    // Lead 4: Bob's Lead (Proposal Sent)
    const lead4 = await Lead.create({
      companyId: aeroCorp._id,
      name: 'Elena Gilbert',
      email: 'elena@salvatore.com',
      phone: '+1 555-0811',
      clientCompanyName: 'Mystic Falls Web',
      source: 'Cold Call',
      status: 'Proposal Sent',
      assignedTo: managerAero._id,
      createdBy: managerAero._id,
      priority: 'low',
      estimatedValue: 3500,
      tags: ['Small Biz'],
      followUpDate: new Date() // Today
    });

    // Lead 5: Unassigned Lead (Created by Admin)
    const lead5 = await Lead.create({
      companyId: aeroCorp._id,
      name: 'Victor Frankenstein',
      email: 'victor@monsters-inc.com',
      clientCompanyName: 'Frankenstein Labs',
      source: 'Other',
      status: 'Contacted',
      assignedTo: adminAero._id,
      createdBy: adminAero._id,
      priority: 'medium',
      estimatedValue: 0
    });

    // 6. Create Leads for ByteTech
    console.log('Seeding leads for ByteTech...');
    await Lead.create({
      companyId: byteTech._id,
      name: 'Bruce Wayne',
      email: 'bruce@waynecorp.com',
      clientCompanyName: 'Wayne Enterprises',
      source: 'Partner Referral',
      status: 'Closed Won',
      assignedTo: adminByte._id,
      createdBy: adminByte._id,
      priority: 'high',
      estimatedValue: 150000
    });

    // 7. Seed Activity Logs for AeroCorp
    console.log('Seeding activity logs for AeroCorp...');
    await ActivityLog.create([
      {
        companyId: aeroCorp._id,
        userId: employee1Aero._id,
        userName: employee1Aero.name,
        action: 'LEAD_CREATED',
        targetType: 'Lead',
        targetId: lead1._id,
        metadata: { name: lead1.name, status: lead1.status },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: employee1Aero._id,
        userName: employee1Aero.name,
        action: 'LEAD_CREATED',
        targetType: 'Lead',
        targetId: lead2._id,
        metadata: { name: lead2.name, status: 'New' },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: employee1Aero._id,
        userName: employee1Aero.name,
        action: 'LEAD_NOTE_ADDED',
        targetType: 'Lead',
        targetId: lead2._id,
        metadata: { noteText: 'Initial outreach call completed. Client is very interested.' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: employee1Aero._id,
        userName: employee1Aero.name,
        action: 'LEAD_UPDATED',
        targetType: 'Lead',
        targetId: lead2._id,
        metadata: { status: { from: 'New', to: 'Proposal Sent' } },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: employee1Aero._id,
        userName: employee1Aero.name,
        action: 'LEAD_UPDATED',
        targetType: 'Lead',
        targetId: lead2._id,
        metadata: { status: { from: 'Proposal Sent', to: 'Won' } },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: employee2Aero._id,
        userName: employee2Aero.name,
        action: 'LEAD_CREATED',
        targetType: 'Lead',
        targetId: lead3._id,
        metadata: { name: lead3.name, status: lead3.status },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        companyId: aeroCorp._id,
        userId: managerAero._id,
        userName: managerAero.name,
        action: 'LEAD_CREATED',
        targetType: 'Lead',
        targetId: lead4._id,
        metadata: { name: lead4.name, status: lead4.status },
        createdAt: new Date(Date.now() - 6 * 12 * 60 * 60 * 1000)
      }
    ]);

    console.log('Database seeded successfully.');
    console.log('\n================ SEEDED USER LOGINS ================');
    console.log('Company: AeroCorp Ltd');
    console.log('  Master Admin: admin@aerocorp.com / password123');
    console.log('  Manager:      manager@aerocorp.com / password123');
    console.log('  Employee 1:   employee1@aerocorp.com / password123');
    console.log('  Employee 2:   employee2@aerocorp.com / password123');
    console.log('\nCompany: ByteTech Solutions');
    console.log('  Master Admin: admin@bytetech.com / password123');
    console.log('=====================================================\n');

    await mongoose.disconnect();
    console.log('Mongoose disconnected.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
