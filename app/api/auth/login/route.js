export async function POST() {
  return Response.json(
    {
      ok: true,
      user: {
        id: null,
        email: "open-access@eventra.local",
        name: "Eventra Operator",
        globalRole: "admin",
        roles: ["admin"]
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
