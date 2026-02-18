import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type INewsFilters = {
  publish: string;
};

export type INewsHero = {
  title: string;
  createdAt?: IDateValue;
  coverUrl: File | string | null;
  author?: {
    name: string;
    avatarUrl: string;
  };
};

export type INewsComment = {
  id: string;
  name: string;
  message: string;
  avatarUrl: string;
  postedAt: IDateValue;
  users: {
    id: string;
    name: string;
    avatarUrl: string;
  }[];
  replyComment: {
    id: string;
    userId: string;
    message: string;
    tagUser?: string;
    postedAt: IDateValue;
  }[];
};

export type INewsItem = {
  id: string;
  title: string;
  tags: string[];
  publish: string;
  content: string;
  coverUrl: string;
  metaTitle: string;
  totalViews: number;
  totalShares: number;
  description: string;
  totalComments: number;
  createdAt: IDateValue;
  totalFavorites: number;
  metaKeywords: string[];
  metaDescription: string;
  comments: INewsComment[];
  author: {
    id?: string;
    name: string;
    avatarUrl: string;
  };
  favoritePerson: {
    name: string;
    avatarUrl: string;
  }[];
};
