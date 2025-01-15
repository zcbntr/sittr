import { signIn } from "~/auth";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import Link from "next/link";

export function SignInOptions() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>
          Login with your Google or Facebook account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
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
        </div>
      </CardContent>
      <CardFooter className="text-xs text-opacity-50">
        <div className="flex flex-col gap-3">
          <div>
            By clicking continue, you agree to our{" "}
            <Link href="/terms-of-service" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
