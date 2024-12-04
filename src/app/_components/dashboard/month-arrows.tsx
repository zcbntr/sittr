import { Button } from "~/components/ui/button";
import { getDominantMonth } from "~/lib/utils";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import Link from "next/link";

export default function MonthArrows({ from, to }: { from: Date; to: Date }) {
  //   Calculate middle date of from and to, then display the month and year of that date
  const displayMonth = getDominantMonth(from, to);

  return (
    <div className="flex flex-row gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link
          href={`/?from=${new Date(from.setMonth(from.getMonth() - 1)).toISOString()}&to=${new Date(to.setMonth(to.getMonth() - 1)).toISOString()}`}
        >
          <MdArrowBack />
        </Link>
      </Button>

      <div className="flex flex-col place-content-center">
        <span className="text-center">{displayMonth}</span>
      </div>

      <Button variant="outline" size="icon" asChild>
        <Link
          href={`/?from=${new Date(from.setMonth(from.getMonth() + 2)).toISOString()}&to=${new Date(to.setMonth(to.getMonth() + 2)).toISOString()}`}
        >
          <MdArrowForward />
        </Link>
      </Button>
    </div>
  );
}
