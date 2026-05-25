import express from 'express';
import Complaint from '../models/Complaint.js';
import SlaLog from '../models/SlaLog.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Admin protection middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    // 1. Core counters
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const pending = await Complaint.countDocuments({ status: { $in: ['Submitted', 'Assigned', 'In Progress'] } });
    const escalated = await Complaint.countDocuments({ status: 'Escalated' });

    // 2. Category distribution
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 3. Priority distribution
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 4. Status distribution
    const statusStats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 5. Zone/Station reports
    const stationStats = await Complaint.aggregate([
      { $match: { station: { $ne: '' } } },
      { $group: { _id: '$station', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 6. SLA Breach metrics
    const totalSla = await SlaLog.countDocuments();
    const breachedSla = await SlaLog.countDocuments({ breached: true });
    
    // Average resolution time (in minutes)
    const resolvedLogs = await SlaLog.find({ resolvedAt: { $ne: null } });
    let totalResolutionTime = 0;
    resolvedLogs.forEach(log => {
      const minutes = Math.floor((log.resolvedAt.getTime() - log.createdAt.getTime()) / 60000);
      totalResolutionTime += minutes;
    });
    const avgResolutionTime = resolvedLogs.length > 0 ? Math.round(totalResolutionTime / resolvedLogs.length) : 0;

    // 7. Complaint trends (group by day of submission in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const trends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 8. Officer performance ranking
    const officers = await User.find({ role: 'officer' });
    const officerPerformance = await Promise.all(
      officers.map(async (officer) => {
        const totalAssigned = await Complaint.countDocuments({ assignedOfficer: officer._id });
        const solved = await Complaint.countDocuments({ assignedOfficer: officer._id, status: 'Resolved' });
        const active = totalAssigned - solved;
        
        return {
          id: officer._id,
          name: officer.name,
          department: officer.department,
          totalAssigned,
          resolved: solved,
          pending: active,
          rate: totalAssigned > 0 ? Math.round((solved / totalAssigned) * 100) : 0
        };
      })
    );

    res.json({
      summary: {
        total,
        resolved,
        pending,
        escalated,
        avgResolutionTime,
        breachRate: totalSla > 0 ? Math.round((breachedSla / totalSla) * 100) : 0
      },
      categoryStats,
      priorityStats,
      statusStats,
      stationStats,
      trends,
      officerPerformance: officerPerformance.sort((a, b) => b.rate - a.rate).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
