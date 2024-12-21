import { MdOutlineExitToApp } from "react-icons/md";
import { signOut } from "~/auth";

export default function SignOutButton() {
  return (
    <button
      type="submit"
      onClick={async () => {
        "use server";
        console.log(" sign out");

        await signOut({ redirectTo: "/" });
      }}
    >
      <div className="flex flex-row place-content-start gap-2">
        <div className="flex flex-col place-content-center">
          <MdOutlineExitToApp />
        </div>
        Sign Out
      </div>
    </button>
  );
}
