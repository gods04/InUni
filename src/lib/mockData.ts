import type { ForumComment, Post, Profile } from '../types/forum';

const now = Date.now();

export const mockProfiles: Profile[] = [
  {
    id: 'demo-admin@inuni.local',
    username: 'admin',
    displayName: 'InUni Moderator',
    role: 'admin',
    isBanned: false,
    banReason: null,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: 'mock-user-a',
    username: 'maya',
    displayName: 'Maya',
    role: 'student',
    isBanned: false,
    banReason: null,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'mock-user-b',
    username: 'liam',
    displayName: 'Liam',
    role: 'student',
    isBanned: false,
    banReason: null,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
  },
  {
    id: 'mock-user-d',
    username: 'nandi',
    displayName: 'Nandi',
    role: 'student',
    isBanned: false,
    banReason: null,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

export const mockPosts: Post[] = [
  {
    id: 'mock-study-notes',
    title: 'Best way to organize notes before finals?',
    category: 'Study',
    content:
      'I am trying to stop keeping everything in one giant doc. What study systems are working for everyone this semester?',
    authorId: 'mock-user-a',
    authorName: 'Maya',
    authorIsUctVerified: true,
    isAnonymous: false,
    createdAt: new Date(now - 1000 * 60 * 38).toISOString(),
    commentCount: 2,
  },
  {
    id: 'mock-campus-coffee',
    title: 'Quiet places on campus after 6pm',
    category: 'Campus Life',
    content:
      'The library gets crowded after lectures. Are there any calm spaces where people can study without needing a booking?',
    authorId: 'mock-user-b',
    authorName: 'Liam',
    authorIsUctVerified: true,
    isAnonymous: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    commentCount: 1,
  },
  {
    id: 'mock-confession',
    title: 'I changed majors and feel behind',
    category: 'Confessions',
    content:
      'Everyone else seems to know exactly what they are doing. I know switching was right, but starting again is harder than I expected.',
    authorId: 'mock-user-c',
    authorName: 'Anonymous',
    authorIsUctVerified: true,
    isAnonymous: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 22).toISOString(),
    commentCount: 0,
  },
  {
    id: 'mock-lost-calculator',
    title: 'Lost calculator near the engineering labs',
    category: 'Lost & Found',
    content:
      'I found a black Casio calculator outside Lab 3. Message the lab assistant with the model number and sticker on the back.',
    authorId: 'mock-user-d',
    authorName: 'Nandi',
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    commentCount: 1,
  },
];

export const mockComments: ForumComment[] = [
  {
    id: 'mock-comment-1',
    postId: 'mock-study-notes',
    authorId: 'mock-user-e',
    authorName: 'Ari',
    authorIsUctVerified: true,
    content: 'I use one page per lecture and a weekly recap page. It keeps revision much less chaotic.',
    createdAt: new Date(now - 1000 * 60 * 24).toISOString(),
  },
  {
    id: 'mock-comment-2',
    postId: 'mock-study-notes',
    authorId: 'mock-user-f',
    authorName: 'Sam',
    authorIsUctVerified: true,
    content: 'Try active recall questions at the bottom of each topic. Future-you will be grateful.',
    createdAt: new Date(now - 1000 * 60 * 13).toISOString(),
  },
  {
    id: 'mock-comment-3',
    postId: 'mock-campus-coffee',
    authorId: 'mock-user-g',
    authorName: 'Jules',
    authorIsUctVerified: false,
    content: 'The education building has open tables near the second-floor windows most evenings.',
    createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'mock-comment-4',
    postId: 'mock-lost-calculator',
    authorId: 'mock-user-h',
    authorName: 'Theo',
    authorIsUctVerified: true,
    content: 'Thanks for posting this here. Lost and found at the main desk is also worth checking.',
    createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
  },
];
