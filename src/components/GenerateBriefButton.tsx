import { useState } from "react";
import { supabase } from "@/lib/supabase"; // adjust to ../lib/supabase if needed
import { createBrief } from "@/lib/briefs";

export default function GenerateBriefButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onClick = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error("You must be signed in.");

      await createBrief({
        mood: "focus",
        topics: ["starter"],
        duration_sec: 300
      });

      setMsg("✅ Brief created (queued). Check the 'briefs' table in Supabase.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Failed to create brief"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Generate Test Brief"}
      </button>
      {msg && <div className="text-sm opacity-80">{msg}</div>}
    </div>
  );
}