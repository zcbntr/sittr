"use client";

import { UserProfile } from "@clerk/nextjs";
import PreferenceSelector from "~/app/_components/clerkpreferenceselector";
import { MdTune } from "react-icons/md";

const UserProfilePage = () => (
  <div className="flex flex-row place-content-center">
    <div className="p-5">
      <UserProfile path="/user-profile" routing="path">
        <UserProfile.Page
          label="Preferences"
          labelIcon={
            <div className="flex flex-row place-content-center">
              <MdTune size="1.5em" />
            </div>
          }
          url="preferences"
        >
          <PreferenceSelector />
        </UserProfile.Page>
      </UserProfile>
    </div>
  </div>
);

export default UserProfilePage;
