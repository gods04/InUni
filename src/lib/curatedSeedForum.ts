import type { Category, ForumComment, Post } from '../types/forum';

const now = Date.now();

function hoursAgo(hours: number): string {
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

const unsortedCuratedSeedPosts: Post[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Exam study spaces: what is actually calm late at night?',
    category: 'Study',
    content:
      'UCT says students should use official study spaces rather than exam venues, and points to library study spaces plus Baxter Student Learning Centre being available 24/7.\n\nFor people studying after dinner: which spaces have actually been calm, have plugs, and feel okay when leaving late? Also remember to keep your student card on you because access checks are happening around exam venues and libraries.\n\nSource: https://www.news.uct.ac.za/article/-2026-06-03-mid-year-examinations-update',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    isAnonymous: false,
    createdAt: hoursAgo(52),
    commentCount: 2,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Late-night safety checklist before leaving campus',
    category: 'Campus Life',
    content:
      'Small reminder from the UCT exam update: if you are using 24-hour study spaces at night, save the CPS toll-free number before you need it: 080 650 2222.\n\nUCT also says extra CPS officers are around routes from exam venues to shuttle stops and parking areas during evening sessions. If you are leaving late, use the shuttle where possible, avoid walking alone, and do not walk with headphones in.\n\nSource: https://www.news.uct.ac.za/article/-2026-06-03-mid-year-examinations-update',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(42),
    commentCount: 2,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'Has the UCT Shuttle app been reliable for ETAs?',
    category: 'Questions',
    content:
      'The UCT Shuttle App says it can show stops, routes, schedules, active buses and nearby ETAs. I am trying to avoid standing outside too long when moving between campuses.\n\nHas anyone used it this week? Is the ETA close enough to trust, or do you still add a big buffer before lectures or exams?\n\nSources:\nhttps://play.google.com/store/apps/details?id=com.gometromove\nhttps://www.news.uct.ac.za/news/videos/-article/2021-03-10-ucts-jammie-shuttle-service-will-take-you-where-you-need-to-be',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(31),
    commentCount: 2,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'Writing Centre before essay deadlines: worth it?',
    category: 'Study',
    content:
      'I found the UCT Writing Centre guide through the library guides. It looks like the point is not proofreading your work for you, but a one-on-one consultation to help with argument, structure, academic writing and the writing process.\n\nHas anyone used it for a first-year essay or lab report? I am trying to decide whether to book before I get too close to the deadline.\n\nSource: https://libguides.lib.uct.ac.za/c.php?g=182289&p=7519057',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    isAnonymous: false,
    createdAt: hoursAgo(22),
    commentCount: 2,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    title: 'Student Wellness: what is the fastest way to book help?',
    category: 'Questions',
    content:
      'UCT says Student Wellness Service offers medical and counselling support, with bookings through the UCT App or SWS website. It also lists the Student Careline as 0800 24 25 26 for 24/7 support.\n\nFor students who have used it recently: is the UCT App the best route, or is calling better if you need advice quickly?\n\nSource: https://www.news.uct.ac.za/article/-2025-01-27-student-health-and-wellness',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(16),
    commentCount: 2,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    title: 'Mini exam-day checklist for campus',
    category: 'General',
    content:
      'Putting this here so I do not forget:\n\n- student card\n- exam venue checked before leaving\n- water and pens\n- phone charged, but away during the exam\n- shuttle plan if finishing late\n- CPS number saved: 080 650 2222\n\nThe official exam update also says exam venues should not be used as study spaces, so plan a separate place to revise before writing.\n\nSource: https://www.news.uct.ac.za/article/-2026-06-03-mid-year-examinations-update',
    authorId: 'b28fdf5b-bc1c-4d94-b111-72a44a21363c',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(9),
    commentCount: 2,
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    title: 'Lost blue bottle near Kramer / LS stairs',
    category: 'Lost & Found',
    content:
      'Long shot, but I left a blue metal water bottle somewhere between Kramer and the LS stairs this afternoon. It has a small sticker on the side.\n\nIf anyone picked it up, please leave it with the Kramer security desk or reply here. I will check tomorrow morning too.',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(4),
    commentCount: 1,
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    title: 'I froze in an exam. How do you reset before the next one?',
    category: 'Confessions',
    content:
      'Not looking for dramatic advice, just practical things. I blanked in the first 20 minutes of an exam and only settled down halfway through.\n\nIf this has happened to you, what helped before the next paper? I saw UCT lists SWS counselling and the Student Careline, but I am also curious about small routines that worked for other students.\n\nSource: https://www.news.uct.ac.za/article/-2025-01-27-student-health-and-wellness',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'Anonymous',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    isAnonymous: true,
    createdAt: hoursAgo(2),
    commentCount: 2,
  },
];

