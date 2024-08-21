// user sets whether they are an owner or a sitter, then sets their preferences
"use client";

import { useSearchParams } from "next/navigation";

export default function Onboarder() {
  const searchParams = useSearchParams();

  const rawRoleUrlParam = searchParams.get("role");
  let role = "owner";
  let otherRole = "sitter";

  if (rawRoleUrlParam === "owner") {
  } else if (rawRoleUrlParam === "sitter") {
    role = "sitter";
    otherRole = "owner";
  } else {
    // redirect to homepage
  }

  return (
    <>
      <div>
        <h2 className="text-2xl">You have signed up to be a {role}.</h2>
        <div className="text-lg">
          Swap to a{" "}
          <a href={"/onboarding?role=" + otherRole} className="text-blue">
            {otherRole}
          </a>
        </div>
        <div>{/* Preferences - state management or a form? */}</div>
      </div>
    </>
  );
}
