"use client";

export function ProfileFloatingDock({
  targetUserId,
  targetUserName,
  isSparked,
  sparkBusy,
  onSpark,
  onMessage,
}: {
  targetUserId: string;
  targetUserName: string;
  isSparked: boolean;
  sparkBusy: boolean;
  onSpark: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#DDD7E5] bg-white/95 p-3.5 backdrop-blur-md">
      <div className="mx-auto max-w-md flex items-center gap-3">
        <button
          type="button"
          onClick={onSpark}
          disabled={sparkBusy}
          className={
            "flex-1 h-12 rounded-2xl text-xs font-bold transition active:scale-95 disabled:opacity-60 " +
            (isSparked
              ? "bg-[#6555B8] text-white shadow-2xs"
              : "border border-[#9A8CC3]/25 bg-[#F3EFFC] text-[#6555B8] hover:bg-[#e8e1f8]")
          }
        >
          {isSparked ? "Sparked \u26A1" : "Spark"}
        </button>
        <button
          type="button"
          onClick={onMessage}
          className="flex-[2] h-12 rounded-2xl bg-[#6555B8] text-white text-xs font-semibold shadow-sm transition hover:bg-[#5849a6] active:scale-95"
        >
          Message {targetUserName}
        </button>
      </div>
    </div>
  );
}