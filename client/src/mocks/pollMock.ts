/* ── Types ──────────────────────────────────────────── */

export interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  timeLimit: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSelf: boolean;
}

/* ── Mock Data ──────────────────────────────────────── */

export const mockPoll: Poll = {
  id: "1",
  question: "Which planet is known as the Red Planet?",
  options: [
    { id: "a", text: "Mars", isCorrect: true, votes: 14 },
    { id: "b", text: "Venus", isCorrect: false, votes: 1 },
    { id: "c", text: "Jupiter", isCorrect: false, votes: 1 },
    { id: "d", text: "Saturn", isCorrect: false, votes: 4 },
  ],
  totalVotes: 20,
  timeLimit: 15,
};

export const mockPollHistory: Poll[] = [
  mockPoll,
  {
    id: "2",
    question: "Which planet is known as the Red Planet?",
    options: [
      { id: "a", text: "Mars", isCorrect: true, votes: 14 },
      { id: "b", text: "Venus", isCorrect: false, votes: 1 },
      { id: "c", text: "Jupiter", isCorrect: false, votes: 1 },
      { id: "d", text: "Saturn", isCorrect: false, votes: 3 },
    ],
    totalVotes: 19,
    timeLimit: 15,
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "User 1",
    text: "Hey There, How can I help?",
    isSelf: false,
  },
  {
    id: "2",
    sender: "Me",
    text: "Nothing bro, just chillin",
    isSelf: true,
  },
];

export const mockParticipants: string[] = [
  "Rahul Arora",
  "Pushpender Rautela",
  "Rijul Zalpuri",
  "Nadeem N",
  "Ashwin Sharma",
];
