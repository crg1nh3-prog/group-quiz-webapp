# Group Quiz Live

A public interactive group quiz web app.

## What it does
- Host creates a quiz room.
- The app generates a QR code and participant join link.
- Participants scan the QR code and join on their phones.
- The same question appears for all participants.
- Participants select an option.
- Host sees live response counts and percentages for each option.
- Host can reveal the correct answer with a pre-filled explanation.
- Host can move to the next question.

## Run locally
```bash
npm install
npm start
```
Open `http://localhost:3000`.

For phone testing on the same Wi-Fi, run it on a laptop and open using your laptop IP address, for example `http://192.168.1.10:3000`.

## Make it public
Deploy this Node.js app to Azure App Service, Render, Railway, or any server that supports Node.js and WebSockets. After deployment, open the public URL, create a host room, and show the generated QR code.

## Add your own quiz questions
In the host screen, open **Load your own questions JSON** and paste an array like below:

```json
[
  {
    "question": "What does ESD stand for?",
    "options": ["Electrostatic Discharge", "Electronic Software Design", "Electrical Safety Device", "Energy Storage Drive"],
    "answer": 0,
    "explanation": "ESD means Electrostatic Discharge and can damage sensitive electronic components."
  }
]
```

`answer` is zero-based: 0 = option A, 1 = option B, 2 = option C, etc.
