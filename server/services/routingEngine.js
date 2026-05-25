import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

/**
 * Maps a complaint category to an officer department
 */
export const getDepartmentForCategory = (category) => {
  switch (category) {
    case 'Cleanliness':
      return 'Station Master';
    case 'Maintenance':
      return 'TTE';
    case 'Safety/Crime':
      return 'RPF';
    case 'Catering':
      return 'Catering Supervisor';
    case 'Medical Emergency':
      return 'Medical Team';
    default:
      return 'Station Master'; // Fallback to Station Master
  }
};

/**
 * Automatically finds and assigns an available officer for a complaint
 * based on category, availability, and current workload.
 */
export const assignOfficerToComplaint = async (complaint) => {
  try {
    const targetDept = getDepartmentForCategory(complaint.category);
    
    // Find all available officers in the target department
    let officers = await User.find({
      role: 'officer',
      department: targetDept,
      isAvailable: true
    });
    
    // If no officers in the specific department are available, look for any available officer
    if (officers.length === 0) {
      officers = await User.find({
        role: 'officer',
        isAvailable: true
      });
    }
    
    // If still no officers, look for admin users as a last resort
    if (officers.length === 0) {
      officers = await User.find({ role: 'admin' });
    }
    
    if (officers.length === 0) {
      console.warn('⚠️ No officers or admins found in the system to route the complaint.');
      return null;
    }
    
    // Find workload for each candidate (count of unresolved tickets)
    const officerWorkloads = await Promise.all(
      officers.map(async (officer) => {
        const count = await Complaint.countDocuments({
          assignedOfficer: officer._id,
          status: { $in: ['Assigned', 'In Progress'] }
        });
        return { officer, count };
      })
    );
    
    // Sort officers by workload ascending (round-robin / least busy)
    officerWorkloads.sort((a, b) => a.count - b.count);
    
    const assigned = officerWorkloads[0].officer;
    return assigned;
  } catch (error) {
    console.error('❌ Error in routing engine:', error);
    return null;
  }
};
