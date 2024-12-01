"use client";

import { UserProfile } from "@clerk/nextjs";

import type { Metadata } from "next";

// Adjust this once home to actually do whats intended
export const metadata: Metadata = {
  title: "My Profile",
  robots: {
    index: true,
    follow: false,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const UserProfilePage = () => (
  <div className="flex flex-row place-content-center">
    <div className="p-5">
      <UserProfile path="/user-profile" routing="path"></UserProfile>
    </div>
  </div>
);

export default UserProfilePage;
