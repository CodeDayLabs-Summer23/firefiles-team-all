import { Role } from "@prisma/client";
import { beforeCreatingDoc } from "@util/helpers/s3-helpers";
import prisma from "@util/prisma";
import { sessionOptions } from "@util/session";
import axios from "axios";
import { AES } from "crypto-js";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
export default withIronSessionApiRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = req.session.user;
    if (!user?.email) return res.status(403).json({ error: "You are not logged in." });

    // READ
    if (req.method === "GET") {
      const { role, isPending, userId } = req.query;
      const bucketsOnUser = await prisma.bucketsOnUsers.findMany({
        where: {
          userId: userId as string,
          role: role as Role,
          isPending: isPending === "true",
        },
      });

      const driveIds = bucketsOnUser.map((bucketOnUser) => bucketOnUser.bucketId);
      const drives = await Promise.all(
        driveIds.map(async (id) => await prisma.drive.findFirst({ where: { id: id } })),
      );
      return res.status(200).json(drives);
      // CREATE
    } else if (req.method === "POST") {
      const { data, name, type } = req.body;
      if (!data || !name || !type) return res.status(400).json({ error: "Invalid request." });
      const { success, error } = await beforeCreatingDoc(req, res, req.body);

      if (!success) return res.status(400).json({ error });
      const keys = AES.encrypt(JSON.stringify(data), process.env.CIPHER_KEY).toString();
      const drive = await prisma.drive.create({ data: { keys, name, type } });
      await prisma.bucketsOnUsers.create({
        data: { userId: user.id, bucketId: drive.id, isPending: false, role: Role.CREATOR },
      });
      return res.status(200).json({ driveId: drive.id });
      // TODO: DELETE
    } else if (req.method === "DELETE") {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Drive ID not found." });
      // await prisma.drive.deleteMany({ where: { id, userId: user.id } });

      // Delete all rows in the "BucketsOnUsers" table that contain the specified "id"
      await prisma.bucketsOnUsers.deleteMany({
        where: { bucketId: id },
      });

      // Delete the Drive row from the "Drive" table
      await prisma.drive.deleteMany({
        where: { id: id },
      });

      return res.status(200).json("ok");
      // UPDATE
    } else if (req.method === "PUT") {
      const id = req.query.id as string;
      const data = req.body;

      if (!id || !data) return res.status(400).json({ error: "Data / Drive ID not found." });
      const keys = AES.encrypt(JSON.stringify(data), process.env.CIPHER_KEY).toString();
      await prisma.drive.updateMany({ where: { id }, data: { keys } });
      return res.status(200).json("ok");
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
}, sessionOptions);
