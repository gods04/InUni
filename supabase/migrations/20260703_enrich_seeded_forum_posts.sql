-- Replace thin seeded post prompts with useful UCT-specific post bodies.
-- Run this on the existing Supabase project after 20260703_seed_useful_forum_posts.sql.

with seed_posts (
  id,
  title,
  slug,
  category,
  content,
  is_anonymous
) as (
  values
    (
      '99999999-9999-4999-8999-999999999991'::uuid,
      'Engineering handbook: where do I check course rules?',
      'engineering-handbook-where-do-i-check-course-rules',
      'Academics',
      concat_ws(E'\n\n',
        'If you are in Engineering and the Built Environment, the handbook is the document I would check before trusting random advice about course rules.',
        'The useful difference is this: the undergraduate prospectus helps you compare programmes and entry requirements, but the EBE handbook is where the detailed curriculum rules live. That is where you check course codes, prerequisites, progression rules, electives, majors, and the structure for your actual degree.',
        'For a first pass, I would search the PDF for your programme name, then search the course code. After that, check whether the rule is a faculty rule or a department/programme rule, because those are not always the same thing.',
        'Engineering and the Built Environment undergraduate handbook:',
        'https://uct.ac.za/sites/default/files/media/documents/2026-ebe-handbook-7a-final-web.pdf',
        'UCT undergraduate prospectus:',
        'https://uct.ac.za/students/prospective-students/undergraduate-prospectus'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999992'::uuid,
      'Commerce handbook link for BCom and BBusSc',
      'commerce-handbook-link-for-bcom-and-bbussc',
      'Academics',
      concat_ws(E'\n\n',
        'For Commerce, I would keep both the handbook and the prospectus open, but use them for different jobs.',
        'The prospectus is better when you are still asking, "Which programme am I applying for?" The Commerce undergraduate handbook is better once you need the actual rules for BCom, BBusSc, majors, curriculum structure, course codes, prerequisites, progression, and faculty requirements.',
        'If you are comparing BCom and BBusSc, do not only look at the name of the degree. Check the curriculum structure and the rules for the major you want, then work backwards to first-year courses.',
        'Commerce undergraduate handbook:',
        'https://uct.ac.za/sites/default/files/media/documents/2026-commerce-handbook-6a-final-web.pdf',
        'UCT undergraduate prospectus:',
        'https://uct.ac.za/students/prospective-students/undergraduate-prospectus'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999993'::uuid,
      'Open Day planning: which faculty talks are worth prioritising?',
      'open-day-planning-which-faculty-talks-are-worth-prioritising',
      'Questions',
      concat_ws(E'\n\n',
        'If I had to plan UCT Open Day properly, I would build the day around faculty talks first, then fill the gaps with funding, residence, and campus-life stops.',
        'UCT describes Open Day as including lectures by academic staff from the various faculties, financial assistance information, residence tours, and information about campus facilities. That means the useful part is not just walking around campus. It is hearing how each faculty explains its degrees.',
        'For someone choosing between Engineering, Commerce and Science, I would prioritise one talk in each possible faculty, then one money/housing session, then a short walk through the actual buildings where you would study. The 2026 programme also had specific talks like Mechanical Engineering, Finance, Investment and Banking, Law student life, Health Sciences Q&A, and Science department talks, so checking the programme before arriving matters.',
        'UCT Open Day page:',
        'https://uct.ac.za/students/prospective-students/open-day',
        'Open Day 2026 programme:',
        'https://uct.ac.za/sites/default/files/media/documents/open-day-2026-programme-updated.pdf'
      ),
      false
    ),
    (
      '99999999-9999-4999-8999-999999999994'::uuid,
      'Club and society events: what is actually beginner-friendly?',
      'club-and-society-events-what-is-actually-beginner-friendly',
      'Campus Life',
      concat_ws(E'\n\n',
        'UCT has a lot more than one or two societies, so the best first step is to decide what kind of group you want: academic, cultural, faith-based, political, social, service, sport, or just something fun where you can arrive without knowing anyone.',
        'UCT says there are more than 100 student societies and organisations. Examples listed by UCT include academic or career groups like AIESEC, Black Law Students Forum, the Education Development Unit Student Organisation and Organisational Psychology Students Society; faith groups such as Anglican Students Society, Christian Medical Fellowship, Hindu Students Society, Muslim Youth Movement and the South African Union of Jewish Students; and special-interest groups like Ballroom and Latin Dancing Society, Debating Union, Engineers Without Borders, Habitat for Humanity, RainbowUCT and Women in Computer Science.',
        'Sport is also a big route into campus life. UCT lists around 35 sport clubs with more than 9,000 student and staff members, including traditional sports plus individual activities such as archery, hiking and mountaineering.',
        'For beginner-friendly events, I would look for sessions that say "beginners welcome", have a clear meeting place, and include an actual activity rather than just unstructured socialising. Trials, open practices, volunteering days, debating workshops, dance beginner classes, hiking meetups, and society orientation events are usually easier to enter alone than vague socials.',
        'UCT societies:',
        'https://uct.ac.za/students/student-life/societies',
        'UCT student societies and organisations:',
        'https://uct.ac.za/dsa/student-development/student-societies-organisations',
        'UCT sport clubs:',
        'https://uct.ac.za/dsa/student-development/uct-sport-clubs'
      ),
      false
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Exam study spaces: what is actually calm late at night?',
      'exam-study-spaces-what-is-actually-calm-late-at-night',
      'Academics',
      concat_ws(E'\n\n',
        'For late-night study, I would start with official library spaces before trying random empty buildings.',
        'UCT Libraries lists 24/7 study spaces across campuses. Hlanganani 24/7 is at Chancellor Oppenheimer Library and is available to all UCT students, with after-hours entry from the North Staircase next to the Steve Biko Building. Law 24/7 at Brand van Zyl Law Library is available to all UCT students from 17:00 to 08:00. Impilo Junction at Health Sciences Library is listed for Health Sciences students only.',
        'During term, Chancellor Oppenheimer Library and Brand van Zyl Law Library are listed as open until 22:00 Monday to Friday, with some Saturday hours. UCT also has bookable seats and group study rooms in places like Vincent Kolbe Knowledge Commons, with room/seat time limits, so it is worth booking instead of hoping there is space during exams.',
        'My checklist would be: student card, charger, headphones, water, a backup route home, and CPS saved before leaving late.',
        'UCT 24/7 study spaces:',
        'https://lib.uct.ac.za/services-tools/study-spaces/247',
        'UCT Library hours:',
        'https://lib.uct.ac.za/about-us/library-hours/term-vac',
        'Book a seat or room:',
        'https://lib.uct.ac.za/services-tools/study-spaces/book'
      ),
      false
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      'Late-night safety checklist before leaving campus',
      'late-night-safety-checklist-before-leaving-campus',
      'Campus Life',
      concat_ws(E'\n\n',
        'Late-night campus safety is one of those things that is easier to set up before you need it.',
        'Save Campus Protection Services now: 080 650 2222 toll-free, or 021 650 2222/3. UCT says students and staff can use the toll-free number even without airtime. CPS operates 24 hours a day, seven days a week, and has service points including Upper Campus, Kramer on Middle Campus, Medical Campus, Hiddingh, Obz Square and others.',
        'My personal checklist would be: tell someone when you are leaving, avoid walking alone if possible, use the shuttle where possible, keep your student card with you, skip headphones on quiet routes, and know which CPS point is closest before you start walking.',
        'UCT emergency contacts:',
        'https://uct.ac.za/students/support-emergencies/emergency-contacts',
        'Campus Protection Services:',
        'https://uct.ac.za/staff/campus-protection-services'
      ),
      false
    ),
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Has the UCT Shuttle app been reliable for ETAs?',
      'has-the-uct-shuttle-app-been-reliable-for-etas',
      'Questions',
      concat_ws(E'\n\n',
        'The UCT Shuttle is free for staff and students with a valid UCT staff or student card, so it is worth learning before you urgently need it.',
        'UCT publishes route maps and timetables, and the shuttle app guide explains that the app can show official UCT bus stop locations, routes and bus ETAs after student/staff verification. That is useful, but I would still add a buffer before tests, exams, labs or anything with a strict start time.',
        'For new students, the practical thing is to check the route in advance, know the closest official stop, and remember that some stops may need you to signal the driver or request a stop depending on the route notes.',
        'UCT route maps and timetables:',
        'https://uct.ac.za/students/services-transport-parking-uct-shuttle/route-maps-timetables',
        'UCT Shuttle app guide:',
        'https://uct.ac.za/sites/default/files/content_migration/uct_ac_za/48/files/UCT_Shuttle-App_Guide.pdf'
      ),
      false
    ),
    (
      '44444444-4444-4444-8444-444444444444'::uuid,
      'Writing Centre before essay deadlines: worth it?',
      'writing-centre-before-essay-deadlines-worth-it',
      'Academics',
      concat_ws(E'\n\n',
        'The Writing Centre is worth thinking about before the night before the deadline.',
        'UCT lists the Writing Centre on the 5th floor of the Steve Biko Building, with online bookings and contact number 021 650 2645. UCT library guides also describe one-on-one help through the Writing Centre booking system, generally during weekday office hours.',
        'I would not use it only for proofreading. It is more useful when you want feedback on structure, argument, evidence, academic style, or whether your essay/lab report is answering the question. A rough outline can work if you are stuck early, but a messy full draft gives the consultant more to respond to.',
        'What I would bring: the assignment brief, the marking rubric if there is one, your current draft or outline, and one or two specific questions like "is my argument clear?" or "does this paragraph actually answer the prompt?"',
        'UCT Writing support:',
        'https://uct.ac.za/postgraduate-hub/development-support/writing-support',
        'UCT Library writing tools and guides:',
        'https://libguides.lib.uct.ac.za/c.php?g=182289&p=7519057'
      ),
      false
    ),
    (
      '55555555-5555-4555-8555-555555555555'::uuid,
      'Student Wellness: what is the fastest way to book help?',
      'student-wellness-what-is-the-fastest-way-to-book-help',
      'Questions',
      concat_ws(E'\n\n',
        'For Student Wellness, the fastest route depends on whether it is urgent or something you can book.',
        'UCT says Student Wellness Services offers support including counselling and access to the UCT Student Careline. For normal counselling support, UCT says students can book online or call the SWS Counselling Service at 021 650 1017. For office-hours urgent assistance, UCT lists the SWS Hotline at 021 650 1020 and the Ivan Toms Building service point on Lower Campus.',
        'For mental health emergencies at any hour, UCT lists the Student Careline on 0800 24 25 26 or SMS 31393 for a call-me-back. For general emergencies, CPS is 080 650 2222 toll-free.',
        'My practical advice: if it is admin or a planned appointment, book online/call. If it feels urgent, use the hotline or go to a service point during office hours. If it is after hours and serious, use the Careline or CPS instead of waiting for a normal booking.',
        'Student Wellness Services:',
        'https://uct.ac.za/dsa/student-wellness-services',
        'Counselling services:',
        'https://uct.ac.za/dsa/student-wellness-services/counselling-services',
        'SWS appointments:',
        'https://uct.ac.za/dsa/sws-appointments'
      ),
      false
    ),
    (
      '66666666-6666-4666-8666-666666666666'::uuid,
      'Mini exam-day checklist for campus',
      'mini-exam-day-checklist-for-campus',
      'Academics',
      concat_ws(E'\n\n',
        'My UCT exam-day checklist would start with the boring things, because those are the things that ruin the morning.',
        'UCT exam prep advice says to know where and when the exam is, plan to arrive at least 30 minutes early, and not forget your student registration card. It also points students back to Handbook 3, General Rules and Policies, for exam rules.',
        'I would pack: student card, pens/pencils/calculator if allowed, water, something small to eat, a charged phone for before/after the exam, and a clear plan for transport. I would also check the venue the day before if it is in a building I do not normally use.',
        'If finishing late, I would save CPS and plan the shuttle/route home before writing, not after walking out tired.',
        'UCT exam prep tips:',
        'https://uct.ac.za/students/current-students-exams/exam-prep-tips',
        'UCT emergency contacts:',
        'https://uct.ac.za/students/support-emergencies/emergency-contacts'
      ),
      false
    ),
    (
      '77777777-7777-4777-8777-777777777777'::uuid,
      'Lost and found: what details help people return items?',
      'lost-and-found-what-details-help-people-return-items',
      'Lost & Found',
      concat_ws(E'\n\n',
        'If you lose something at UCT, I would post enough detail for people to recognise the item, but not so much that anyone can falsely claim it.',
        'UCT has a Lost and Found Property Office administered through Access Control. The HR page says lost property is forwarded to the Access Control Administration Office in room 2.01, Properties and Services Building, Madiba Circle, Upper Campus, and that the office is open weekdays between 14:00 and 15:00. Older student support material also points students to a Lost and Found Office at the Control Office, Geo Science Extension Building, Upper Campus.',
        'A useful lost-item post should include: item type, colour, rough location, time/date, one identifying detail, and where you are willing to collect it. Do not post your student number, full address, card number, or every unique mark on the item. Keep one proof-of-ownership detail private.',
        'If you find something valuable, handing it to a CPS/security desk or official lost-and-found point is safer than arranging a random handover.',
        'UCT lost and found property:',
        'https://hr.uct.ac.za/remuneration-benefits-other-employment-benefits/lost-and-found-property',
        'UCT Access Control:',
        'https://uct.ac.za/students/services-access-control/access-control-overview'
      ),
      false
    ),
    (
      '88888888-8888-4888-8888-888888888888'::uuid,
      'Exam reset advice: how do you recover before the next paper?',
      'exam-reset-advice-how-do-you-recover-before-the-next-paper',
      'Confessions',
      concat_ws(E'\n\n',
        'If an exam went badly, I would separate two things: what needs admin/action, and what is just the emotional crash after writing.',
        'For the next paper, the most useful reset is usually small and practical: eat, sleep, stop replaying the paper with everyone outside the venue, check the next exam time and venue, and make a short plan for the topics that still carry marks. If you froze because of panic, it can help to practise a simple first-five-minutes routine: breathe, read all instructions, mark the questions you can start, and do one easier section first if the exam format allows it.',
        'If it feels bigger than a bad day, UCT lists Student Wellness support and the UCT Student Careline. The Careline is available on 0800 24 25 26 or SMS 31393 for a call-me-back. For immediate danger or emergencies, use CPS on 080 650 2222.',
        'UCT Student Wellness Services:',
        'https://uct.ac.za/dsa/student-wellness-services',
        'UCT exam prep tips:',
        'https://uct.ac.za/students/current-students-exams/exam-prep-tips',
        'UCT emergency contacts:',
        'https://uct.ac.za/students/support-emergencies/emergency-contacts'
      ),
      false
    )
)
update public.posts
set
  title = seed_posts.title,
  slug = seed_posts.slug,
  category = seed_posts.category,
  content = seed_posts.content,
  is_anonymous = seed_posts.is_anonymous
from seed_posts
where public.posts.id = seed_posts.id;
