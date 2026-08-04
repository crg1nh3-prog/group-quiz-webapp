const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.get('/health', (_, res) => res.send('OK'));

const defaultQuestions = [
  {
    question: 'What does ESD stand for in electronics manufacturing?',
    options: ['Electrostatic Discharge', 'Electronic Software Design', 'Electrical Safety Device', 'Energy Storage Drive'],
    answer: 0,
    explanation: 'ESD means Electrostatic Discharge. It can damage sensitive electronic components if not controlled using wrist straps, ESD flooring, ionizers, and proper handling practices.'
  },
  {
    question: 'Which action is best before handling an electronic PCB?',
    options: ['Touch the PCB directly', 'Wear an ESD wrist strap and verify grounding', 'Keep the PCB on normal plastic cover', 'Use cotton gloves only'],
    answer: 1,
    explanation: 'The safest practice is to wear a verified ESD wrist strap and ensure proper grounding before handling sensitive electronic assemblies.'
  },
  {
    question: 'What is the purpose of Daily Layered Review in manufacturing?',
    options: ['Only attendance tracking', 'Structured review of SQCD topics at different leadership layers', 'Replacing quality audits', 'Only machine cleaning'],
    answer: 1,
    explanation: 'Daily Layered Review supports structured escalation and review of Safety, Quality, Cost, and Delivery topics across levels.'
  },
{
    question: 'What does OEE stand for?',
    options: ['Overall Equipment Effectiveness', 'Operational Engineering Efficiency', 'Overall Employee Evaluation', 'Output Efficiency Estimation'],
    answer: 0,
    explanation: 'OEE measures manufacturing productivity by considering Availability, Performance, and Quality.'
},

{
    question: 'What comes once in a minute, twice in a moment, but never in a thousand years?',
    options: ['Letter A', 'Letter M', 'Letter E', 'Number 1'],
    answer: 1,
    explanation: 'The letter M appears once in "minute", twice in "moment", and not at all in "thousand years".'
},

{
    question: 'If a rooster lays an egg on a rooftop, which side does it roll down?',
    options: ['Left', 'Right', 'North', 'None'],
    answer: 3,
    explanation: 'Roosters do not lay eggs.'
},
{
    question: 'Which country originated the 5S workplace organization methodology?',
    options: ['Germany', 'Japan', 'United States', 'India'],
    answer: 1,
    explanation: '5S originated in Japan as part of the Toyota Production System. The five principles are Sort, Set in Order, Shine, Standardize, and Sustain.'
},
  {
question: 'What is the largest ocean on Earth?',
options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
answer: 2,
explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.'
},

{
    question: 'Which country is widely recognized as the birthplace of Lean Manufacturing?',
    options: ['China', 'Japan', 'Germany', 'Sweden'],
    answer: 1,
    explanation: 'Lean Manufacturing evolved from the Toyota Production System developed in Japan.'
},
{
question: 'The more you take away from me, the bigger I become. What am I?',
options: ['Mountain', 'Hole', 'River', 'Cloud'],
answer: 1,
explanation: 'The more you dig from a hole, the larger it becomes.'
},
{
    question: 'Which country invented the modern assembly line concept used in mass production?',
    options: ['Germany', 'Japan', 'USA', 'Italy'],
    answer: 2,
    explanation: 'Henry Ford popularized the moving assembly line in the United States, revolutionizing manufacturing.'
},
{
question: 'How many animals of each species did Moses take onto the Ark?',
options: ['2', '4', '6', 'None'],
answer: 3,
explanation: 'Moses did not take animals onto the Ark. Noah did.'
},
{
    question: 'Which country has the highest number of time zones?',
    options: ['Russia', 'USA', 'France', 'China'],
    answer: 2,
    explanation: 'Due to its overseas territories, France spans 12 official time zones.'
},
  
{
    question: 'What was the first product manufactured by Bosch?',
    options: ['Spark Plug', 'Low-voltage Magneto', 'Headlamp', 'Starter Motor'],
    answer: 1,
    explanation: 'Robert Bosch founded his workshop in 1886 and became successful with the low-voltage magneto for gas engines.'
},

{
question: 'Before Mount Everest was discovered, what was the highest mountain in the world?',
options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Makalu'],
answer: 2,
explanation: 'Mount Everest was still the highest mountain even before it was discovered.'
},
{
    question: 'What does a barcode primarily provide?',
    options: ['Decoration', 'Traceability', 'Security Camera Feed', 'Machine Speed'],
    answer: 1,
    explanation: 'Barcodes allow products and materials to be tracked throughout the manufacturing process.'
},

{
    question: 'Which famous scientist worked as a patent examiner before becoming world-famous?',
    options: ['Newton', 'Einstein', 'Tesla', 'Galileo'],
    answer: 1,
    explanation: 'Albert Einstein worked at the Swiss Patent Office before publishing his groundbreaking theories.'
},

  {
question: 'Which word becomes shorter when you add two letters to it?',
options: ['Long', 'Tall', 'Short', 'Small'],
answer: 2,
explanation: 'Adding "er" to "short" makes the word "shorter".'
},
{
question: 'How many birthdays does the average person have?',
options: ['One per year', '10', '50', 'One'],
answer: 3,
explanation: 'A person is only born once, so they have one birthday.'
},

 {
question: 'Which English word contains all five vowels in alphabetical order?',
options: ['Facetious', 'Beautiful', 'Question', 'Education'],
answer: 0,
explanation: 'Facetious contains all five vowels (a, e, i, o, u) in alphabetical order.'
},
  {
question: 'A plane crashes on the border between India and Nepal. Where do you bury the survivors?',
options: ['India', 'Nepal', 'Both Countries', 'Nowhere'],
answer: 3,
explanation: 'You do not bury survivors. They survived.'
},
];

