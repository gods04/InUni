import { describe, expect, it } from 'vitest';
import { getPostPath, getUniquePostSlug, slugifyPostTitle } from './postSlug';

describe('post slug helpers', () => {
  it('turns a post title into a readable Google-friendly URL slug', () => {
    expect(
      slugifyPostTitle('Engineering handbook: where do I check course rules?'),
    ).toBe('engineering-handbook-where-do-i-check-course-rules');
  });

  it('uses a post slug for public post links instead of the raw identifier', () => {
    expect(
      getPostPath({
        id: '99999999-9999-4999-8999-999999999991',
        slug: 'engineering-handbook-where-do-i-check-course-rules',
        title: 'Engineering handbook: where do I check course rules?',
      }),
    ).toBe('/post/engineering-handbook-where-do-i-check-course-rules');
  });

  it('adds a numeric suffix when a post title already has the base slug', () => {
    expect(
      getUniquePostSlug('New UCT question', [
        'new-uct-question',
        'new-uct-question-2',
      ]),
    ).toBe('new-uct-question-3');
  });
});
