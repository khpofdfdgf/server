import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/...";

app.post("/github", async (req, res) => {
  const payload = req.body;

  const commit = payload.head_commit;
  const repo = payload.repository;

  const data = {
    username: "GitHub Bot",
    embeds: [
      {
        title: `New commit in ${repo.full_name}`,
        url: commit.url,
        description: commit.message,
        color: 3066993,
        fields: [
          { name: "Author", value: commit.author.name, inline: true },
          { name: "Branch", value: payload.ref.replace("refs/heads/", ""), inline: true }
        ],
        timestamp: commit.timestamp
      }
    ]
  };

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Listening on port 3000"));
