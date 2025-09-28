// Shared type definitions for Budbringer

export interface DigestBullet {
  text: string;
  sourceUrl?: string;
  sourceName?: string;
}

export type DigestBulletItem = string | DigestBullet;

export interface DigestSection {
  heading: string;
  bullets: DigestBulletItem[];
  link?: string;
}

export interface DigestContent {
  dateLabel: string;
  lead: string;
  sections: DigestSection[];
  actions: string[];
}

export interface DigestEmailPayload {
  dateLabel: string;
  lead: string;
  sections: DigestSection[];
  actions?: string[];
  audioUrl?: string | null;
}