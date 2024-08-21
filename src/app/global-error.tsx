"use client";

import Error from "next/error";

export default function GlobalError(props: { error: unknown }) {
  return (
    <html>
      <body>
        <Error statusCode={500} title="Error" />
      </body>
    </html>
  );
}
