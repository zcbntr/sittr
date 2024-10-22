"use client";

import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => (
  <div className="flex flex-row place-content-center">
    <div className="p-5">
      <UserProfile path="/user-profile" routing="path"></UserProfile>
    </div>
  </div>
);

export default UserProfilePage;
