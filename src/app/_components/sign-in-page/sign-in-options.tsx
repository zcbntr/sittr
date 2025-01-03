import { signIn } from "~/auth";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FaFacebook, FaGoogle } from "react-icons/fa";

export function SignInOptions() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row place-content-center">
          <div className="flex w-full flex-col gap-4">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="default"
                className="w-full text-lg"
              >
                <div className="flex flex-col place-content-center">
                  <FaGoogle />
                </div>
                Google
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("facebook", { redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                disabled
                variant="default"
                className="w-full text-lg"
              >
                <div className="flex flex-col place-content-center">
                  <FaFacebook />
                </div>
                Facebook
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-opacity-50">
        Your data will be used to connect your pets, groups, and tasks with your
        chosen account. You can request to remove it at any time in your account
        settings.
      </CardFooter>
    </Card>
  );
}
