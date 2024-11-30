"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { getDominantMonth } from "~/lib/utils";
import { MdArrowBack, MdArrowForward } from "react-icons/md";

export default function MonthArrows({
  initialFrom,
  initialTo,
}: {
  initialFrom: Date;
  initialTo: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState<Date>(initialFrom);
  const [to, setTo] = useState<Date>(initialTo);
  //   Calculate middle date of from and to, then display the month and year of that date

  const [displayMonth, setDisplayMonth] = useState<string>(
    getDominantMonth(from, to),
  );

  return (
    <div className="flex flex-row gap-2">
      <Button variant="outline" size="icon">
        <span
          onClick={() => {
            setFrom(new Date(from.setMonth(from.getMonth() - 1)));
            setTo(new Date(to.setMonth(to.getMonth() - 1)));
            setDisplayMonth(getDominantMonth(from, to));
            const params = new URLSearchParams(searchParams);
            params.set("from", from.toISOString());
            params.set("to", to.toISOString());
            router.replace(`${pathname}?${params.toString()}`);
          }}
        >
          <MdArrowBack />
        </span>
      </Button>
      <div className="flex flex-col place-content-center">
        <span className="text-center">{displayMonth}</span>
      </div>
      <Button variant="outline" size="icon">
        <span
          onClick={() => {
            setFrom(new Date(from.setMonth(from.getMonth() + 1)));
            setTo(new Date(to.setMonth(to.getMonth() + 1)));
            setDisplayMonth(getDominantMonth(from, to));
            const params = new URLSearchParams(searchParams);
            params.set("from", from.toISOString());
            params.set("to", to.toISOString());
            router.replace(`${pathname}?${params.toString()}`);
          }}
        >
          <MdArrowForward />
        </span>
      </Button>
    </div>
  );
}
