import { SessionService } from '../../services/sessionService';
import { User } from '../../models/User';
import { StudySession, IStudySession } from '../../models/StudySession';
import mongoose, { HydratedDocument } from 'mongoose';
import { LevelRequirement } from '../../models/LevelRequirement';

describe('SessionService', () => {
  let sessionService: SessionService;
  let testUser: any;

  beforeEach(async () => {
    sessionService = new SessionService();
    
    // Create test user
    testUser = await User.create({
      _id: 'test_clerk_id_123',
      username: 'testuser',
      email: 'test@example.com',
      coins: 100,
      experience: 80,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });
  });

  describe('startSession', () => {
    it('should start a new session', async () => {
      const session = await sessionService.startSession(testUser._id, 25);
      expect(session.userId).toBe(testUser._id);
      expect(session.plannedDuration).toBe(25);
      expect(session.status).toBe('active');
      expect(session.startTime).toBeTruthy();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        sessionService.startSession(new mongoose.Types.ObjectId().toString(), 25)
      ).rejects.toThrow('User not found');
    });

    it('should end any existing active sessions', async () => {
      // Create an active session
      await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'active',
        startTime: new Date()
      });

      // Start a new session
      const newSession = await sessionService.startSession(testUser._id, 25);
      
      // Check that old session was ended
      const oldSession = await StudySession.findOne({
        userId: testUser._id,
        status: 'failed'
      });
      expect(oldSession).toBeTruthy();
      expect(newSession.status).toBe('active');
    });
  });

  describe('completeSession', () => {
    it('should complete a session and update user stats', async () => {
      // Create an active session
      const session = await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'active',
        startTime: new Date(Date.now() - 26 * 60 * 1000)
      });

      // Update user's currentSession
      await User.findByIdAndUpdate(testUser._id, { currentSession: session._id });

      const { session: completedSession, user } = await sessionService.completeSession((session as unknown as { _id: mongoose.Types.ObjectId })._id.toString());
      
      const updatedUser = await User.findById(testUser._id);

      expect(completedSession.status).toBe('completed');
      expect(completedSession.endTime).toBeTruthy();
      expect(completedSession.rewards).toBeTruthy();
      expect(updatedUser?.coins).toBe(150); // Initial 100 + 50 reward
      expect(updatedUser?.experience).toBe(100); // Initial 80 + 20 reward
    });

    it('should update user level when experience threshold is reached', async () => {
      // Create a level requirement for level 2
      await LevelRequirement.create({
        level: 2,
        experienceRequired: 100,
        rewardCoins: 200
      });
      await LevelRequirement.create({
        level: 3,
        experienceRequired: 200,
        rewardCoins: 200
      });

      // Create an active session
      const session = await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'active',
        startTime: new Date(Date.now() - 26 * 60 * 1000)
      });

      // Update user's currentSession
      await User.findByIdAndUpdate(testUser._id, { currentSession: session._id });

      const { user } = await sessionService.completeSession((session as unknown as { _id: mongoose.Types.ObjectId })._id.toString());
      const updatedUser = await User.findById(testUser._id);
      // Verify user stats after level up
      expect(updatedUser?.level).toBe(2); // Level up from 1 to 2
      expect(updatedUser?.coins).toBe(350); // Initial 100 + 50 reward + 200 level up reward
      expect(updatedUser?.experience).toBe(100); // Initial 80 + 20 reward
      expect(user?.isLevelUp).toBe(true);
      expect(user?.levelUpCoins).toBe(200);
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        sessionService.completeSession(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('Session not found');
    });

    it('should throw error for non-active session', async () => {
      const session = await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date()
      });

      await expect(
        sessionService.completeSession((session as unknown as { _id: mongoose.Types.ObjectId })._id.toString())
      ).rejects.toThrow('Session is not active');
    });
  });

  describe('failSession', () => {
    it('should mark session as failed', async () => {
      const session = await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'active',
        startTime: new Date()
      });

      await sessionService.failSession((session as unknown as { _id: mongoose.Types.ObjectId })._id.toString());
      
      const failedSession = await StudySession.findById(session._id);
      expect(failedSession?.status).toBe('failed');
      expect(failedSession?.endTime).toBeTruthy();
      expect(failedSession?.rewards?.coins).toBe(0);
      expect(failedSession?.rewards?.experience).toBe(0);
    });
  });

  describe('getWeeklyStats', () => {
    it('should return weekly stats with correct structure', async () => {
      const stats = await sessionService.getWeeklyStats(testUser._id);
      
      expect(stats).toHaveProperty('dailyStats');
      expect(stats).toHaveProperty('weeklyTotal');
      expect(stats.dailyStats).toHaveLength(7);
      expect(stats.weeklyTotal).toHaveProperty('totalDuration');
      expect(stats.weeklyTotal).toHaveProperty('completedDuration');
    });

    it('should calculate correct durations for completed sessions', async () => {
      // Create some completed sessions
      await StudySession.create({
        userId: testUser._id,
        plannedDuration: 25,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        actualDuration: 25,
        rewards: { coins: 50, experience: 20 }
      });

      const stats = await sessionService.getWeeklyStats(testUser._id);
      
      expect(stats.weeklyTotal.completedDuration).toBe(25);
      expect(stats.weeklyTotal.totalDuration).toBe(25);
    });
  });
}); 