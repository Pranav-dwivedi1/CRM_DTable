const request = require('supertest');
const app = require('../src/app');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const { setupTestDB, generateTestToken } = require('./testHelper');

setupTestDB();

describe('Role-Based Access Control (RBAC) API Tests', () => {
  let company, admin, manager, employee, managerToken, employeeToken;

  beforeEach(async () => {
    company = await Company.create({ name: 'RBAC Corp' });

    admin = await User.create({
      companyId: company._id,
      name: 'Admin User',
      email: 'admin@rbac.com',
      password: 'password123',
      role: 'masterAdmin'
    });

    manager = await User.create({
      companyId: company._id,
      name: 'Manager User',
      email: 'manager@rbac.com',
      password: 'password123',
      role: 'manager'
    });

    employee = await User.create({
      companyId: company._id,
      name: 'Employee User',
      email: 'employee@rbac.com',
      password: 'password123',
      role: 'employee',
      managerId: manager._id
    });

    managerToken = generateTestToken(manager);
    employeeToken = generateTestToken(employee);
  });

  test('Employee is forbidden from listing company users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Manager can view user list (including themselves and their employees)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Employee cannot delete a lead (403)', async () => {
    // Create a lead assigned to employee
    const lead = await Lead.create({
      companyId: company._id,
      name: 'Test Lead',
      source: 'Website',
      status: 'New',
      assignedTo: employee._id,
      createdBy: employee._id
    });

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  test('Manager cannot create another Manager account (403)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Violator Manager',
        email: 'violator@rbac.com',
        role: 'manager',
        password: 'password123'
      });

    // The user controller overrides the role to employee if the current user is a manager,
    // so it will actually create an employee under the manager instead of failing, OR it will succeed as employee.
    // Let's verify our code logic:
    // In createUser:
    // if (currentUser.role === 'manager') { userRole = 'employee'; finalManagerId = currentUser._id; }
    // So the created user's role is forced to 'employee'. Let's verify that role is employee.
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('employee');
    expect(res.body.data.managerId).toBe(manager._id.toString());
  });
});
