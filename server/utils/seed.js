const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/courtconnect');
    console.log('Connected to DB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Case.deleteMany();
    await Hearing.deleteMany();
    await Document.deleteMany();
    await Notification.deleteMany();
    await Message.deleteMany();
    await AuditLog.deleteMany();
    console.log('Cleared existing collections.');

    // 1. Create Seed Users
    const admin = await User.create({
      name: 'Dr. Ramesh Kumar (Admin)',
      email: 'admin@courtconnect.gov.in',
      password: 'password123',
      role: 'admin',
      isVerified: true,
      phoneNumber: '9876543210',
    });

    const judge = await User.create({
      name: 'Honorable Justice Anita Devi',
      email: 'judge@courtconnect.gov.in',
      password: 'password123',
      role: 'judge',
      isVerified: true,
      phoneNumber: '9876543211',
      courtroom: 'Courtroom 3A (High Court)',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACvq68VAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYXCxMhD75j8AAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmylewAAAqNJREFUeNrt2T9oFEEUBvD3XqL+gYJiY6Vgo2AhpDHYKNgIaQs2CjZCmoI2QgpLNYJY2FgoaQs2NhYKWghpDLaCgqAomMg/RbyzOHu5y93t3e3t3eX7wHC7t7N3783Mm5l9u4cIRERERGSEtFUXwN2HkAeF/C/kgSAjQdYJ2SzklpDrQt4Qct4o9B2hJ4S+K/Qtod8I/UHoV0LffGzD6QxH3w2wO2Wf5aN/PshJIXcKjV0Ucs0QdFPI24U1eCbkqpArhXWYp2Fdh10a9nnYp9F3A/j7pC7f5aN/PMhJIe8XGrsn5Ioh6I6Qzwtr8FLINSHXCutwS8PqOtzSsLp+m4/++aCY64XGbgv5wBB0V8hXQ/wFQiI2fU7ILSHjQpaEHC22eT02L5PzT/LR/w7kJSHPDMH3hFw2xLxq5HpeCblFSDkRshP9+fO4G7C81A1YXq5X++g7D3JGyAtD8Ashlw2xXxs+vyDkDiHlhsh2hP5k2L7IerW4XtOj7yzIBSGPDEHPC3lpCHrd8Pk1IY8IKWdCDkS/f6XfV1mjw/UeHX0/hFwUctcQ9KKQ14agh0M+3xHypJByIuRJof/p8J1n7R4dvRAyHnJ4eMjnKSEPCr1Q9p/L+n/Ouh2u7+3Q1yLksBD3uVD2h4VcD4d8HhHyjJCmEF96eM+09occehHkpJDXhqB3hLwzBD0X8vmekOeENDsifPThHuv46DkRclLIe0PQq0Lec9X/Z7K9Z10eehHkhBDfeQ0PeQ0PeVPI7ZDtG/1cI/x81uhFD3ktwhpvhFnjjTBvCLlDSDMhwnceHnKe376QJyGseUbMM2LOEXOPkHuENDMi/PTwsPL8jXwhp4T8MOKZELOXmHvEPCDkESHNjAifetzU4wM89FkI/578f+D/nEREREQ0Wv4CRH9f2913nCMAAAAASUVORK5CYII=', // Dummy signature drawing base64
    });

    const lawyer = await User.create({
      name: 'Aditya Sen (Senior Advocate)',
      email: 'lawyer@courtconnect.gov.in',
      password: 'password123',
      role: 'lawyer',
      isVerified: true,
      phoneNumber: '9876543212',
      barNumber: 'BAR/DL/2018/893',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACvq68VAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYXCxMhD75j8AAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmylewAAAqNJREFUeNrt2T9oFEEUBvD3XqL+gYJiY6Vgo2AhpDHYKNgIaQs2CjZCmoI2QgpLNYJY2FgoaQs2NhYKWghpDLaCgqAomMg/RbyzOHu5y93t3e3t3eX7wHC7t7N3783Mm5l9u4cIRERERGSEtFUXwN2HkAeF/C/kgSAjQdYJ2SzklpDrQt4Qct4o9B2hJ4S+K/Qtod8I/UHoV0LffGzD6QxH3w2wO2Wf5aN/PshJIXcKjV0Ucs0QdFPI24U1eCbkqpArhXWYp2Fdh10a9nnYp9F3A/j7pC7f5aN/PMhJIe8XGrsn5Ioh6I6Qzwtr8FLINSHXCutwS8PqOtzSsLp+m4/++aCY64XGbgv5wBB0V8hXQ/wFQiI2fU7ILSHjQpaEHC22eT02L5PzT/LR/w7kJSHPDMH3hFw2xLxq5HpeCblFSDkRshP9+fO4G7C81A1YXq5X++g7D3JGyAtD8Ashlw2xXxs+vyDkDiHlhsh2hP5k2L7IerW4XtOj7yzIBSGPDEHPC3lpCHrd8Pk1IY8IKWdCDkS/f6XfV1mjw/UeHX0/hFwUctcQ9KKQ14agh0M+3xHypJByIuRJof/p8J1n7R4dvRAyHnJ4eMjnKSEPCr1Q9p/L+n/Ouh2u7+3Q1yLksBD3uVD2h4VcD4d8HhHyjJCmEF96eM+09occehHkpJDXhqB3hLwzBD0X8vmekOeENDsifPThHuv46DkRclLIe0PQq0Lec9X/Z7K9Z10eehHkhBDfeQ0PeQ0PeVPI7ZDtG/1cI/x81uhFD3ktwhpvhFnjjTBvCLlDSDMhwnceHnKe376QJyGseUbMM2LOEXOPkHuENDMi/PTwsPL8jXwhp4T8MOKZELOXmHvEPCDkESHNjAifetzU4wM89FkI/578f+D/nEREREQ0Wv4CRH9f2913nCMAAAAASUVORK5CYII=',
    });

    const citizen = await User.create({
      name: 'Vikas Sharma (Citizen)',
      email: 'citizen@courtconnect.gov.in',
      password: 'password123',
      role: 'citizen',
      isVerified: true,
      phoneNumber: '9876543213',
    });

    const respondentUser = await User.create({
      name: 'Rohan Mehra',
      email: 'rohan.mehra@gmail.com',
      password: 'password123',
      role: 'citizen',
      isVerified: true,
      phoneNumber: '9876543214',
    });

    console.log('Seed users created successfully!');

    // 2. Create Cases
    const case1 = await Case.create({
      caseNumber: 'CC-2026-10001',
      title: 'Sharma vs. Mehra Cyber Defamation Suit',
      type: 'cyber_crime',
      description: 'The respondent published defamatory remarks on social media platforms causing significant damage to the petitioner’s software consultancy business, seeking damages of 5,00,000 INR and a permanent injunction.',
      petitioner: citizen._id,
      respondentName: 'Rohan Mehra',
      respondentEmail: 'rohan.mehra@gmail.com',
      assignedLawyer: lawyer._id,
      assignedJudge: judge._id,
      priority: 'high',
      status: 'in_progress',
      filingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });

    const case2 = await Case.create({
      caseNumber: 'CC-2026-10002',
      title: 'Unauthorized Land Encroachment Petition',
      type: 'property',
      description: 'Dispute regarding property bounds on Sector 15 Plot. Petitioner alleges the respondent constructed a boundary wall encroaching 120 sq ft of agricultural land owned by the petitioner.',
      petitioner: citizen._id,
      respondentName: 'Dev Construction Ltd',
      respondentEmail: 'contact@devconstruction.in',
      assignedLawyer: lawyer._id,
      assignedJudge: judge._id,
      priority: 'medium',
      status: 'hearing_scheduled',
      filingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    });

    const case3 = await Case.create({
      caseNumber: 'CC-2026-10003',
      title: 'Vikas Sharma vs. Electromart Defective AC Dispute',
      type: 'consumer',
      description: 'Petitioner bought a 1.5 Ton Split AC which broke down within 10 days. Retailer and brand refused servicing/replacement under warranty terms. Seeking refund and mental agony compensation.',
      petitioner: citizen._id,
      respondentName: 'Electromart Retailers',
      respondentEmail: 'complaints@electromart.co.in',
      priority: 'low',
      status: 'filed',
      filingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    });

    console.log('Seed cases created successfully!');

    // 3. Create Hearings
    const hearing1 = await Hearing.create({
      caseId: case1._id,
      hearingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (completed)
      hearingTime: '10:00 AM',
      courtroom: 'Courtroom 3A (High Court)',
      judge: judge._id,
      purpose: 'First Hearing: Admission of Petition & Evidence Validation',
      status: 'completed',
      remarks: 'Filing papers inspected. Petitioner Counsel presented initial social media screenshot transcripts. Respondent counsel requests time to file counter-affidavit. Adjourned to next date.',
    });

    const hearing2 = await Hearing.create({
      caseId: case1._id,
      hearingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      hearingTime: '11:30 AM',
      courtroom: 'Courtroom 3A (High Court)',
      judge: judge._id,
      purpose: 'Second Hearing: Counter-affidavit verification & WebRTC Cross Examination',
      status: 'upcoming',
    });

    const hearing3 = await Hearing.create({
      caseId: case2._id,
      hearingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      hearingTime: '02:00 PM',
      courtroom: 'Courtroom 3A (High Court)',
      judge: judge._id,
      purpose: 'Land surveyor report inspection and maps review',
      status: 'upcoming',
    });

    console.log('Seed hearings created successfully!');

    // 4. Create Documents
    const doc1 = await Document.create({
      caseId: case1._id,
      name: 'Petition_Complaint_CyberDefamation.pdf',
      type: 'petition',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: 'pdf',
      uploadedBy: citizen._id,
      signatures: [],
    });

    const doc2 = await Document.create({
      caseId: case1._id,
      name: 'Facebook_Posts_Screenshots.png',
      type: 'evidence',
      fileUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&w=400&h=400',
      fileType: 'png',
      uploadedBy: lawyer._id,
      signatures: [],
    });

    const doc3 = await Document.create({
      caseId: case1._id,
      name: 'FIR_OnlineHarassment_CyberCell.pdf',
      type: 'fir',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileType: 'pdf',
      uploadedBy: lawyer._id,
      signatures: [],
    });

    console.log('Seed documents created successfully!');

    // 5. Create notifications
    await Notification.create({
      recipient: citizen._id,
      title: 'Welcome to CourtConnect',
      message: 'Your citizen profile has been created and verified. You can now file new cases digitally.',
      type: 'system',
      link: '/dashboard',
    });

    await Notification.create({
      recipient: lawyer._id,
      title: 'New Case Assignment',
      message: 'You have been assigned to Case CC-2026-10001 "Sharma vs. Mehra Cyber Defamation Suit".',
      type: 'case',
      link: `/cases/${case1._id}`,
    });

    await Notification.create({
      recipient: judge._id,
      title: 'Hearing Scheduled',
      message: 'Hearing scheduled for Case CC-2026-10002 on sector plots land bounds.',
      type: 'hearing',
      link: `/cases/${case2._id}`,
    });

    // 6. Create Audit Logs
    await AuditLog.create({
      userId: admin._id,
      action: 'SYSTEM_SEED',
      details: 'Populated MongoDB collections with master demo dataset.',
    });

    console.log('----------------------------------------------------');
    console.log('Database seeded successfully!');
    console.log('You can now log in using the following accounts:');
    console.log(`- ADMIN:   admin@courtconnect.gov.in   / password123`);
    console.log(`- JUDGE:   judge@courtconnect.gov.in   / password123`);
    console.log(`- LAWYER:  lawyer@courtconnect.gov.in  / password123`);
    console.log(`- CITIZEN: citizen@courtconnect.gov.in / password123`);
    console.log('----------------------------------------------------');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedData();
