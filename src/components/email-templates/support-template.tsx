import * as React from "react";
import { SupportEmailParams } from "~/lib/schemas";

export const SupportEmailTemplate: React.FC<Readonly<SupportEmailParams>> = ({
  fullName,
  email,
  message,
  loggedIn,
  userId,
}) => (
  <div>
    <h1>
      User {fullName} ({email}):
    </h1>
    <h2>Logged in: {loggedIn}</h2>
    {loggedIn && userId && <h2>User ID: {userId}</h2>}
    <p>{message}</p>
  </div>
);
