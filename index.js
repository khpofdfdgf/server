import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = "https://discordapp.com/api/webhooks/1406862442369253386/y5HCNp40yFGPhsDK85JC4JYB4p8KHTaaqPLp8vcOaPVPxr5qLM-7l3OjzGiKz2FJcxqe";



app.post("/github", async (req, res) => {
  try {
    const payload = req.body;

    // Lấy commit mới nhất
    const commit = payload.head_commit;

    if (!commit) {
      return res.status(400).send("No commit data");
    }

    // Format data
    const repoName = payload.repository.name;
    const repoUrl = payload.repository.html_url;
    const branch = payload.ref.replace("refs/heads/", "");
    const message = commit.message;
    const author = commit.author.name;
    const commitUrl = commit.url;
    const timestamp = commit.timestamp;
    const commitId = commit.id.substring(0, 7);

    // File stats
    const added = commit.added.length;
    const removed = commit.removed.length;
    const modified = commit.modified.length;

    // Discord embed
    const embed = {
      title: `📦 ${repoName}`,
      url: repoUrl,
      color: 0x7289da,
      fields: [
        { name: "🌿 Branch", value: branch, inline: true },
        { name: "🆔 Commit", value: commitId, inline: true },
        { name: "✍️ Author", value: author, inline: true },
        { name: "📝 Message", value: message },
        { name: "🔗 Link", value: `[View Commit](${commitUrl})` },
        { name: "📊 Changes", value: `+${added} / ~${modified} / -${removed}` },
        { name: "⏰ Time", value: timestamp }
      ]
    };

    // Gửi sang Discord
    await axios.post(DISCORD_WEBHOOK, { embeds: [embed] });

    res.status(200).send("OK");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error");
  }
});


app.post("/webhook", (req, res) => {
  const event = req.headers["x-github-event"]; // GitHub gửi event type trong header
  const payload = req.body;

  let msg = "";

  switch (event) {
    case "push": {
      const commit = payload.head_commit;
      msg = `
📌 **Push Event**
Repo: ${payload.repository.full_name}
Branch: ${payload.ref.replace("refs/heads/", "")}
Commit: ${commit.id.substring(0, 7)}
Message: ${commit.message}
Author: ${commit.author.name}
URL: ${commit.url}
Timestamp: ${commit.timestamp}
Files changed: +${commit.added.length}, ~${commit.modified.length}, -${commit.removed.length}
      `;
      break;
    }

    case "member": {
      const action = payload.action;
      const member = payload.member.login;
      if (action === "added") {
        msg = `✅ **Thêm thành viên**: ${member} đã được thêm vào repo ${payload.repository.full_name}`;
      } else if (action === "removed") {
        msg = `❌ **Xóa thành viên**: ${member} đã bị xóa khỏi repo ${payload.repository.full_name}`;
      }
      break;
    }

    case "create": {
      if (payload.ref_type === "branch") {
        msg = `🌱 **Tạo branch mới**: ${payload.ref} trong repo ${payload.repository.full_name}`;
      }
      break;
    }

    default:
      msg = `🤷‍♂️ Chưa xử lý event: ${event}`;
  }

  console.log(msg); // log ra console
  res.status(200).send("OK");
});

app.listen(3000, () => console.log("Listening on port 3000"));
