import { MdOutlineExitToApp } from "react-icons/md";
import { signOut } from "~/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit">
        <div className="flex flex-row place-content-start gap-2">
          <div className="flex flex-col place-content-center">
            <MdOutlineExitToApp />
          </div>
          Sign Out
        </div>
      </button>
    </form>
  );
}
