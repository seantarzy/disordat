"use client";
import Image from "next/image";
import clsx from "clsx";

export default function Genie({ verdict }: { verdict: "dis" | "dat" | "shrug" | null }) {
  const src =
    verdict === "dis"
      ? "/genie-dis-left.svg"
      : verdict === "dat"
      ? "/genie-dat-right.svg"
      : verdict === "shrug"
      ? "/genie-shrug.svg"
      : "/genie-idle.svg";
  const label =
    verdict === "dis"
      ? "Genie holds dis sign in left palm"
      : verdict === "dat"
      ? "Genie holds dat sign in right palm"
      : verdict === "shrug"
      ? "Genie shrugs with question marks"
      : "Genie in idle stance with hands on hips";

  // Horizontal nudge on desktop to visually align sign with the card
  const nudge =
    verdict === "dis"
      ? "-translate-x-[6%]"
      : verdict === "dat"
      ? "translate-x-[6%]"
      : "";

  return (
    <div
      className={clsx(
        "relative flex justify-center items-center my-6 md:my-10",
        nudge
      )}
    >
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

