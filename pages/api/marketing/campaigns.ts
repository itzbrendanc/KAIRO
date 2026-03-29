import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { sendCampaignToAudience } from "@/lib/email";
import { createCampaign, listCampaignEvents, listCampaigns, listAudienceMembers } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (!session.user.premium) {
    return res.status(403).json({ error: "Premium subscription required." });
  }

  if (req.method === "GET") {
    const [campaigns, audience, events] = await Promise.all([
      listCampaigns(),
      listAudienceMembers(),
      listCampaignEvents()
    ]);

    return res.status(200).json({ campaigns, audience, events });
  }

  if (req.method === "POST") {
    const { name, subject, previewText, contentHtml, sendNow } = req.body as {
      name?: string;
      subject?: string;
      previewText?: string;
      contentHtml?: string;
      sendNow?: boolean;
    };

    if (!name || !subject || !contentHtml) {
      return res.status(400).json({ error: "Name, subject, and content are required." });
    }

    const campaign = await createCampaign({
      name,
      subject,
      previewText,
      contentHtml,
      status: sendNow ? "sending" : "draft"
    });

    const result = sendNow ? await sendCampaignToAudience(campaign) : { sent: 0, usedSmtp: false };

    return res.status(200).json({
      ok: true,
      campaign,
      result
    });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
