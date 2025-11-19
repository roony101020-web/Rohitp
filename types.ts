export type UserRole = 'dev' | 'editor' | 'pending' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
  active: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string; // Base64 or URL
  category: string;
}

export interface SchoolStats {
  students: number;
  teachers: number;
  awards: number;
  years: number;
}

export interface SiteConfig {
  schoolName: string;
  schoolId: string;
  address: string;
  email: string;
  phone: string;
  primaryColor: string; // Hex
  accentColor: string; // Hex
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string; // Base64/URL
  principalName: string;
  principalMessage: string;
  principalPhoto: string;
  stats: SchoolStats;
  features: {
    showNews: boolean;
    showEvents: boolean;
    showGallery: boolean;
  };
}

export const DEFAULT_CONFIG: SiteConfig = {
  schoolName: "Sarvodaya Bal Vidhayalaya",
  schoolId: "1925056",
  address: "Sector 4, RK Puram, New Delhi",
  email: "contact@sbv-school.com",
  phone: "+91 11 2345 6789",
  primaryColor: "#1e40af", // Blue 800
  accentColor: "#ca8a04", // Yellow 600
  heroTitle: "Empowering Future Leaders",
  heroSubtitle: "Excellence in Education, Character, and Innovation",
  heroImage: "https://picsum.photos/1920/1080?grayscale",
  principalName: "Dr. R.K. Sharma",
  principalMessage: "Welcome to SBV. We believe in nurturing every child's potential through holistic education.",
  principalPhoto: "https://picsum.photos/400/400?people",
  stats: {
    students: 1200,
    teachers: 85,
    awards: 150,
    years: 45
  },
  features: {
    showNews: true,
    showEvents: true,
    showGallery: true
  }
};