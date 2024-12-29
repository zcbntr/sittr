import * as React from "react";
import { SupportEmailParams } from "~/lib/schemas";

export const SupportEmailTemplate: React.FC<Readonly<SupportEmailParams>> = ({
  fullName,
  email,
  category,
  message,
  userId,
}) => (
  <div>
    <h1>
      User {fullName} ({email}):
    </h1>

    {!userId && <h2>Not logged in</h2>}
    {userId && <h2>User ID: {userId}</h2>}
    <h2>Category: {category}</h2>
    <p>{message}</p>
  </div>
);
