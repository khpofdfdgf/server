import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

app.post("/github", async (req, res) => {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    let embed = null;

    switch (event) {

      // =========================
      // PUSH EVENT
      // =========================
      case "push": {
        const commit = payload.head_commit;

        if (!commit) {
          return res.status(400).send("No commit data");
        }

        const branch = payload.ref.replace("refs/heads/", "");

        embed = {
          title: `📦 ${payload.repository.full_name}`,
          url: payload.repository.html_url,
          color: 0x7289da,

          fields: [
            {
              name: "🌿 Branch",
              value: branch,
              inline: true
            },
            {
              name: "🆔 Commit",
              value: commit.id.substring(0, 7),
              inline: true
            },
            {
              name: "✍️ Author",
              value: commit.author.name,
              inline: true
            },
            {
              name: "📝 Message",
              value: commit.message
            },
            {
              name: "📊 Changes",
              value:
                `+${commit.added.length} ` +
                `~${commit.modified.length} ` +
                `-${commit.removed.length}`
            },
            {
              name: "🔗 Commit",
              value: `[View Commit](${commit.url})`
            }
          ],

          timestamp: commit.timestamp
        };

        break;
      }

      // =========================
      // MEMBER EVENT
      // =========================
      case "member": {
        embed = {
          title: "👥 Repository Member Update",
          color: payload.action === "added"
            ? 0x57f287
            : 0xed4245,

          description:
            payload.action === "added"
              ? `✅ **${payload.member.login}** joined repository`
              : `❌ **${payload.member.login}** removed from repository`,

          fields: [
            {
              name: "📦 Repository",
              value: payload.repository.full_name
            }
          ]
        };

        break;
      }

      // =========================
      // CREATE EVENT
      // =========================
      case "create": {

        if (payload.ref_type !== "branch") {
          return res.status(200).send("Ignored");
        }

        embed = {
          title: "🌱 New Branch Created",
          color: 0xf1c40f,

          fields: [
            {
              name: "📦 Repository",
              value: payload.repository.full_name
            },
            {
              name: "🌿 Branch",
              value: payload.ref
            }
          ]
        };

        break;
      }

      // =========================
      // DEFAULT
      // =========================
      default: {
        return res.status(200).send("Unhandled event");
      }
    }

    // Send Discord webhook
    await axios.post(DISCORD_WEBHOOK, {
      embeds: [embed]
    });

    console.log(`[${event}] sent to Discord`);

    res.status(200).send("OK");

  } catch (err) {

    console.error("Webhook Error:", err.message);

    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
