import Image from "next/image";
const descriptions = {
  agenda:
    "TaskFlow Android app showing a weekly calendar and today’s tasks with times, priorities, and notes.",
  calendar:
    "TaskFlow Android app showing its monthly calendar and daily agenda.",
  tasks: "TaskFlow Android app showing searchable tasks and priority filters.",
};
export default function Phone({
  screen = "agenda",
  className = "",
  eager = false,
}: {
  screen?: "agenda" | "calendar" | "tasks";
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone-camera" aria-hidden="true"></div>
      <div className="phone-screen">
        <Image
          className="light-only"
          src={`/images/${screen}-light.png`}
          width={1080}
          height={2400}
          sizes="(max-width: 580px) 210px, 252px"
          alt={descriptions[screen]}
          preload={eager}
        />
        <Image
          className="dark-only"
          src={`/images/${screen}-dark.png`}
          width={1080}
          height={2400}
          sizes="(max-width: 580px) 210px, 252px"
          alt={descriptions[screen]}
          loading={eager ? "eager" : "lazy"}
        />
      </div>
    </div>
  );
}
