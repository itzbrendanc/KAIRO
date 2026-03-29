import type { NextApiRequest } from "next";
import nodemailer from "nodemailer";
import { createCampaignEvent, listAudienceMembers, markCampaignSent } from "@/lib/repository";

function getBaseUrl(req?: NextApiRequest) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  const host = req?.headers.host ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
}

export async function sendVerificationEmail(email: string, token: string, req?: NextApiRequest) {
  const verifyUrl = `${getBaseUrl(req)}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const subject = "Verify your KAIRO account";
  const text = `Verify your KAIRO account by clicking this link: ${verifyUrl}`;
  const html = `<p>Verify your KAIRO account by clicking this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;

  const transport = await getTransport();
  if (!transport || !process.env.SMTP_FROM) {
    return {
      sent: false,
      verifyUrl,
      error: null as string | null
    };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject,
      text,
      html
    });

    return {
      sent: true,
      verifyUrl,
      error: null as string | null
    };
  } catch (error) {
    console.error("Verification email delivery failed", error);
    return {
      sent: false,
      verifyUrl,
      error: error instanceof Error ? error.message : "Unable to send verification email."
    };
  }
}

export async function sendCampaignToAudience(campaign: {
  id: number;
  subject: string;
  previewText?: string | null;
  contentHtml: string;
}) {
  const transport = await getTransport();
  const audience = await listAudienceMembers();
  const recipients = audience.filter((member) => member.marketingOptIn && member.status === "subscribed");

  for (const recipient of recipients) {
    if (transport && process.env.SMTP_FROM) {
      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient.email,
          subject: campaign.subject,
          text: campaign.previewText ?? "KAIRO update",
          html: campaign.contentHtml
        });
      } catch (error) {
        console.error(`Campaign send failed for ${recipient.email}`, error);
      }
    }

    await createCampaignEvent({
      campaignId: campaign.id,
      audienceMemberId: recipient.id,
      email: recipient.email,
      eventType: "sent",
      metadata: JSON.stringify({
        previewText: campaign.previewText ?? ""
      })
    });
  }

  await markCampaignSent(campaign.id);

  return {
    sent: recipients.length,
    usedSmtp: Boolean(transport && process.env.SMTP_FROM)
  };
}
