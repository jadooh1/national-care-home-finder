"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

type Claim = { id: string; facility_id: string; verification_status: string; reviewed_at: string | null };
export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !data.user) { router.replace("/owner"); return; }
      setUser(data.user);
      const result = await supabase.from("owner_claims")
        .select("id,facility_id,verification_status,reviewed_at")
        .eq("claimant_user_id", data.user.id)
        .order("reviewed_at", { ascending: false });
      if (!active) return;
      if (result.error) setError("Unable to load ownership claim status at this time.");
      else setClaims((result.data ?? []) as Claim[]);
      setLoading(false);
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/owner");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router]);

  async function signOut() { await supabase.auth.signOut(); router.replace("/owner"); }
  return <main style={{minHeight:"100vh",fontFamily:"Arial,sans-serif",background:"#f4f8fb",color:"#123c59",padding:"30px 5%"}}>
    <div style={{maxWidth:1000,margin:"auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:15,flexWrap:"wrap"}}><Link href="/washington" style={{color:"#176b53"}}>← Washington directory</Link><button type="button" onClick={signOut} style={{padding:"10px 16px",background:"white",border:"1px solid #176b53",borderRadius:8,color:"#176b53",cursor:"pointer"}}>Sign out</button></header>
      <h1 style={{fontSize:35,marginTop:35}}>Owner dashboard</h1>
      {loading ? <p role="status">Checking account…</p> : <>
        <p>Signed in as <strong>{user?.email}</strong></p>
        <section style={{background:"white",padding:26,borderRadius:15,border:"1px solid #dbe5eb",marginTop:24}}>
          <h2>Facility ownership</h2>
          <p style={{lineHeight:1.7}}>Account registration alone does not confirm ownership. Facility claim submission and administrator verification will be added after security testing.</p>
          {error && <p role="alert" style={{color:"#ae2222"}}>{error}</p>}
          {!error && claims.length === 0 && <p>No ownership claims are associated with this account yet.</p>}
          {claims.map(claim => <div key={claim.id} style={{padding:"15px 0",borderTop:"1px solid #dbe5eb"}}><strong>Facility ID:</strong> {claim.facility_id}<p>Verification status: <strong>{claim.verification_status}</strong></p></div>)}
        </section>
      </>}
    </div>
  </main>;
}
