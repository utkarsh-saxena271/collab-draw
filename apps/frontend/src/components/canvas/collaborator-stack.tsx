import type { RoomCollaborator } from "@repo/common";
import { getPresenceInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const PRESENCE_COLORS = [
  { background: "#ede9fe", color: "#5b21b6" },
  { background: "#dbeafe", color: "#1d4ed8" },
  { background: "#dcfce7", color: "#15803d" },
  { background: "#fef3c7", color: "#b45309" },
  { background: "#fce7f3", color: "#be185d" },
  { background: "#cffafe", color: "#0e7490" },
];

function colorFor(userId: string) {
  const hash = Array.from(userId).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );

  return PRESENCE_COLORS[hash % PRESENCE_COLORS.length];
}

export function CollaboratorStack({
  collaborators,
  selfUserId,
}: {
  collaborators: RoomCollaborator[];
  selfUserId: string | null;
}) {
  if (collaborators.length === 0) {
    return null;
  }

  const visible = collaborators.slice(0, 4);
  const overflow = collaborators.length - visible.length;

  return (
    <div
      className="flex items-center"
      aria-label={`${collaborators.length} collaborator${
        collaborators.length === 1 ? "" : "s"
      } online`}
    >
      <div className="flex -space-x-2">
        {visible.map((person) => {
          const palette = colorFor(person.userId);
          const isSelf = person.userId === selfUserId;

          return (
            <span
              key={person.userId}
              title={`${person.name}${isSelf ? " (you)" : ""}`}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-sm",
                isSelf && "ring-2 ring-violet-300"
              )}
              style={{
                backgroundColor: palette.background,
                color: palette.color,
              }}
            >
              {getPresenceInitials(person.name)}
            </span>
          );
        })}
      </div>

      {overflow > 0 ? (
        <span className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[11px] font-bold text-gray-600 shadow-sm">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
