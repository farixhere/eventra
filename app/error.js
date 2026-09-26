"use client";

export default function Error({ reset }) {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"32px",fontFamily:"system-ui,sans-serif"}}>
      <section style={{maxWidth:560,textAlign:"center"}}>
        <p style={{letterSpacing:".12em",fontSize:12,fontWeight:700}}>EVENTRA</p>
        <h1>Something went wrong.</h1>
        <p>The page hit an unexpected error. Your event data is not being displayed until the page recovers.</p>
        <button onClick={()=>reset()} style={{padding:"12px 18px",borderRadius:10,border:"1px solid currentColor",background:"transparent",cursor:"pointer"}}>Try again</button>
      </section>
    </main>
  );
}
