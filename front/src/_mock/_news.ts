import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const NEWS_PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export const NEWS_SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'oldest', label: 'Oldest' },
];

// ----------------------------------------------------------------------

export const CONTENT = `
<h6>Introduction</h6>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

<h6>Key Points</h6>

<ul>
  <li>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</li>
  <li>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</li>
  <li>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</li>
  <li>Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.</li>
</ul>

<h6>Conclusion</h6>

<p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
`;

export const COMMENTS = [
  {
    id: _mock.id(1),
    name: _mock.fullName(1),
    message: 'Great article! Very informative and well-written.',
    avatarUrl: _mock.image.avatar(1),
    postedAt: _mock.time(1),
    users: [
      {
        id: _mock.id(1),
        name: _mock.fullName(1),
        avatarUrl: _mock.image.avatar(1),
      },
    ],
    replyComment: [],
  },
  {
    id: _mock.id(2),
    name: _mock.fullName(2),
    message: 'This is exactly what I was looking for. Thank you for sharing!',
    avatarUrl: _mock.image.avatar(2),
    postedAt: _mock.time(2),
    users: [
      {
        id: _mock.id(2),
        name: _mock.fullName(2),
        avatarUrl: _mock.image.avatar(2),
      },
    ],
    replyComment: [],
  },
];

// News data is now fetched from API
// See: src/actions/news.ts
export const _news: any[] = [];
