import request from 'supertest';
import express from 'express';
import { UserService } from '../../services/userService';
import { User } from '../../models/User';
import { AllGameCards } from '../../models/AllGameCards';
import mongoose from 'mongoose';
import userRoutes from '../../routes/api/user';
import { Mail } from '../../models/Mail';
import { SessionService } from '../../services/sessionService';
import { Gift } from '../../models/Gift';
import fs from 'fs';
import path from 'path';

describe('User Routes', () => {
  let app: express.Application;
  let userService: UserService;
  let testUser: any;
  let testUser2: any;
  const profileImagesDir = path.join(__dirname, '../../../public/profile-images');

  beforeEach(async () => {
    // Clean up profile images directory before each test
    if (fs.existsSync(profileImagesDir)) {
      const files = fs.readdirSync(profileImagesDir);
      for (const file of files) {
        fs.unlinkSync(path.join(profileImagesDir, file));
      }
    } else {
      fs.mkdirSync(profileImagesDir, { recursive: true });
    }

    app = express();
    app.use(express.json());
    userService = new UserService();

    // Create test user with mock Clerk ID
    testUser = await User.create({
      _id: 'test_clerk_id_123', // Mock Clerk ID
      username: 'testuser',
      email: 'test@example.com',
      coins: 100,
      experience: 50,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });

    testUser2 = await User.create({
      _id: 'test_clerk_id_1234', // Mock Clerk ID
      username: 'testuser2',
      email: 'test2@example.com',
      coins: 100,
      experience: 50,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });

    // Import and use routes
    app.use('/api/user', userRoutes);
  });

  afterAll(async () => {
    // Clean up all test data
    await User.deleteMany({});
    await Mail.deleteMany({});
    await Gift.deleteMany({});
    await AllGameCards.deleteMany({});
    
    // Clean up profile images directory
    if (fs.existsSync(profileImagesDir)) {
      const files = fs.readdirSync(profileImagesDir);
      for (const file of files) {
        fs.unlinkSync(path.join(profileImagesDir, file));
      }
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
  });

  describe('GET /useId', () => {
    it('should return user info', async () => {
      const response = await request(app)
        .get(`/api/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('coins', 100);
      expect(response.body).toHaveProperty('level', 1);
      expect(response.body).toHaveProperty('experience', 50);
      expect(response.body).toHaveProperty('cards');
      expect(response.body).toHaveProperty('friendsList');
      expect(response.body).toHaveProperty('cardDisplay');
    });

    it('should return 404 if user not found for GET /:userId', async () => {
      const response = await request(app).get('/api/user/nonexistent_id');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

  });

  describe('POST /profileImage/:userId', () => {
    it('should update user profile image', async () => {
      // Create a valid base64 image string (1x1 pixel transparent PNG)
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      const response = await request(app)
        .post(`/api/user/profileImage/${testUser._id}`)
        .send({ profileImage: base64Image });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('profileImage');
      expect(response.body.profileImage).toMatch(/^\/profile-images\//);
      expect(fs.existsSync(path.join(profileImagesDir, response.body.profileImage.split('/').pop()))).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      
      const response = await request(app)
        .post('/api/user/profileImage/nonexistent_id')
        .send({ profileImage: base64Image });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /card-display/:userId', () => {
    it('should update user card display', async () => {
      const testCard = await AllGameCards.create({
        _id: 'test_card_789',
        name: 'Test Card',
        types: ['Fire'],
        rarity: 'Common',
        small: 'small.jpg',
        large: 'large.jpg'
      });

      testUser.cards.push({
        cardId: testCard._id,
        copies: 1,
        collectedAt: new Date()
      });
      await testUser.save();

      const response = await request(app)
        .put(`/api/user/card-display/${testUser._id}`)
        .send({ cardDisplay: [testCard._id.toString()] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([testCard._id.toString()]);
    });

    it('should handle invalid card IDs', async () => {
      const invalidCardId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/user/card-display/${testUser._id}`)
        .send({ cardDisplay: [invalidCardId] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/user/card-display/nonexistent_id')
        .send({ cardDisplay: [] });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should handle empty card display array', async () => {
      const response = await request(app)
        .put(`/api/user/card-display/${testUser._id}`)
        .send({ cardDisplay: [] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /card-display/:userId', () => {
    it('should return user card display', async () => {
      const testCard = await AllGameCards.create({
        _id: 'test_card_999',
        name: 'Test Card',
        types: ['Fire'],
        rarity: 'Common',
        small: 'small.jpg',
        large: 'large.jpg'
      });

      testUser.cardDisplay = [testCard._id];
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/card-display/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([testCard._id.toString()]);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/card-display/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return empty array for user with no card display', async () => {
      testUser.cardDisplay = [];
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/card-display/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /friends/:userId', () => {
    it('should return user friends list', async () => {
      // Add a friend to test user
      testUser.friendsList.push(testUser2._id);
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/friends/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('friends');
      expect(Array.isArray(response.body.friends)).toBe(true);
      expect(response.body.friends.length).toBe(1);
      expect(response.body.friends[0]).toHaveProperty('_id', testUser2._id);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/friends/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return empty array for user with no friends', async () => {
      testUser.friendsList = [];
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/friends/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('friends');
      expect(Array.isArray(response.body.friends)).toBe(true);
      expect(response.body.friends.length).toBe(0);
    });
  });

  describe('GET /friend-requests/:userId', () => {
    it('should return pending friend requests', async () => {
      const response = await request(app)
        .get(`/api/user/friend-requests/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/friend-requests/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /leaderboard/point/:userId', () => {
    it('should return leaderboard data', async () => {
      const response = await request(app)
        .get(`/api/user/leaderboard/point/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('score');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/leaderboard/point/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /mail/:userId', () => {
    it('should return uncollected mail', async () => {
      // Create some test mail
      await Mail.create({
        recipientId: testUser._id,
        senderId: testUser2._id,
        type: 'gift',
        amount: 20,
        collected: false
      });

      const response = await request(app)
        .get(`/api/user/mail/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mail');
      expect(Array.isArray(response.body.mail)).toBe(true);
      expect(response.body.mail.length).toBeGreaterThan(0);
      expect(response.body.mail[0]).toHaveProperty('type', 'gift');
      expect(response.body.mail[0]).toHaveProperty('amount', 20);
      expect(response.body.mail[0]).toHaveProperty('collected', false);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/mail/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return empty array for user with no mail', async () => {
      await Mail.deleteMany({ recipientId: testUser._id });

      const response = await request(app)
        .get(`/api/user/mail/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mail');
      expect(Array.isArray(response.body.mail)).toBe(true);
      expect(response.body.mail.length).toBe(0);
    });
  });

  describe('POST /mail/:mailId/collect/:userId', () => {
    it('should collect mail successfully', async () => {
      // Create a test mail first
      const testMail = await Mail.create({
        recipientId: testUser._id,
        senderId: testUser._id,
        type: 'gift',
        amount: 20,
        collected: false
      });

      const response = await request(app)
        .post(`/api/user/mail/${testMail._id}/collect/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Mail collected successfully');
      expect(response.body).toHaveProperty('mail');
      expect(response.body).toHaveProperty('newBalance');
      expect(response.body.mail.collected).toBe(true);
      expect(response.body.newBalance).toBe(120); // 100 initial + 20 from mail
    });

    it('should return 400 for non-existent mail', async () => {
      const response = await request(app)
        .post(`/api/user/mail/507f1f77bcf86cd799439011/collect/${testUser._id}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Mail not found or already collected');
    });

    it('should return 400 for non-existent user', async () => {
      const mail = await Mail.create({
        recipientId: testUser._id,
        senderId: testUser._id,
        type: 'gift',
        amount: 20,
        collected: false
      });

      const response = await request(app)
        .post(`/api/user/mail/${mail._id}/collect/507f1f77bcf86cd799439012`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for already collected mail', async () => {
      const mail = await Mail.create({
        recipientId: testUser._id,
        senderId: testUser._id,
        type: 'gift',
        amount: 20,
        collected: true
      });

      const response = await request(app)
        .post(`/api/user/mail/${mail._id}/collect/${testUser._id}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Mail not found or already collected');
    });

    it('should return 400 for invalid mail ID format', async () => {
      const response = await request(app)
        .post(`/api/user/mail/507f1f77bcf86cd799439011/collect/${testUser._id}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid user ID format', async () => {
      const mail = await Mail.create({
        recipientId: testUser._id,
        senderId: testUser._id,
        type: 'gift',
        amount: 20,
        collected: false
      });

      const response = await request(app)
        .post(`/api/user/mail/${mail._id}/collect/invalid-id`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /cards/:userId', () => {
    it('should return user cards', async () => {
      // Create a test card
      const testCard = await AllGameCards.create({
        _id: 'test_card_123',
        name: 'Test Card',
        types: ['Fire'],
        rarity: 'Common',
        small: 'small.jpg',
        large: 'large.jpg'
      });

      // Add card to user's collection
      testUser.cards.push({
        cardId: testCard._id,
        copies: 2,
        collectedAt: new Date()
      });
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/cards/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('_id', testCard._id.toString());
      expect(response.body[0]).toHaveProperty('copies', 2);
      expect(response.body[0]).toHaveProperty('collectedAt');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/cards/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return empty array for user with no cards', async () => {
      testUser.cards = [];
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/cards/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /friend-request/:senderId/:recipientUsername', () => {
    it('should send friend request successfully', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser2.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend request sent successfully');
      expect(response.body).toHaveProperty('recipientUsername');
    });

    it('should return 400 for non-existent sender', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/nonexistent_id/${testUser2.username}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Sender user not found');
    });

    it('should return 400 for non-existent recipient', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/nonexistent_user`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Recipient user not found');
    });

    it('should return 400 for self-friend-request', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser.username}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'You cannot send a friend request to yourself');
    });

    it('should return 400 for existing friend request', async () => {
      // First request
      await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser2.username}`);

      // Second request
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser2.username}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Friend request already sent');
    });

    it('should return 400 for existing friendship', async () => {
      // Add users as friends
      testUser.friendsList.push(testUser2._id);
      testUser2.friendsList.push(testUser._id);
      await testUser.save();
      await testUser2.save();

      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser2.username}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Users are already friends');
    });
  });

  describe('POST /friend-request/:userId/accept/:senderUsername', () => {
    it('should accept friend request successfully', async () => {
      // Create a friend request first
      await request(app)
        .post(`/api/user/friend-request/${testUser._id}/${testUser2.username}`);

      const response = await request(app)
        .post(`/api/user/friend-request/${testUser2._id}/accept/${testUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend request accepted successfully');
      expect(response.body).toHaveProperty('senderUsername', testUser.username);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/nonexistent_id/accept/${testUser.username}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 404 for non-existent sender', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser._id}/accept/nonexistent_user`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for non-existent friend request', async () => {
      const response = await request(app)
        .post(`/api/user/friend-request/${testUser2._id}/accept/${testUser.username}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Friend request not found');
    });
  });

  describe('DELETE /friends/:userId/:friendId', () => {
    it('should remove friend successfully', async () => {
      // Add users as friends first
      testUser.friendsList.push(testUser2._id);
      testUser2.friendsList.push(testUser._id);
      await testUser.save();
      await testUser2.save();

      const response = await request(app)
        .delete(`/api/user/friends/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Friend removed successfully');
      expect(response.body).toHaveProperty('friendUsername', testUser2.username);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete(`/api/user/friends/nonexistent_id/${testUser2._id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 404 for non-existent friend', async () => {
      const response = await request(app)
        .delete(`/api/user/friends/${testUser._id}/nonexistent_id`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Friend user not found');
    });

    it('should return 400 when users are not friends', async () => {
      // Ensure users are not friends
      testUser.friendsList = [];
      testUser2.friendsList = [];
      await testUser.save();
      await testUser2.save();

      const response = await request(app)
        .delete(`/api/user/friends/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Users are not friends');
    });
  });

  describe('GET /leaderboard/session/:userId', () => {
    it('should return session leaderboard data', async () => {
      // Create some test sessions
      const sessionService = new SessionService();
      await sessionService.startSession(testUser._id, 25);
      await sessionService.startSession(testUser2._id, 30);

      const response = await request(app)
        .get(`/api/user/leaderboard/session/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('score');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/leaderboard/session/nonexistent_id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return same array structurefor new user with no sessions', async () => {
      // Create a new user with no sessions
      const newUser = await User.create({
        _id: 'new_user_id',
        username: 'newuser',
        email: 'new@example.com',
        coins: 100,
        experience: 0,
        level: 1,
        cards: [],
        friendsList: [],
        cardDisplay: []
      });

      const response = await request(app)
        .get(`/api/user/leaderboard/session/${newUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('score');
    });
  });

  describe('GET /gift/:senderId/:recipientId', () => {
    it('should return check if gift can be sent successfully', async () => {
      const response = await request(app)
        .get(`/api/user/gift/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('canSend', true);
    });
  });

  describe('POST /gift/:senderId/:recipientId', () => {
    it('should create gift successfully', async () => {
      // should be friends first
      testUser.friendsList.push(testUser2._id);
      testUser2.friendsList.push(testUser._id);
      await testUser.save();
      await testUser2.save();
      const response = await request(app)
        .post(`/api/user/gift/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('gift');
      expect(response.body.gift).toHaveProperty('gift');
      expect(response.body.gift.gift).toHaveProperty('senderId', testUser._id);
      expect(response.body.gift.gift).toHaveProperty('recipientId', testUser2._id);
      expect(response.body.gift.gift).toHaveProperty('amount', 20);
      expect(response.body.gift).toHaveProperty('mail');
      expect(response.body.gift.mail).toHaveProperty('senderId', testUser._id);
      expect(response.body.gift.mail).toHaveProperty('recipientId', testUser2._id);
      expect(response.body.gift.mail).toHaveProperty('amount', 20);
      expect(response.body.gift.mail).toHaveProperty('collected', false);
    });

    it('should return 400 for not friends', async () => {
      const response = await request(app)
        .post(`/api/user/gift/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'You can only gift friends');
    });

    it('should return 400 for non-existent sender', async () => {
      const response = await request(app)
        .post(`/api/user/gift/nonexistent_id/${testUser2._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Sender not found');
    });

    it('should return 400 for non-existent recipient', async () => {
      const response = await request(app)
        .post(`/api/user/gift/${testUser._id}/nonexistent_id`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Recipient not found');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post(`/api/user/gift/${testUser._id}/${testUser2._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for self-gift', async () => {
      const response = await request(app)
        .post(`/api/user/gift/${testUser._id}/${testUser._id}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'You can only gift friends');
    });
  });
}); 