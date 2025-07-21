import { withIronSessionApiRoute } from "iron-session/next";
import sessionOptions from "../../../config/session";
import db from "../../../db";

// this file handles all /api/auth/:action routes
export default withIronSessionApiRoute(
  async function handler(req, res) {
    const { action } = req.query;

    if (req.method === "POST") {
      if (action === "login") {
        return login(req, res);
      }
      if (action === "logout") {
        return logout(req, res);
      }
      if (action === "signup") {
        return signup(req, res);
      }
    }

    // any other method/action
    return res.status(404).end();
  },
  sessionOptions
);

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await db.auth.login(username, password);
    req.session.user = { id: user.id, username: user.username };
    await req.session.save();
    return res.status(200).end();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function logout(req, res) {
  await req.session.destroy();
  return res.status(200).end();
}

async function signup(req, res) {
  const { username, password } = req.body;
  try {
    const user = await db.user.create(username, password);
    req.session.user = { id: user.id, username: user.username };
    await req.session.save();
    return res.redirect("/search");
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
