const request = require('supertest');
const app = require('../src/app');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const { setupTestDB, generateTestToken } = require('./testHelper');

setupTestDB();

describe('Lead CRUD and Validation Tests', () => {
  let company, manager, employee, anotherManager, managerToken, employeeToken, lead;

  beforeEach(async () => {
    company = await Company.create({ name: 'Lead Corp' });

    manager = await User.create({
      companyId: company._id,
      name: 'Manager Bob',
      email: 'manager@lead.com',
      password: 'password123',
      role: 'manager'
    });

    anotherManager = await User.create({
      companyId: company._id,
      name: 'Manager Zack',
      email: 'zack@lead.com',
      password: 'password123',
      role: 'manager'
    });

    employee = await User.create({
      companyId: company._id,
      name: 'Employee Charlie',
      email: 'employee@lead.com',
      password: 'password123',
      role: 'employee',
      managerId: manager._id
    });

    managerToken = generateTestToken(manager);
    employeeToken = generateTestToken(employee);

    lead = await Lead.create({
      companyId: company._id,
      name: 'Existing Customer',
      source: 'Website',
      status: 'New',
      assignedTo: employee._id,
      createdBy: employee._id
    });
  });

  test('Employee can create a lead and it defaults to assigned to themselves', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'New Client',
        source: 'Referral',
        status: 'New'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedTo).toBe(employee._id.toString());
  });

  test('Manager cannot assign a lead to a user outside their team', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Unassigned Client',
        source: 'Website',
        status: 'New',
        assignedTo: anotherManager._id // outside manager's team
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Employee can add a note to their assigned lead', async () => {
    const res = await request(app)
      .post(`/api/leads/${lead._id}/notes`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        text: 'Followed up with customer today.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notes.length).toBe(1);
    expect(res.body.data.notes[0].text).toBe('Followed up with customer today.');
  });
});
