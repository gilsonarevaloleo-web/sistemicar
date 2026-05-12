import { useEffect } from "react";
import { toast } from "sonner";
import { Crown } from "lucide-react";

const GOLD = "#D4AF37";

export function useSovereigntyToast() {
  useEffect(() => {
    const handlePointsAwarded = (event: CustomEvent<{ amount: number; source?: string; newTotal: number }>) => {
      const { amount, source } = event.detail;
      
      toast(
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${GOLD}20` }}
          >
            <Crown size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: GOLD }}>
              +{amount} pts
            </p>
            {source && (
              <p className="text-xs text-slate-400">{source}</p>
            )}
          </div>
        </div>,
        {
          duration: 2500,
          style: {
            backgroundColor: "#0a0a0a",
            border: `1px solid ${GOLD}40`,
            padding: "12px 16px"
          }
        }
      );
    };

    window.addEventListener("sovereignty-points-awarded", handlePointsAwarded as EventListener);
    return () => {
      window.removeEventListener("sovereignty-points-awarded", handlePointsAwarded as EventListener);
    };
  }, []);
}

export function SovereigntyPointsDisplay({ points }: { points: number }) {
  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
    >
      <Crown size={14} style={{ color: GOLD }} />
      <span className="text-sm font-bold" style={{ color: GOLD }}>
        {points}
      </span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">pts</span>
    </div>
  );
}
