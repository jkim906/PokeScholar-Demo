import request from 'supertest';
import express from 'express';
import { SessionService } from '../../services/sessionService';
import { User } from '../../models/User';
import { StudySession } from '../../models/StudySession';
import sessionRoutes from '../../routes/api/session';
import mongoose from 'mongoose';

describe('Session Routes', () => {
  let app: express.Application;
  let sessionService: SessionService;
  let testUser: any;
  let testSession: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    sessionService = new SessionService();

    // Create test user
    testUser = await User.create({
      _id: 'test_clerk_id_123',
      username: 'testuser',
      email: 'test@example.com',
      coins: 100,
      experience: 50,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });

    // Create test session
    testSession = await StudySession.create({
      userId: testUser._id,
      plannedDuration: 25,
      status: 'active',
      startTime: new Date()
    });

    // Import and use routes
    app.use('/api/session', sessionRoutes);
  });

  describe('POST /start', () => {
    it('should start a new session', async () => {
      const response = await request(app)
        .post('/api/session/start')
        .send({ userId: testUser._id, duration: 25 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', testUser._id);
      expect(response.body).toHaveProperty('plannedDuration', 25);
      expect(response.body).toHaveProperty('status', 'active');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/session/start')
        .send({ userId: 'nonexistent_id', duration: 25 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('POST /complete/:sessionId', () => {
    it('should complete a session', async () => {
      const response = await request(app)
        .post(`/api/session/complete/${testSession._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session');
      expect(response.body).toHaveProperty('userLevelInfo');
      expect(response.body.session.status).toBe('completed');
    });

    it('should return 500 for non-existent session', async () => {
      const response = await request(app)
        .post(`/api/session/complete/${new mongoose.Types.ObjectId().toString()}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /cancel/:sessionId', () => {
    it('should cancel a session', async () => {
      const response = await request(app)
        .post(`/api/session/cancel/${testSession._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Session canceled successfully');
      expect(response.body).toHaveProperty('sessionId', testSession._id.toString());
    });

    it('should return 500 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/session/cancel/nonexistent_id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /getStudyStats/:userId', () => {
    it('should return study stats', async () => {
      const response = await request(app)
        .get(`/api/session/getStudyStats/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dailyStats');
      expect(response.body).toHaveProperty('weeklyTotal');
      expect(response.body.dailyStats).toHaveLength(7);
    });
  });
}); 