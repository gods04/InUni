import type { Category, ForumComment, Post } from '../types/forum';

const now = Date.now();

function hoursAgo(hours: number): string {
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

const unsortedCuratedSeedPosts: Post[] = [
  {
    id: '99999999-9999-4999-8999-999999999991',
    title: 'Engineering handbook: where do I check course rules?',
    category: 'General',
    content:
      'Leaving this here because a lot of people get mixed up between admissions info and degree rules.\n\nFor Engineering and the Built Environment, the undergraduate handbook is the place to check curriculum rules, course codes, progression rules and programme structure:\n\nhttps://uct.ac.za/sites/default/files/media/documents/2026-ebe-handbook-7a-final-web.pdf\n\nFor entry requirements and programme summaries, the undergraduate prospectus is usually easier to start with:\n\nhttps://uct.ac.za/students/prospective-students/undergraduate-prospectus',
    authorId: 'seed-author-maya',
    authorName: 'Maya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(1.2),
    commentCount: 2,
  },
  {
    id: '99999999-9999-4999-8999-999999999992',
    title: 'Commerce handbook link for BCom and BBusSc',
    category: 'General',
    content:
      'If you are comparing Commerce options, this is the public UCT Commerce undergraduate handbook link I would keep open:\n\nhttps://uct.ac.za/sites/default/files/media/documents/2026-commerce-handbook-6a-final-web.pdf\n\nIt is better for degree rules, majors and curriculum structure. If you are still checking whether you qualify for a programme, start from the undergraduate prospectus as well:\n\nhttps://uct.ac.za/students/prospective-students/undergraduate-prospectus',
    authorId: 'seed-author-jeff',
    authorName: 'Jeff',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(1.8),
    commentCount: 2,
  },
  {
    id: '99999999-9999-4999-8999-999999999993',
    title: 'Open Day planning: which faculty talks are worth prioritising?',
    category: 'Questions',
    content:
      'For anyone planning a campus visit or Open Day style route: do you usually prioritise faculty talks, residence info, or walking around the actual buildings first?\n\nI am trying to make a route that is useful for someone deciding between Engineering, Commerce and Science, without turning the day into a race across campus.',
    authorId: 'seed-author-bob',
    authorName: 'Bob',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(2.4),
    commentCount: 2,
  },
  {
    id: '99999999-9999-4999-8999-999999999994',
    title: 'Club and society events: what is actually beginner-friendly?',
    category: 'Campus Life',
    content:
      'I keep seeing campus groups advertise talks, practices and socials, but it is hard to tell what is beginner-friendly and what assumes you already know people there.\n\nWhich societies or campus events have you joined where it felt normal to arrive alone?',
    authorId: 'seed-author-priya',
    authorName: 'Priya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(3.1),
    commentCount: 2,
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Exam study spaces: what is actually calm late at night?',
    category: 'Study',
    content:
      'For people studying after dinner: which spaces have actually been calm, have plugs, and feel okay when leaving late?\n\nI have heard Baxter and some library study areas are the safest options during exam season, but I am trying to avoid wasting time walking between places. Also, is anyone else being extra careful about keeping their student card on them at night?',
    authorId: 'seed-author-maya',
    authorName: 'Maya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(52),
    commentCount: 2,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Late-night safety checklist before leaving campus',
    category: 'Campus Life',
    content:
      'Small reminder if you are using study spaces at night: save the CPS toll-free number before you need it: 080 650 2222.\n\nIf you are leaving late, use the shuttle where possible, avoid walking alone, and maybe skip headphones until you are somewhere busy. I have been trying to make this a habit instead of only thinking about it after a stressful evening.',
    authorId: 'seed-author-jeff',
    authorName: 'Jeff',
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
      'I am trying to avoid standing outside too long when moving between campuses, especially when it is cold or I have an exam later.\n\nHas anyone used the shuttle app this week? Is the ETA close enough to trust, or do you still add a big buffer before lectures or exams?',
    authorId: 'seed-author-bob',
    authorName: 'Bob',
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
      'Has anyone used the Writing Centre for a first-year essay or lab report? I know it is meant to help with structure, argument and academic writing rather than just proofreading.\n\nI am trying to decide whether to book before I get too close to the deadline, or whether it is only useful once you already have a full draft.',
    authorId: 'seed-author-lena',
    authorName: 'Lena',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    isAnonymous: false,
    createdAt: hoursAgo(22),
    commentCount: 2,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    title: 'Student Wellness: what is the fastest way to book help?',
    category: 'Questions',
    content:
      'For students who have used Student Wellness recently: is the UCT App the best route for booking, or is calling better if you need advice quickly?\n\nI know the Student Careline is 0800 24 25 26, but I am not sure what the normal process feels like in practice.',
    authorId: 'seed-author-priya',
    authorName: 'Priya',
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
      'Putting this here so I do not forget:\n\n- student card\n- exam venue checked before leaving\n- water and pens\n- phone charged, but away during the exam\n- shuttle plan if finishing late\n- CPS number saved: 080 650 2222\n\nAlso planning a separate place to revise before writing, because trying to study right outside the venue always makes me more stressed.',
    authorId: 'seed-author-sam',
    authorName: 'Sam',
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
    authorId: 'seed-author-noah',
    authorName: 'Noah',
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
      'Not looking for dramatic advice, just practical things. I blanked in the first 20 minutes of an exam and only settled down halfway through.\n\nIf this has happened to you, what helped before the next paper? I know support exists if it becomes a bigger pattern, but I am also curious about small routines that worked for other students.',
    authorId: 'seed-author-anonymous',
    authorName: 'Anonymous',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
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
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    postId: '99999999-9999-4999-8999-999999999991',
    authorId: 'seed-author-lena',
    authorName: 'Lena',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The prospectus is way easier for the first pass. The handbook is better once you already know which degree you are checking.',
    createdAt: hoursAgo(1.0),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    postId: '99999999-9999-4999-8999-999999999991',
    authorId: 'seed-author-sam',
    authorName: 'Sam',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Also check prerequisite chains before choosing electives. Some courses only make sense if you are planning the next year too.',
    createdAt: hoursAgo(0.7),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    postId: '99999999-9999-4999-8999-999999999992',
    authorId: 'seed-author-noah',
    authorName: 'Noah',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'For Commerce, I would compare majors first and then work backwards through the handbook. Otherwise it gets overwhelming fast.',
    createdAt: hoursAgo(1.4),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
    postId: '99999999-9999-4999-8999-999999999992',
    authorId: 'seed-author-priya',
    authorName: 'Priya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The distinction between BCom and BBusSc is exactly the kind of thing I wish someone explained earlier.',
    createdAt: hoursAgo(1.1),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
    postId: '99999999-9999-4999-8999-999999999993',
    authorId: 'seed-author-maya',
    authorName: 'Maya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Faculty talks first, then residence and campus walking. If you walk first, you can lose half the day just figuring out stairs.',
    createdAt: hoursAgo(2.0),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6',
    postId: '99999999-9999-4999-8999-999999999993',
    authorId: 'seed-author-jeff',
    authorName: 'Jeff',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'If the person is deciding between faculties, I would add one student-life stop too. The vibe matters more than people admit.',
    createdAt: hoursAgo(1.6),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7',
    postId: '99999999-9999-4999-8999-999999999994',
    authorId: 'seed-author-bob',
    authorName: 'Bob',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Anything that says beginners welcome and has a clear meeting place is usually fine. The vague ones are harder.',
    createdAt: hoursAgo(2.6),
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8',
    postId: '99999999-9999-4999-8999-999999999994',
    authorId: 'seed-author-lena',
    authorName: 'Lena',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'I prefer events where there is an actual activity. Standing around trying to introduce yourself is the hard mode.',
    createdAt: hoursAgo(2.2),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    postId: '11111111-1111-4111-8111-111111111111',
    authorId: 'seed-author-lena',
    authorName: 'Lena',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Baxter has been the most reliable for me after 9pm, but it gets cold. Bring a hoodie and your card.',
    createdAt: hoursAgo(47),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    postId: '11111111-1111-4111-8111-111111111111',
    authorId: 'seed-author-sam',
    authorName: 'Sam',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The no-exam-venues-as-study-spaces thing is real. I saw signs up near one venue this week.',
    createdAt: hoursAgo(45),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    postId: '22222222-2222-4222-8222-222222222222',
    authorId: 'seed-author-maya',
    authorName: 'Maya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'CPS escort is worth using if you leave very late. I used it once from upper campus and they were helpful.',
    createdAt: hoursAgo(38),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    postId: '22222222-2222-4222-8222-222222222222',
    authorId: 'seed-author-bob',
    authorName: 'Bob',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Saving the number now. I always think I will remember it and then never do.',
    createdAt: hoursAgo(37),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    postId: '33333333-3333-4333-8333-333333333333',
    authorId: 'seed-author-jeff',
    authorName: 'Jeff',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The ETA is useful, but I still leave a buffer. It is better for deciding whether to wait inside or start walking.',
    createdAt: hoursAgo(27),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
    postId: '33333333-3333-4333-8333-333333333333',
    authorId: 'seed-author-priya',
    authorName: 'Priya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'For exams I would not cut it close. For normal lectures it has been good enough for me.',
    createdAt: hoursAgo(23),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
    postId: '44444444-4444-4444-8444-444444444444',
    authorId: 'seed-author-noah',
    authorName: 'Noah',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'I used them last semester. They did not edit the essay, but helped me see that my paragraphs were not answering the question.',
    createdAt: hoursAgo(19),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8',
    postId: '44444444-4444-4444-8444-444444444444',
    authorId: 'seed-author-sam',
    authorName: 'Sam',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Book before your draft is perfect. It is more useful when you still have time to change the structure.',
    createdAt: hoursAgo(18),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
    postId: '55555555-5555-4555-8555-555555555555',
    authorId: 'seed-author-maya',
    authorName: 'Maya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'For admin-type stuff I used the app. If it feels urgent, the Careline number is probably the better first step.',
    createdAt: hoursAgo(12),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
    postId: '55555555-5555-4555-8555-555555555555',
    authorId: 'seed-author-lena',
    authorName: 'Lena',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'The Ivan Toms building info is useful if you are on lower campus. Upper campus clinic is Steve Biko.',
    createdAt: hoursAgo(11),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    postId: '66666666-6666-4666-8666-666666666666',
    authorId: 'seed-author-bob',
    authorName: 'Bob',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Also pack a snack if your paper finishes late. The post-exam crash is real.',
    createdAt: hoursAgo(7),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
    postId: '66666666-6666-4666-8666-666666666666',
    authorId: 'seed-author-jeff',
    authorName: 'Jeff',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'I would add: check the venue the night before, not five minutes before leaving.',
    createdAt: hoursAgo(6),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13',
    postId: '77777777-7777-4777-8777-777777777777',
    authorId: 'seed-author-priya',
    authorName: 'Priya',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'Try Kramer reception/security first. People often hand things in there before posting online.',
    createdAt: hoursAgo(3),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14',
    postId: '88888888-8888-4888-8888-888888888888',
    authorId: 'seed-author-sam',
    authorName: 'Sam',
    authorAvatarUrl: null,
    authorIsUctVerified: false,
    content:
      'This happened to me too. I write down formulas or keywords for two minutes first, then start with the question I can actually do.',
    createdAt: hoursAgo(1.3),
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15',
    postId: '88888888-8888-4888-8888-888888888888',
    authorId: 'seed-author-noah',
    authorName: 'Noah',
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
