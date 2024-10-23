"use client";

import Link from "next/link";

export default function GroupRedirectButton({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/group/${groupId}`}>
      <div>{children}</div>
    </Link>
  );
}
