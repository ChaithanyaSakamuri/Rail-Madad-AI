import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import SlaLog from '../models/SlaLog.js';
import auth from '../middleware/auth.js';
import { assignOfficerToComplaint } from '../services/routingEngine.js';
import { getIO } from '../socket/socketHandler.js';

const router = express.Router();

// Setup Multer for image upload (save to local uploads folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Helper to calculate SLA deadline
const calculateSlaDeadline = (priority) => {
  const now = new Date();
  switch (priority) {
    case 'P1': // 15 mins
      return new Date(now.getTime() + 15 * 60 * 1000);
    case 'P2': // 30 mins
      return new Date(now.getTime() + 30 * 60 * 1000);
    case 'P3': // 2 hours
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    case 'P4': // 24 hours
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
};

// ─── Submit Complaint ────────────────────────────────────────────────────────
router.post('/create', auth, upload.single('image'), async (req, res) => {
  try {
    const { complaintText } = req.body;
    if (!complaintText) {
      return res.status(400).json({ message: 'Complaint text is required' });
    }

    let aiData = {
      language: 'English',
      trainNumber: '',
      coachNumber: '',
      station: '',
      issueType: 'Grievance',
      category: 'General',
      priority: 'P4',
      confidence: 1.0
    };

    // Forward to Python AI microservice
    try {
      const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/nlp/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: complaintText })
      });
      if (response.ok) {
        aiData = await response.json();
      } else {
        console.warn('⚠️ Python AI service returned non-OK status. Using local fallback NLP.');
      }
    } catch (err) {
      console.warn('⚠️ Python AI service unreachable. Using local fallback NLP. Error:', err.message);
    }

    // Process image analysis if image exists and AI service is running
    let visualData = null;
    let imageUrl = '';
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      try {
        // Forward image file to Python FastAPI microservice
        const form = new FormData();
        const fileBuffer = fs.readFileSync(req.file.path);
        const blob = new Blob([fileBuffer], { type: req.file.mimetype });
        form.append('file', blob, req.file.filename);

        const imgResponse = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/nlp/analyze-image`, {
          method: 'POST',
          body: form
        });
        
        if (imgResponse.ok) {
          visualData = await imgResponse.json();
          if (visualData.success) {
            aiData.category = visualData.category;
            aiData.issueType = visualData.detectedIssue;
          }
        }
      } catch (err) {
        console.warn('⚠️ Image analysis failed. Visual classifier bypassed:', err.message);
      }
    }

    // Calculate SLA
    const slaDeadline = calculateSlaDeadline(aiData.priority);
    const complaintId = `RM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const complaint = new Complaint({
      complaintId,
      passenger: req.user.id,
      complaintText,
      language: aiData.language,
      trainNumber: aiData.trainNumber,
      coachNumber: aiData.coachNumber,
      station: aiData.station,
      category: aiData.category,
      priority: aiData.priority,
      imageUrl,
      slaDeadline,
      aiDetails: {
        confidence: aiData.confidence,
        detectedIssue: aiData.issueType,
        tags: visualData?.tags || [],
        visualConfidence: visualData?.visualConfidence || 0.0
      },
      timeline: [{
        status: 'Submitted',
        remark: 'Complaint registered via passenger portal.',
        timestamp: new Date()
      }]
    });

    // Auto routing officer assignment
    const officer = await assignOfficerToComplaint(complaint);
    if (officer) {
      complaint.assignedOfficer = officer._id;
      complaint.status = 'Assigned';
      complaint.timeline.push({
        status: 'Assigned',
        remark: `AI Routed to ${officer.name} (${officer.department})`,
        timestamp: new Date()
      });
    }

    await complaint.save();

    // Create SLA Log
    const slaLog = new SlaLog({
      complaint: complaint._id,
      priority: complaint.priority,
      slaDeadline: complaint.slaDeadline
    });
    await slaLog.save();

    // Create passenger notification
    const passNotify = new Notification({
      recipient: req.user.id,
      title: 'Complaint Registered 🎫',
      message: `Your complaint has been logged with ID ${complaint.complaintId}. Priority: ${complaint.priority}. Officer assigned: ${officer ? officer.name : 'Pending Assignment'}.`,
      type: 'complaint_status',
      complaint: complaint._id
    });
    await passNotify.save();

    // Notify Officer
    if (officer) {
      const offNotify = new Notification({
        recipient: officer._id,
        title: 'New Complaint Assigned 📥',
        message: `New ticket ${complaint.complaintId} has been routed to you. Category: ${complaint.category}. Train: ${complaint.trainNumber || 'N/A'}.`,
        type: 'new_assignment',
        complaint: complaint._id
      });
      await offNotify.save();

      // Emit to Officer room
      const io = getIO();
      if (io) {
        io.to(officer._id.toString()).emit('new_notification', offNotify);
        io.to(officer._id.toString()).emit('complaint_assigned', complaint);
      }
    }

    // Emit live update to admins and general dashboards
    const io = getIO();
    if (io) {
      io.to('admins').emit('new_complaint', complaint);
      io.to(req.user.id.toString()).emit('new_notification', passNotify);
    }

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Fetch User Complaints ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let complaints = [];
    if (req.user.role === 'passenger') {
      complaints = await Complaint.find({ passenger: req.user.id })
        .populate('assignedOfficer', 'name department phoneNumber')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'officer') {
      complaints = await Complaint.find({ assignedOfficer: req.user.id })
        .populate('passenger', 'name email phoneNumber')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'admin') {
      complaints = await Complaint.find({})
        .populate('passenger', 'name email phoneNumber')
        .populate('assignedOfficer', 'name department phoneNumber')
        .sort({ createdAt: -1 });
    }
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Fetch Single Complaint details ──────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('passenger', 'name email phoneNumber')
      .populate('assignedOfficer', 'name department phoneNumber');
      
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Update Complaint Status (Officer/Admin) ──────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      remark: remark || `Status changed to ${status}.`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    if (status === 'Resolved') {
      // Update SLA Log
      await SlaLog.findOneAndUpdate(
        { complaint: complaint._id },
        { resolvedAt: new Date() }
      );
    }

    await complaint.save();

    // Notify Passenger
    const notifyPassenger = new Notification({
      recipient: complaint.passenger,
      title: 'Complaint Update 📢',
      message: `Your complaint ${complaint.complaintId} status has been updated to "${status}". Remark: ${remark || 'None'}`,
      type: 'complaint_status',
      complaint: complaint._id
    });
    await notifyPassenger.save();

    // Socket updates
    const io = getIO();
    if (io) {
      io.emit('complaint_updated', complaint);
      io.to(complaint.passenger.toString()).emit('new_notification', notifyPassenger);
    }

    res.json({ message: 'Complaint updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Manual Escalation Overrides ──────────────────────────────────────────────
router.post('/:id/escalate', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const currentLevel = complaint.escalationLevel;
    if (currentLevel >= 3) {
      return res.status(400).json({ message: 'Complaint is already at maximum escalation level' });
    }

    const nextLevel = currentLevel + 1;
    const adminOfficer = await User.findOne({ role: 'admin' });

    complaint.escalationLevel = nextLevel;
    complaint.status = 'Escalated';
    if (adminOfficer) {
      complaint.assignedOfficer = adminOfficer._id;
    }

    complaint.timeline.push({
      status: 'Escalated',
      remark: `Manually escalated by Admin ${req.user.email}. Level ${currentLevel} ➔ ${nextLevel}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    await complaint.save();

    const passNotification = new Notification({
      recipient: complaint.passenger,
      title: 'Ticket Manually Escalated 🚨',
      message: `Your complaint ${complaint.complaintId} was manually escalated to Level ${nextLevel} by administration.`,
      type: 'escalation',
      complaint: complaint._id
    });
    await passNotification.save();

    const io = getIO();
    if (io) {
      io.emit('complaint_updated', complaint);
      io.to(complaint.passenger.toString()).emit('new_notification', passNotification);
    }

    res.json({ message: 'Complaint escalated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Notifications Routes ────────────────────────────────────────────────────
router.get('/notifications/me', auth, async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/notifications/mark-read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.json({ message: 'Notifications marked read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
