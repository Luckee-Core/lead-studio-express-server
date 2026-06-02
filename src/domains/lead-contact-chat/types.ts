export type LeadContactChatMessage = {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
  rawTime: string;
};