const rooms = new Map();

function newRoom(hostSocketId) {
  const roomId = nanoid(6).toUpperCase();
  rooms.set(roomId, {
    roomId,
    hostSocketId,
    questions: structuredClone(defaultQuestions),
    currentIndex: 0,
    started: false,
    revealed: false,
    participants: {},
    responses: {}
  });
  return rooms.get(roomId);
}

function roomSummary(room) {
  const q = room.questions[room.currentIndex];
  const counts = q.options.map((_, i) => Object.values(room.responses).filter(v => v === i).length);
  return {
    roomId: room.roomId,
    currentIndex: room.currentIndex,
    totalQuestions: room.questions.length,
    started: room.started,
    revealed: room.revealed,
    question: q,
    responses: room.responses,
    counts,
    participants: Object.values(room.participants)
  };
}

async function qrForRoom(req, roomId) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const joinUrl = `${baseUrl}/?room=${roomId}&role=player`;
  const dataUrl = await QRCode.toDataURL(joinUrl, { margin: 1, width: 320 });
  return { joinUrl, dataUrl };
}

app.get('/api/room/:roomId/qr', async (req, res) => {
  try {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const qr = await qrForRoom(req, req.params.roomId);
    res.json(qr);
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

io.on('connection', socket => {
  socket.on('host:create', async (_, cb) => {
    const room = newRoom(socket.id);
    socket.join(room.roomId);
    cb?.({ ok: true, summary: roomSummary(room) });
    io.to(room.roomId).emit('room:update', roomSummary(room));
  });

  socket.on('host:loadQuestions', ({ roomId, questions }, cb) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return cb?.({ ok: false, error: 'Host room not found' });
    if (!Array.isArray(questions) || !questions.length) return cb?.({ ok: false, error: 'Question list is empty' });
    room.questions = questions.map(q => ({
      question: String(q.question || '').trim(),
      options: (q.options || []).map(String),
      answer: Number(q.answer),
      explanation: String(q.explanation || '').trim()
    })).filter(q => q.question && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length);
    room.currentIndex = 0;
    room.started = false;
    room.revealed = false;
    room.responses = {};
    cb?.({ ok: true, summary: roomSummary(room) });
    io.to(roomId).emit('room:update', roomSummary(room));
  });

  socket.on('player:join', ({ roomId, name }, cb) => {
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room) return cb?.({ ok: false, error: 'Quiz room not found. Please check QR/code.' });
    socket.join(room.roomId);
    room.participants[socket.id] = { id: socket.id, name: String(name || 'Guest').slice(0, 30) };
    cb?.({ ok: true, participantId: socket.id, summary: roomSummary(room) });
    io.to(room.roomId).emit('room:update', roomSummary(room));
  });

  socket.on('player:answer', ({ roomId, optionIndex }, cb) => {
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room || !room.started || room.revealed) return cb?.({ ok: false });
    if (!room.participants[socket.id]) room.participants[socket.id] = { id: socket.id, name: 'Guest' };
    room.responses[socket.id] = Number(optionIndex);
    cb?.({ ok: true });
    io.to(room.roomId).emit('room:update', roomSummary(room));
  });

  socket.on('host:start', ({ roomId }, cb) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return cb?.({ ok: false });
    room.started = true;
    room.revealed = false;
    room.responses = {};
    cb?.({ ok: true });
    io.to(roomId).emit('room:update', roomSummary(room));
  });

  socket.on('host:reveal', ({ roomId }, cb) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return cb?.({ ok: false });
    room.revealed = true;
    cb?.({ ok: true });
    io.to(roomId).emit('room:update', roomSummary(room));
  });

  socket.on('host:next', ({ roomId }, cb) => {
    const room = rooms.get(roomId);
    if (!room || room.hostSocketId !== socket.id) return cb?.({ ok: false });
    if (room.currentIndex < room.questions.length - 1) room.currentIndex += 1;
    room.started = true;
    room.revealed = false;
    room.responses = {};
    cb?.({ ok: true });
    io.to(roomId).emit('room:update', roomSummary(room));
  });

  socket.on('disconnect', () => {
    for (const room of rooms.values()) {
      if (room.participants[socket.id]) {
        delete room.participants[socket.id];
        delete room.responses[socket.id];
        io.to(room.roomId).emit('room:update', roomSummary(room));
      }
      if (room.hostSocketId === socket.id) {
        room.hostSocketId = null;
      }
    }
  });
});

server.listen(PORT, () => console.log(`Quiz app running on port ${PORT}`));
