import * as React from "react";
import { type SupportEmailParams } from "~/lib/schemas";

export const SupportEmailTemplate: React.FC<Readonly<SupportEmailParams>> = ({
  fullName,
  email,
  category,
  message,
  userId,
}) => (
  <div>
    <h2>
      {fullName} ({email})
    </h2>
    <h2>User ID: {userId}</h2>
    <h2>Category: {category}</h2>
    <p>{message}</p>
  </div>
);
