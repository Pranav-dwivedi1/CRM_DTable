const User = require('../models/User');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');

// Log user activity helper
const logUserActivity = async (req, userId, action, targetType, targetId, metadata) => {
  try {
    await ActivityLog.create({
      companyId: req.user.companyId,
      userId: req.user._id,
      userName: req.user.name,
      action,
      targetType,
      targetId,
      metadata
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = {};

    if (role === 'masterAdmin') {
      // Sees all company users (tenant scoping is handled by plugin)
      query = {};
    } else if (role === 'manager') {
      // Sees themselves and employees on their team
      query = {
        $or: [
          { _id: _id },
          { managerId: _id }
        ]
      };
    } else {
      return res.status(403).json({ success: false, message: 'Access denied: Employees cannot view user lists' });
    }

    const users = await User.find(query).populate('managerId', 'name email');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    const currentUser = req.user;

    // Email check (globally unique)
    const emailExists = await User.findOne({ email }).setOptions({ bypassTenant: true });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address is already in use' });
    }

    // Role-based construction checks
    let userRole = role;
    let finalManagerId = managerId;

    if (currentUser.role === 'manager') {
      // Managers can only create employees under themselves
      userRole = 'employee';
      finalManagerId = currentUser._id;
    } else if (currentUser.role === 'masterAdmin') {
      if (userRole === 'employee' && !finalManagerId) {
        return res.status(400).json({ success: false, message: 'An employee must be assigned to a manager' });
      }
      if (userRole !== 'employee') {
        finalManagerId = undefined; // Managers/Admins don't have managerId
      }
    }

    const newUser = await User.create({
      companyId: currentUser.companyId,
      name,
      email,
      password,
      role: userRole,
      managerId: finalManagerId,
      status: 'active'
    });

    // Clean password from return object
    newUser.password = undefined;

    await logUserActivity(
      req,
      newUser._id,
      'USER_CREATED',
      'User',
      newUser._id,
      { name: newUser.name, role: newUser.role }
    );

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, managerId, password } = req.body;
    const currentUser = req.user;

    // Load user to modify
    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Auth validation
    if (currentUser.role === 'manager') {
      // Managers can only edit employees in their own team
      if (userToEdit.role !== 'employee' || userToEdit.managerId.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only edit employees in your team' });
      }
      
      // Managers cannot change role or managerId of their employee
      if (role && role !== 'employee') {
        return res.status(403).json({ success: false, message: 'Access denied: Managers cannot modify user roles' });
      }
    }

    // Email check if modifying email
    if (email && email.toLowerCase() !== userToEdit.email.toLowerCase()) {
      const emailExists = await User.findOne({ email }).setOptions({ bypassTenant: true });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email address is already in use' });
      }
      userToEdit.email = email;
    }

    if (name) userToEdit.name = name;
    if (password) userToEdit.password = password; // pre-save hook will hash it

    if (currentUser.role === 'masterAdmin') {
      if (role) {
        userToEdit.role = role;
        if (role !== 'employee') {
          userToEdit.managerId = undefined;
        }
      }
      if (role === 'employee' || (userToEdit.role === 'employee' && managerId)) {
        if (!managerId && !userToEdit.managerId) {
          return res.status(400).json({ success: false, message: 'An employee must be assigned to a manager' });
        }
        if (managerId) userToEdit.managerId = managerId;
      }
    }

    await userToEdit.save();
    
    // Hide password
    userToEdit.password = undefined;

    await logUserActivity(
      req,
      userToEdit._id,
      'USER_UPDATED',
      'User',
      userToEdit._id,
      { name: userToEdit.name, role: userToEdit.role }
    );

    res.status(200).json({ success: true, data: userToEdit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive' });
    }

    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role restrictions
    if (currentUser.role === 'manager') {
      if (userToEdit.role !== 'employee' || userToEdit.managerId.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only deactivate employees in your team' });
      }
    }

    // Cannot deactivate oneself
    if (userToEdit._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    userToEdit.status = status;
    await userToEdit.save({ validateBeforeSave: false });

    await logUserActivity(
      req,
      userToEdit._id,
      status === 'active' ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
      'User',
      userToEdit._id,
      { name: userToEdit.name }
    );

    res.status(200).json({ success: true, message: `User status changed to ${status}`, data: userToEdit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Master Admin only (checked in route configuration by authorize, but verify here too)
    if (req.user.role !== 'masterAdmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Only Master Admin can delete users' });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has active assigned leads
    const assignedLeadsCount = await Lead.countDocuments({ assignedTo: id });
    if (assignedLeadsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user: They are assigned to ${assignedLeadsCount} active lead(s). Please reassign their leads first.`
      });
    }

    // Perform deletion
    await User.deleteOne({ _id: id });

    await logUserActivity(
      req,
      id,
      'USER_DELETED',
      'User',
      id,
      { name: userToDelete.name, email: userToDelete.email }
    );

    res.status(200).json({ success: true, message: 'User successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
};
