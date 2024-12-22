import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { User } from "~/lib/schemas/users";
import Link from "next/link";

export default function AccountPage({ user }: { user: User }) {
  return (
    <div>
      <div>{user.name}</div>
      <div>{user.plusMembership && <div>Plus Member</div>}</div>
      {!user.plusMembership && (
        <Link href="/get-plus" prefetch={true}>
          Get Sittr Plus
        </Link>
      )}
    </div>
  );
}