export const curatedSeedPosts = [...unsortedCuratedSeedPosts].sort(
  (left, right) =>
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
);

export const curatedSeedComments: ForumComment[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    postId: '11111111-1111-4111-8111-111111111111',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Baxter has been the most reliable for me after 9pm, but it gets cold. Bring a hoodie and your card.',
    createdAt: hoursAgo(47),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    postId: '11111111-1111-4111-8111-111111111111',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The no-exam-venues-as-study-spaces thing is real. I saw signs up near one venue this week.',
    createdAt: hoursAgo(45),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    postId: '22222222-2222-4222-8222-222222222222',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    content:
      'CPS escort is worth using if you leave very late. I used it once from upper campus and they were helpful.',
    createdAt: hoursAgo(38),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    postId: '22222222-2222-4222-8222-222222222222',
    authorId: 'b28fdf5b-bc1c-4d94-b111-72a44a21363c',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Saving the number now. I always think I will remember it and then never do.',
    createdAt: hoursAgo(37),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    postId: '33333333-3333-4333-8333-333333333333',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The ETA is useful, but I still leave a buffer. It is better for deciding whether to wait inside or start walking.',
    createdAt: hoursAgo(27),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    postId: '33333333-3333-4333-8333-333333333333',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    content:
      'For exams I would not cut it close. For normal lectures it has been good enough for me.',
    createdAt: hoursAgo(23),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
    postId: '44444444-4444-4444-8444-444444444444',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'I used them last semester. They did not edit the essay, but helped me see that my paragraphs were not answering the question.',
    createdAt: hoursAgo(19),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
    postId: '44444444-4444-4444-8444-444444444444',
    authorId: 'b28fdf5b-bc1c-4d94-b111-72a44a21363c',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Book before your draft is perfect. It is more useful when you still have time to change the structure.',
    createdAt: hoursAgo(18),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
    postId: '55555555-5555-4555-8555-555555555555',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    content:
      'For admin-type stuff I used the app. If it feels urgent, the Careline number is probably the better first step.',
    createdAt: hoursAgo(12),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
    postId: '55555555-5555-4555-8555-555555555555',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The Ivan Toms building info is useful if you are on lower campus. Upper campus clinic is Steve Biko.',
    createdAt: hoursAgo(11),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    postId: '66666666-6666-4666-8666-666666666666',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Also pack a snack if your paper finishes late. The post-exam crash is real.',
    createdAt: hoursAgo(7),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
    postId: '66666666-6666-4666-8666-666666666666',
    authorId: 'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    content:
      'I would add: check the venue the night before, not five minutes before leaving.',
    createdAt: hoursAgo(6),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13',
    postId: '77777777-7777-4777-8777-777777777777',
    authorId: 'b28fdf5b-bc1c-4d94-b111-72a44a21363c',
    authorName: 'yxxche006',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Try Kramer reception/security first. People often hand things in there before posting online.',
    createdAt: hoursAgo(3),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14',
    postId: '88888888-8888-4888-8888-888888888888',
    authorId: '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    authorName: 'orange',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'This happened to me too. I write down formulas or keywords for two minutes first, then start with the question I can actually do.',
    createdAt: hoursAgo(1.3),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15',
    postId: '88888888-8888-4888-8888-888888888888',
    authorId: 'a32e236a-a142-46c9-acab-c09a282e022a',
    authorName: 'chenxianjian9',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Not silly to use support if it keeps happening. But for the next paper: sleep, arrive early, and do not compare notes outside the venue.',
    createdAt: hoursAgo(0.9),
  },
].sort(
  (left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
);

export function getCuratedSeedPosts(category?: Category): Post[] {
  return category
    ? curatedSeedPosts.filter((post) => post.category === category)
    : curatedSeedPosts;
}

export function getCuratedSeedPost(postId: string): Post | null {
  return curatedSeedPosts.find((post) => post.id === postId) ?? null;
}

export function getCuratedSeedComments(postId: string): ForumComment[] {
  return curatedSeedComments.filter((comment) => comment.postId === postId);
}
