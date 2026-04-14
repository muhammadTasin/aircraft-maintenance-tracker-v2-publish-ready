import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/db.js';
import User from '../models/User.js';
import Aircraft from '../models/Aircraft.js';
import MaintenanceTask from '../models/MaintenanceTask.js';
import Defect from '../models/Defect.js';
import { generateReference } from '../utils/generateReference.js';

dotenv.config();

async function seed() {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Aircraft.deleteMany({}),
    MaintenanceTask.deleteMany({}),
    Defect.deleteMany({}),
  ]);

  const adminPassword = await bcrypt.hash('Admin1234', 10);
  const adminUser = await User.create({
    name: 'Chief Engineer',
    email: 'admin@demoairline.com',
    password: adminPassword,
    role: 'Admin',
    certificateNumber: 'CERT-001',
    station: 'DAC',
  });

  const aircraft = await Aircraft.insertMany([
    {
      registration: 'S2-ACT',
      manufacturer: 'Airbus',
      model: 'A320neo',
      serialNumber: 'MSN-320-001',
      status: 'Serviceable',
      airworthinessStatus: 'Airworthy',
      location: 'Dhaka',
      baseStation: 'Dhaka',
      lastInspectionDate: new Date('2026-04-10'),
      nextCheckType: 'A-Check',
      nextCheckDueDate: new Date('2026-04-20'),
      totalFlightHours: 15234,
      totalFlightCycles: 8941,
      history: [
        {
          action: 'Aircraft Created',
          details: 'Seed data created for S2-ACT.',
          createdBy: 'System',
          actorRole: 'System',
          severity: 'Info',
          reference: 'S2-ACT',
          timestamp: new Date(),
        },
      ],
    },
    {
      registration: 'S2-AOG',
      manufacturer: 'Boeing',
      model: '737-800',
      serialNumber: 'MSN-738-014',
      status: 'AOG',
      airworthinessStatus: 'Not Airworthy',
      location: 'Chittagong',
      baseStation: 'Dhaka',
      lastInspectionDate: new Date('2026-04-08'),
      nextCheckType: 'Transit',
      nextCheckDueDate: new Date('2026-04-14'),
      totalFlightHours: 28112,
      totalFlightCycles: 16224,
      history: [
        {
          action: 'Aircraft Created',
          details: 'Seed data created for S2-AOG.',
          createdBy: 'System',
          actorRole: 'System',
          severity: 'Critical',
          reference: 'S2-AOG',
          timestamp: new Date(),
        },
      ],
    },
    {
      registration: 'S2-UNS',
      manufacturer: 'ATR',
      model: '72-600',
      serialNumber: 'MSN-ATR-022',
      status: 'Unserviceable',
      airworthinessStatus: 'Restricted',
      location: 'Coxs Bazar',
      baseStation: 'Dhaka',
      lastInspectionDate: new Date('2026-04-11'),
      nextCheckType: 'Daily',
      nextCheckDueDate: new Date('2026-04-16'),
      totalFlightHours: 9612,
      totalFlightCycles: 7220,
      history: [
        {
          action: 'Aircraft Created',
          details: 'Seed data created for S2-UNS.',
          createdBy: 'System',
          actorRole: 'System',
          severity: 'Warning',
          reference: 'S2-UNS',
          timestamp: new Date(),
        },
      ],
    },
  ]);

  await MaintenanceTask.insertMany([
    {
      taskNumber: generateReference('TASK'),
      aircraft: aircraft[0]._id,
      title: 'A-check preparation pack',
      description: 'Prepare tooling, manpower allocation, and material readiness.',
      category: 'Scheduled',
      priority: 'High',
      dueDate: new Date('2026-04-18'),
      dueFlightHours: 15240,
      dueFlightCycles: 8945,
      status: 'In Progress',
      assignedEngineer: 'Line Team Alpha',
      maintenanceType: 'A-Check',
      workPackage: 'A-CHECK-0426',
      estimatedHours: 10,
      actualHours: 4,
      requiresSignOff: true,
      createdBy: adminUser._id,
    },
    {
      taskNumber: generateReference('TASK'),
      aircraft: aircraft[1]._id,
      title: 'Dispatch release recovery inspection',
      description: 'Unscheduled inspection after hydraulic system discrepancy.',
      category: 'Repair',
      priority: 'Critical',
      dueDate: new Date('2026-04-12'),
      status: 'Completed Pending Sign-off',
      assignedEngineer: 'Recovery Team',
      maintenanceType: 'Unscheduled',
      workPackage: 'AOG-REC-01',
      estimatedHours: 8,
      actualHours: 7.5,
      requiresSignOff: true,
      completedAt: new Date('2026-04-13'),
      completedBy: adminUser._id,
      completedByName: adminUser.name,
      createdBy: adminUser._id,
    },
    {
      taskNumber: generateReference('TASK'),
      aircraft: aircraft[2]._id,
      title: 'Deferred cabin pressure indication check',
      description: 'Monitor and rectify pressure indication discrepancy.',
      category: 'Deferred',
      priority: 'Medium',
      dueDate: new Date('2026-04-15'),
      status: 'Open',
      assignedEngineer: 'Shift B',
      maintenanceType: 'Troubleshooting',
      workPackage: 'MCC-DEF-12',
      estimatedHours: 3,
      actualHours: 0,
      requiresSignOff: false,
      createdBy: adminUser._id,
    },
  ]);

  await Defect.insertMany([
    {
      defectNumber: generateReference('DEF'),
      aircraft: aircraft[1]._id,
      title: 'Hydraulic leak at left main gear bay',
      description: 'Observed leak during turnaround inspection.',
      priority: 'Critical',
      status: 'Open',
      impact: 'AOG',
      ataChapter: '29-00',
      reportedBy: adminUser._id,
    },
    {
      defectNumber: generateReference('DEF'),
      aircraft: aircraft[2]._id,
      title: 'Cabin pressure indication intermittent',
      description: 'Indication intermittently fails during climb.',
      priority: 'High',
      status: 'Deferred',
      impact: 'Serviceable With Restrictions',
      ataChapter: '21-30',
      deferredUntil: new Date('2026-04-17'),
      reportedBy: adminUser._id,
    },
  ]);

  console.log('Demo seed complete.');
  console.log('Admin login: admin@demoairline.com / Admin1234');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
