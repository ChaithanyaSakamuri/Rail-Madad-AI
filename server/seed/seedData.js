import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import SlaLog from '../models/SlaLog.js';
import Escalation from '../models/Escalation.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear all collections
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await SlaLog.deleteMany({});
    await Escalation.deleteMany({});

    console.log('🗑️ Database cleared.');

    // 1. Create Admins
    const admins = [
      {
        name: 'Sakamuri Chaithanya',
        email: 'chaituchowdary301@gmail.com',
        password: 'Deepya@23',
        role: 'admin',
      },
      {
        name: 'Kilaru Rajesh',
        email: 'kilarurajesh23@gmail.com',
        password: 'Deepya@23',
        role: 'admin',
      },
      {
        name: 'Sakhamuri Deepya',
        email: 'sakhamurideepya23@gmail.com',
        password: 'Deepya@23',
        role: 'admin',
      },
      {
        name: 'Rail Madad Administrator',
        email: 'admin@railmadad.gov.in',
        password: 'Admin@123',
        role: 'admin',
      }
    ];

    const seededAdmins = [];
    for (const adminInfo of admins) {
      const admin = new User(adminInfo);
      await admin.save();
      seededAdmins.push(admin);
    }
    console.log('✅ Admins created.');

    // 2. Create Officers (TTE, Station Master, RPF, Catering, Medical)
    const officersData = [
      {
        name: 'Inspector Vikram Singh',
        email: 'rpf@railmadad.gov.in',
        password: 'Officer@123',
        role: 'officer',
        department: 'RPF',
        assignedZone: 'Northern Railway'
      },
      {
        name: 'TTE A. K. Sharma',
        email: 'tte@railmadad.gov.in',
        password: 'Officer@123',
        role: 'officer',
        department: 'TTE',
        assignedZone: 'Train 12951 (Rajdhani Express)'
      },
      {
        name: 'Station Master NDLS',
        email: 'sm@railmadad.gov.in',
        password: 'Officer@123',
        role: 'officer',
        department: 'Station Master',
        assignedZone: 'New Delhi Railway Station (NDLS)'
      },
      {
        name: 'Catering Head Suresh',
        email: 'catering@railmadad.gov.in',
        password: 'Officer@123',
        role: 'officer',
        department: 'Catering Supervisor',
        assignedZone: 'NDLS Base Kitchen'
      },
      {
        name: 'Dr. Neha Patel (Medical Lead)',
        email: 'medical@railmadad.gov.in',
        password: 'Officer@123',
        role: 'officer',
        department: 'Medical Team',
        assignedZone: 'Northern Railway Medical Unit'
      }
    ];

    const seededOfficers = {};
    for (const offInfo of officersData) {
      const officer = new User(offInfo);
      await officer.save();
      seededOfficers[offInfo.department] = officer;
    }
    console.log('✅ Officers created for all departments.');

    // 3. Create Sample Passenger
    const passenger = new User({
      name: 'Rohan Verma',
      email: 'passenger@gmail.com',
      password: 'Passenger@123',
      role: 'passenger',
      phoneNumber: '+919876543210'
    });
    await passenger.save();
    console.log('✅ Sample Passenger created (passenger@gmail.com / Passenger@123).');

    // Helper for timing
    const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000);
    const minsFuture = (m) => new Date(Date.now() + m * 60 * 1000);

    // 4. Create Seed Complaints
    const complaintsData = [
      {
        complaintId: 'RM-542109-765',
        passenger: passenger._id,
        complaintText: 'AC is not working in coach B1 of train 12951. It is extremely hot and suffocating.',
        language: 'English',
        trainNumber: '12951',
        coachNumber: 'B1',
        station: 'Kota Junction',
        category: 'Maintenance',
        priority: 'P3',
        status: 'Assigned',
        assignedOfficer: seededOfficers['TTE']._id,
        slaDeadline: minsFuture(120), // 2 hr SLA
        aiDetails: {
          confidence: 0.96,
          detectedIssue: 'AC cooling failure',
          tags: ['AC', 'Cooling', 'Suffocation']
        },
        timeline: [
          { status: 'Submitted', remark: 'Complaint registered by passenger.', timestamp: minsAgo(15) },
          { status: 'Assigned', remark: 'Auto-routed by AI to TTE A. K. Sharma.', timestamp: minsAgo(14) }
        ],
        createdAt: minsAgo(15)
      },
      {
        complaintId: 'RM-210984-321',
        passenger: passenger._id,
        complaintText: 'ट्रेन 12951 के कोच A3 में पानी नहीं आ रहा है, कृपया मदद करें।',
        language: 'Hindi',
        trainNumber: '12951',
        coachNumber: 'A3',
        station: 'Ratlam Junction',
        category: 'Maintenance',
        priority: 'P3',
        status: 'In Progress',
        assignedOfficer: seededOfficers['TTE']._id,
        slaDeadline: minsFuture(45), // 2 hr SLA (created 75 mins ago)
        aiDetails: {
          confidence: 0.94,
          detectedIssue: 'No water in toilet',
          tags: ['water', 'toilet', 'maintenance']
        },
        timeline: [
          { status: 'Submitted', remark: 'Grievance submitted by passenger.', timestamp: minsAgo(75) },
          { status: 'Assigned', remark: 'Auto-routed by AI to TTE A. K. Sharma.', timestamp: minsAgo(74) },
          { status: 'In Progress', remark: 'Officer investigating tank valves.', timestamp: minsAgo(40) }
        ],
        createdAt: minsAgo(75)
      },
      {
        complaintId: 'RM-340982-102',
        passenger: passenger._id,
        complaintText: 'Severe chest pain reported by elderly passenger in coach B2, seat 45 of train 12002. Need immediate doctor.',
        language: 'English',
        trainNumber: '12002',
        coachNumber: 'B2',
        station: 'Mathura Junction',
        category: 'Medical Emergency',
        priority: 'P1',
        status: 'In Progress',
        assignedOfficer: seededOfficers['Medical Team']._id,
        slaDeadline: minsFuture(5), // 15 mins SLA (created 10 mins ago)
        aiDetails: {
          confidence: 0.99,
          detectedIssue: 'Cardiac / chest pain medical emergency',
          tags: ['Chest pain', 'Medical emergency', 'Doctor']
        },
        timeline: [
          { status: 'Submitted', remark: 'Emergency complaint registered.', timestamp: minsAgo(10) },
          { status: 'Assigned', remark: 'Auto-routed to Medical Team Lead Neha Patel.', timestamp: minsAgo(9) },
          { status: 'In Progress', remark: 'First aid kit dispatched, station notified for medical team.', timestamp: minsAgo(5) }
        ],
        createdAt: minsAgo(10)
      },
      {
        complaintId: 'RM-109852-540',
        passenger: passenger._id,
        complaintText: 'Mobile theft in coach S3, seat 12 near Agra station. Suspect ran away.',
        language: 'English',
        trainNumber: '12002',
        coachNumber: 'S3',
        station: 'Agra Cantt',
        category: 'Safety/Crime',
        priority: 'P1', // 15 mins SLA (created 40 mins ago, breaching SLA!)
        status: 'Escalated',
        assignedOfficer: seededAdmins[3]._id, // Escalated to Admin
        slaDeadline: minsAgo(25), // Breached 25 mins ago!
        escalationLevel: 1,
        aiDetails: {
          confidence: 0.97,
          detectedIssue: 'Theft of mobile phone',
          tags: ['Theft', 'Crime', ' आगरा कैंट']
        },
        timeline: [
          { status: 'Submitted', remark: 'Complaint logged.', timestamp: minsAgo(40) },
          { status: 'Assigned', remark: 'Auto-routed to RPF Inspector Vikram Singh.', timestamp: minsAgo(39) },
          { status: 'Escalated', remark: 'SLA Breached. Auto-escalated to Level 1 Admin.', timestamp: minsAgo(25) }
        ],
        createdAt: minsAgo(40)
      },
      {
        complaintId: 'RM-876301-443',
        passenger: passenger._id,
        complaintText: 'Undercooked food served in breakfast. Rice is completely hard.',
        language: 'English',
        trainNumber: '12951',
        coachNumber: 'A1',
        station: 'New Delhi',
        category: 'Catering',
        priority: 'P4', // 24 hours SLA
        status: 'Resolved',
        assignedOfficer: seededOfficers['Catering Supervisor']._id,
        slaDeadline: minsFuture(1300), 
        aiDetails: {
          confidence: 0.92,
          detectedIssue: 'Undercooked catering food',
          tags: ['Catering', 'Food', 'Rice']
        },
        timeline: [
          { status: 'Submitted', remark: 'Grievance logged.', timestamp: minsAgo(120) },
          { status: 'Assigned', remark: 'Auto-routed to Catering Head Suresh.', timestamp: minsAgo(118) },
          { status: 'Resolved', remark: 'Undercooked breakfast replaced. Passenger satisfied.', timestamp: minsAgo(30) }
        ],
        createdAt: minsAgo(120)
      }
    ];

    for (const cData of complaintsData) {
      const complaint = new Complaint(cData);
      await complaint.save();

      // Create SLA logs
      const slaLog = new SlaLog({
        complaint: complaint._id,
        priority: complaint.priority,
        slaDeadline: complaint.slaDeadline,
        resolvedAt: complaint.status === 'Resolved' ? minsAgo(30) : null,
        breached: complaint.status === 'Escalated',
        escalationLevelReached: complaint.escalationLevel
      });
      await slaLog.save();
    }

    console.log('✅ 5 sample tickets seeded (with active, resolved, and breached statuses).');

    // 5. Create some notifications
    const notification = new Notification({
      recipient: passenger._id,
      title: 'Ticket Escalated 🚨',
      message: 'Your complaint RM-109852-540 has been escalated to Level 1 administration due to resolution delay.',
      type: 'escalation'
    });
    await notification.save();
    console.log('✅ Sample notification seeded.');

    console.log('\n🎉 Rail Madad AI Database Seeding Complete!');
    console.log('\n📝 Login Credentials for Testing:');
    console.log('   --------------------------------------------------------------');
    console.log('   Role: ADMIN');
    console.log('     Email: admin@railmadad.gov.in  | Password: Admin@123');
    console.log('     Email: chaituchowdary301@gmail.com | Password: Deepya@23');
    console.log('   --------------------------------------------------------------');
    console.log('   Role: PASSENGER');
    console.log('     Email: passenger@gmail.com     | Password: Passenger@123');
    console.log('   --------------------------------------------------------------');
    console.log('   Role: OFFICERS (Password: Officer@123 for all)');
    console.log('     Email: tte@railmadad.gov.in       (TTE - Coach Maintenance)');
    console.log('     Email: sm@railmadad.gov.in        (Station Master - Cleanliness)');
    console.log('     Email: rpf@railmadad.gov.in       (RPF Inspector - Theft/Security)');
    console.log('     Email: catering@railmadad.gov.in  (Catering Supervisor)');
    console.log('     Email: medical@railmadad.gov.in   (Medical Emergency Team)');
    console.log('   --------------------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
