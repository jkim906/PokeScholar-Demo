import express, { Router, Response, Request } from "express";
import "dotenv/config";
import { verifyWebhook } from "@clerk/express/webhooks";
import { UserJSON, EmailAddressJSON } from "@clerk/backend";
import { User } from "../../models/User"; // Adjust path if needed

// This is the API route for handling webhooks from Clerk (user created, user deleted, user updated)
const router = Router();

// Triggers when an account is created
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<any> => {
    try {
      console.log("Webhook received - Headers:", {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
        "content-type": req.headers["content-type"],
      });

      const evt = await verifyWebhook(req);
      const eventType = evt.type;

      const user = evt.data as UserJSON;
      const id = user.id;
      const username = user.username;
      const email = user.email_addresses?.[0]?.email_address;

      console.log(
        `Received webhook event: ${eventType}, ID: ${id}, Username: ${username}, Email: ${email}`
      );

      if (id && username && email) {
        const newUser = new User({
          _id: id,
          username: username,
          email: email,
        });

        try {
          await newUser.save();
          console.log(
            `User saved to MongoDB: ${username} (${email}), ID: ${id}`
          );
        } catch (mongoErr) {
          console.error("Error saving user to MongoDB:", mongoErr);
        }
      } else {
        console.warn("Missing user data:", { id, username, email });
      }

      return res.status(200).send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      console.error("Request headers:", req.headers);
      return res.status(400).send("Error verifying webhook");
    }
  }
);

export default router;
