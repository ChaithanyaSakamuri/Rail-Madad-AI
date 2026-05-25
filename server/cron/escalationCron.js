import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Escalation from '../models/Escalation.js';
import SlaLog from '../models/SlaLog.js';
import Notification from '../models/Notification.js';
import { getIO } from '../socket/socketHandler.js';

// Map escalation levels to descriptions
const ESCALATION_LEVELS = {
  1: { role: 'officer', title: 'Senior Supervisor', dept: 'General Admin' },
  2: { role: 'officer', title: 'Divisional Railway Manager (DRM)', dept: 'General Admin' },
  3: { role: 'admin', title: 'Railway Ministry Portal', dept: 'General Admin' },
};

export const initEscalationCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Running SLA Escalation Engine scan...');
    try {
      const now = new Date();
      
      // Find all unresolved complaints that have passed their SLA deadline
      const breachedComplaints = await Complaint.find({
        status: { $in: ['Submitted', 'Assigned', 'In Progress', 'Escalated'] },
        slaDeadline: { $lt: now },
        escalationLevel: { $lt: 3 } // Max escalation level is 3
      });

      if (breachedComplaints.length === 0) {
        console.log('✅ No breached complaints found.');
        return;
      }

      console.log(`⚠️ Found ${breachedComplaints.length} complaints breaching SLA. Initiating escalation...`);

      for (const complaint of breachedComplaints) {
        const oldOfficerId = complaint.assignedOfficer;
        const oldLevel = complaint.escalationLevel;
        const newLevel = oldLevel + 1;
        
        // Find escalation officer target
        let escalatedOfficer = null;
        
        // Find senior officers or admins
        if (newLevel === 3) {
          // Ministry escalation -> Find any admin
          escalatedOfficer = await User.findOne({ role: 'admin' });
        } else {
          // Level 1 or 2 -> Find any officer with senior designation or another available department lead, or fallback to admin
          escalatedOfficer = await User.findOne({ 
            role: 'officer', 
            department: complaint.category === 'General' ? 'General Admin' : complaint.category,
            isAvailable: true 
          });
          
          if (!escalatedOfficer) {
            escalatedOfficer = await User.findOne({ role: 'admin' });
          }
        }

        // Apply escalation updates
        complaint.escalationLevel = newLevel;
        complaint.status = 'Escalated';
        complaint.assignedOfficer = escalatedOfficer ? escalatedOfficer._id : oldOfficerId;
        
        // Record in timeline
        const remark = `SLA Breached. Auto-escalated from Level ${oldLevel} to Level ${newLevel}. Assigned to ${escalatedOfficer ? escalatedOfficer.name : 'System Admin'}.`;
        complaint.timeline.push({
          status: 'Escalated',
          remark,
          timestamp: new Date()
        });
        
        await complaint.save();

        // Log escalation event
        const escalationLog = new Escalation({
          complaint: complaint._id,
          escalatedFrom: oldOfficerId,
          escalatedTo: escalatedOfficer ? escalatedOfficer._id : null,
          escalationLevel: newLevel,
          reason: `SLA Breached. SLA Deadline was: ${complaint.slaDeadline.toLocaleTimeString()}`,
          escalatedAt: new Date()
        });
        await escalationLog.save();

        // Update SLA log
        await SlaLog.findOneAndUpdate(
          { complaint: complaint._id },
          { breached: true, escalationLevelReached: newLevel },
          { upsert: true }
        );

        // Notifications
        // 1. Notify Passenger
        const passNotification = new Notification({
          recipient: complaint.passenger,
          title: 'Complaint Escalated ⚠️',
          message: `Your complaint ${complaint.complaintId} has been escalated to Level ${newLevel} (${ESCALATION_LEVELS[newLevel]?.title || 'Higher Authority'}) due to resolution delay.`,
          type: 'escalation',
          complaint: complaint._id
        });
        await passNotification.save();

        // 2. Notify New Officer
        if (escalatedOfficer) {
          const offNotification = new Notification({
            recipient: escalatedOfficer._id,
            title: 'Escalated Complaint Assigned 🚨',
            message: `Level ${newLevel} Escalation: Complaint ${complaint.complaintId} has been auto-assigned to you due to SLA breach.`,
            type: 'escalation',
            complaint: complaint._id
          });
          await offNotification.save();
        }

        // 3. Notify Old Officer
        if (oldOfficerId) {
          const oldOffNotification = new Notification({
            recipient: oldOfficerId,
            title: 'Complaint Breached SLA ⚠️',
            message: `Complaint ${complaint.complaintId} assigned to you has breached its SLA and was escalated to Level ${newLevel}.`,
            type: 'escalation',
            complaint: complaint._id
          });
          await oldOffNotification.save();
        }

        // Real-time socket broadcast
        const io = getIO();
        if (io) {
          // Broadcast update to all connected clients
          io.emit('complaint_updated', {
            complaintId: complaint.complaintId,
            status: 'Escalated',
            assignedOfficer: escalatedOfficer ? escalatedOfficer._id : null,
            message: `Complaint ${complaint.complaintId} auto-escalated to Level ${newLevel}`
          });
          
          // Emit socket notifications to specific rooms
          io.to(complaint.passenger.toString()).emit('new_notification', passNotification);
          if (escalatedOfficer) {
            io.to(escalatedOfficer._id.toString()).emit('new_notification', {
              title: 'Escalated Complaint Assigned 🚨',
              message: `Complaint ${complaint.complaintId} auto-assigned to you.`
            });
          }
        }
      }

      console.log(`✅ SLA Escalation run finished. Resolved escalations.`);
    } catch (error) {
      console.error('❌ Error running SLA escalation cron:', error);
    }
  });
};
