import { UserService } from '../../services/userService';
import { User } from '../../models/User';
import { AllGameCards } from '../../models/AllGameCards';
import { FriendRequest } from '../../models/FriendRequest';
import { Gift } from '../../models/Gift';
import { Mail } from '../../models/Mail';
import mongoose from 'mongoose';
import request from 'supertest';

describe('UserService', () => {
  let userService: UserService;
  let testUser: any;
  let testFriend: any;
  let testCard: any;

  beforeEach(async () => {
    userService = new UserService();
    
    // Create test user
    testUser = await User.create({
      _id: 'test_clerk_id_123', // Mock Clerk ID
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      coins: 100,
      experience: 50,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });

    // Create test friend
    testFriend = await User.create({
      _id: 'test_clerk_id_456', // Mock Clerk ID
      username: 'testfriend',
      email: 'friend@example.com',
      password: 'password123',
      coins: 100,
      experience: 50,
      level: 1,
      cards: [],
      friendsList: [],
      cardDisplay: []
    });

    // Create test card
    testCard = await AllGameCards.create({
      _id: 'test_card_123',
      name: 'Test Card',
      types: ['Fire'], // Using a valid Pokemon type
      rarity: 'Common',
      small: 'small.jpg',
      large: 'large.jpg'
    });
  });

  describe('getUserCards', () => {
    it('should return empty array for user with no cards', async () => {
      const cards = await userService.getUserCards(testUser._id);
      expect(cards).toHaveLength(0);
    });

    it('should return user cards with correct filters', async () => {
      // Add card to user's collection
      testUser.cards.push({
        cardId: testCard._id,
        copies: 1,
        collectedAt: new Date()
      });
      await testUser.save();

      const cards = await userService.getUserCards(testUser._id, {
        rarity: 'Common',
        sortBy: 'recent'
      });

      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Test Card');
    });

    it('should handle database errors', async () => {
      jest.spyOn(User, 'findById').mockImplementationOnce(() => { throw new Error('DB error'); });
      await expect(userService.getUserCards(testUser._id)).rejects.toThrow('DB error');
    });
  });

  describe('updateCardDisplay', () => {
    it('should update user card display', async () => {
      // Add card to user's collection first
      testUser.cards.push({
        cardId: testCard._id,
        copies: 1,
        collectedAt: new Date()
      });
      await testUser.save();

      const cardDisplay = [testCard._id.toString()];
      const updatedDisplay = await userService.updateCardDisplay(testUser._id, cardDisplay);
      expect(updatedDisplay).toEqual(cardDisplay);
    });

    it('should throw error for invalid card IDs', async () => {
      const invalidCardId = new mongoose.Types.ObjectId().toString();
      await expect(
        userService.updateCardDisplay(testUser._id, [invalidCardId])
      ).rejects.toThrow('Invalid card IDs');
    });
  });

  describe('friend management', () => {
    it('should send friend request', async () => {
      const result = await userService.sendFriendRequest(
        testUser._id,
        testFriend.username
      );
      expect(result).toBe(testFriend.username);

      const request = await FriendRequest.findOne({
        senderId: testUser._id,
        recipientId: testFriend._id
      });
      expect(request).toBeTruthy();
      expect(request?.status).toBe('pending');
    });

    it('should accept friend request', async () => {
      // Create friend request
      await FriendRequest.create({
        senderId: testFriend._id,
        recipientId: testUser._id,
        status: 'pending'
      });

      const result = await userService.acceptFriendRequest(
        testUser._id,
        testFriend.username
      );
      expect(result).toBe(testFriend.username);

      // Check if users are now friends
      const updatedUser = await User.findById(testUser._id);
      const updatedFriend = await User.findById(testFriend._id);
      expect(updatedUser?.friendsList).toContain(testFriend._id.toString());
      expect(updatedFriend?.friendsList).toContain(testUser._id.toString());
    });
  });

  describe('gift system', () => {
    it('should send gift to friend', async () => {
      // Make users friends
      testUser.friendsList.push(testFriend._id);
      testFriend.friendsList.push(testUser._id);
      await Promise.all([testUser.save(), testFriend.save()]);

      const { gift, mail } = await userService.sendGift(
        testUser._id.toString(),
        testFriend._id.toString()
      );

      expect(gift.senderId.toString()).toBe(testUser._id.toString());
      expect(gift.recipientId.toString()).toBe(testFriend._id.toString());
      expect(mail.amount).toBe(20);
      expect(mail.collected).toBe(false);
    });

    it('should not allow sending gift to non-friend', async () => {
      await expect(
        userService.sendGift(testUser._id.toString(), testFriend._id.toString())
      ).rejects.toThrow('You can only gift friends');
    });
  });

  describe('mail system', () => {
    it('should collect mail and update user coins', async () => {
      // Create mail for user
      const mail = await Mail.create({
        recipientId: testUser._id,
        senderId: testFriend._id,
        type: 'gift',
        amount: 20,
        collected: false
      });

      const { mail: updatedMail, newBalance } = await userService.collectMail(
        mail._id.toString(),
        testUser._id.toString()
      );

      expect(updatedMail.collected).toBe(true);
      expect(newBalance).toBe(120); // Initial 100 + 20 from mail
    });

    it('should not allow collecting already collected mail', async () => {
      const mail = await Mail.create({
        recipientId: testUser._id,
        senderId: testFriend._id,
        type: 'gift',
        amount: 20,
        collected: true
      });

      await expect(
        userService.collectMail(mail._id.toString(), testUser._id.toString())
      ).rejects.toThrow('Mail not found or already collected');
    });
  });
}); 