import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { getUserProfile, updateUserProfile } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Sign in to access your profile." });
  }

  try {
    if (req.method === "GET") {
      const profile = await getUserProfile(session.user.id);
      return res.status(200).json({ profile });
    }

    if (req.method === "POST") {
      const {
        experienceLevel,
        riskTolerance,
        investingGoal,
        timeHorizon,
        favoriteSectors,
        favoriteSymbols,
        preferredStrategies,
        bio,
        onboardingCompleted
      } = req.body as {
        experienceLevel?: string;
        riskTolerance?: string;
        investingGoal?: string;
        timeHorizon?: string;
        favoriteSectors?: string;
        favoriteSymbols?: string;
        preferredStrategies?: string;
        bio?: string;
        onboardingCompleted?: boolean;
      };

      if (!experienceLevel || !riskTolerance || !investingGoal || !timeHorizon) {
        return res.status(400).json({ error: "Experience level, risk tolerance, investing goal, and time horizon are required." });
      }

      const profile = await updateUserProfile(session.user.id, {
        experienceLevel,
        riskTolerance,
        investingGoal,
        timeHorizon,
        favoriteSectors: favoriteSectors?.trim() || null,
        favoriteSymbols: favoriteSymbols?.trim() || null,
        preferredStrategies: preferredStrategies?.trim() || null,
        bio: bio?.trim() || null,
        onboardingCompleted: onboardingCompleted ?? true
      });

      return res.status(200).json({
        ok: true,
        profile,
        message: "Your KAIRO profile memory has been updated."
      });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to update your profile."
    });
  }
}
