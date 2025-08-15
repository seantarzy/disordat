"use client";
import Image from "next/image";
import clsx from "clsx";

export default function Genie({ verdict }: { verdict: "dis" | "dat" | "shrug" | null }) {
  const src =
    verdict === "dis" ? "/genie-point-left.svg" :
    verdict === "dat" ? "/genie-point-right.svg" :
    "/genie-shrug.svg";
  const label =
    verdict === "dis" ? "Genie points to dis" :
    verdict === "dat" ? "Genie points to dat" :
    verdict === "shrug" ? "Genie shrugs" : "Genie";

  // Horizontal nudge on desktop to visually align fingertip with the card
  const nudge = verdict === "dis" ? "-translate-x-[8%]" : verdict === "dat" ? "translate-x-[8%]" : "";

  return (
    <div className={clsx("relative flex justify-center items-center my-6 md:my-10", nudge)}>
      <Image
        src={src}
        alt={label}
        role="img"
        aria-label={label}
        width={260}
        height={260}
        priority
      />
    </div>
  );
}

