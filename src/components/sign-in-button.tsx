import { signIn } from "~/auth";

export default function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/" });
      }}
    >
      <button type="submit">Sign In</button>
    </form>
  );
}
