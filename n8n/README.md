# n8n Automation Setup for Nexora GLC Stall

This directory contains the ready-to-import n8n workflow that automatically transforms attendee portraits through ChatGPT and sends them back to the live stall TV display.

---

## 🚀 How to Import into n8n in 60 Seconds

1. Open your **n8n dashboard** (e.g. `http://localhost:5678` or your hosted n8n Cloud / VPS).
2. Click **Workflows** → **+ Add Workflow** → Click the three dots `...` in top right → **Import from File**.
3. Select `n8n/nexora-chatgpt-workflow.json` from this repository.
4. Open the **ChatGPT / OpenAI Image Gen** node:
   - Select your OpenAI / ChatGPT OAuth credential.
5. In the **Nexora Webhook Receiver** node:
   - Copy your **Production Webhook URL** (e.g. `http://localhost:5678/webhook/nexora-transform` or `https://your-n8n.com/webhook/nexora-transform`).
6. Activate the workflow (toggle **Active** switch in top right).

---

## 🔗 Connect to the Nexora Operator Dashboard

1. Open the Volunteer Backstage at [`http://localhost:3000/operator`](http://localhost:3000/operator).
2. Paste your n8n webhook URL into the **n8n Webhook URL** field.
3. You can either:
   - Click **"⚡ Dispatch to n8n Automation"** on any photo card, OR
   - Toggle **"Auto-Dispatch"**: every incoming portrait will automatically go to n8n and ChatGPT, and the TV display will automatically transition to the reveal screen when done!
