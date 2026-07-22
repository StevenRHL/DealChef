import { getFixtureDeals } from "../../../../lib/deals";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getFixtureDeals().find((item) => item.id === decodeURIComponent(id));
  return deal ? Response.json({ deal }) : Response.json({ error: "Deal not found" }, { status: 404 });
}
