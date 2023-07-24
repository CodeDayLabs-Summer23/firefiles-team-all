import prisma from "@util/prisma";
import { sessionOptions } from "@util/session";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import { Role } from "@prisma/client";

export default withIronSessionApiRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = req.session.user;
    if (!user?.email) return res.status(403).json({ error: "You are not logged in." });

    // READ => Gets all of the bucketsOnUsers records for the session's user
    if (req.method === "GET") {
      const { bucketId } = req.query;
      const bucketOnUser = await prisma.bucketsOnUsers.findFirst({
        where: {
          userId: user.id,
          bucketId: bucketId as string,
        },
      });
      return res.status(200).json(bucketOnUser.role !== Role.VIEWER);
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
}, sessionOptions);
