"use client";

import { useEffect } from "react";
import { useServerAction } from "zsa-react";
import { Card, CardContent } from "~/components/ui/card";
import { joinGroupAction } from "~/server/actions/group-actions";

export default function JoinGroupPage({ slug }: { slug: string }) {
  const { isPending, error, execute } = useServerAction(joinGroupAction, {});

  useEffect(() => {
    execute({ inviteCode: slug });
  }, [slug]);

  return (
    <div className="container flex grow flex-col p-5">
      <Card>
        <CardContent>
          <div className="flex flex-col place-content-center">
            <div className="flex flex-row place-content-center">
              {isPending && <p>Joining Group...</p>}
              {error && <p>Error: {error.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
