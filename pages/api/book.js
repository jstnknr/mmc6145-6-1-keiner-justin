// pages/api/book.js
import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../config/session";
import db from "../../db";

export default withIronSessionApiRoute(
  async function handler(req, res) {
    const user = req.session.user;
    // 1. Not logged in → 401
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // 2. Add a favorite
    if (req.method === "POST") {
      try {
        const added = await db.book.add(user.id, req.body);
        // 2a. If add() returns null → session invalid, destroy and 401
        if (!added) {
          await req.session.destroy();
          return res.status(401).end();
        }
        // 2b. Otherwise return the new record
        return res.status(200).json(added);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // 3. Remove a favorite
    if (req.method === "DELETE") {
      try {
        const { id } = req.body;
        const removed = await db.book.remove(user.id, id);
        // 3a. If remove() returns null → session invalid, destroy and 401
        if (!removed) {
          await req.session.destroy();
          return res.status(401).end();
        }
        // 3b. Otherwise just 200 OK
        return res.status(200).end();
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    // 4. Everything else → 404
    return res.status(404).end();
  },
  sessionOptions
);
