export type Mail = {
  _id: string;
  recipientId: string;
  senderId: {
    _id: string;
    username: string;
  };
  type: 'gift' | 'friend_request';
  amount?: number;
  collected: boolean;
  createdAt: Date;
  updatedAt: Date;
}; 