import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type SelectUser } from "~/lib/schemas/users";
import Link from "next/link";

export default function AccountPage({ user }: { user: SelectUser }) {
  return (
    <div className="flex w-2/3 max-w-xl flex-row place-content-center">
      <div className="flex flex-col gap-3">
        <div>{user.name}</div>
        <div>{user.plusMembership && <div>Plus Member</div>}</div>
        {!user.plusMembership && (
          <div>
            You are not a Plus member.
            <Link href="/plus" prefetch={true}>
              Learn More
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
