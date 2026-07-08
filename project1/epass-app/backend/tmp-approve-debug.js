const mongoose = require('mongoose');
require('dotenv').config();
const { approveHod, approveDirector } = require('./controllers/adminController');
const PendingRegistration = require('./models/PendingRegistration');
const User = require('./models/User');

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/epass_db';
  await mongoose.connect(uri);
  console.log('connected to', uri);

  const pendingHod = await PendingRegistration.findOne({ role: 'HOD' }).lean();
  console.log('pending HOD:', pendingHod);

  if (pendingHod) {
    const req = { params: { id: pendingHod._id.toString() }, user: { _id: new mongoose.Types.ObjectId(), role: 'ADMIN', campus: 'BIST' } };
    const res = {
      _code: 200,
      status(code) { this._code = code; return this; },
      json(obj) { console.log('approveHod response', this._code, JSON.stringify(obj, null, 2)); }
    };
    try {
      await approveHod(req, res);
    } catch (err) {
      console.error('approveHod exception', err);
    }
  }

  const pendingDirector = await PendingRegistration.findOne({ role: 'DIRECTOR' }).lean();
  console.log('pending Director:', pendingDirector);

  if (pendingDirector) {
    const req = { params: { id: pendingDirector._id.toString() }, user: { _id: new mongoose.Types.ObjectId(), role: 'ADMIN', campus: 'BIST' } };
    const res = {
      _code: 200,
      status(code) { this._code = code; return this; },
      json(obj) { console.log('approveDirector response', this._code, JSON.stringify(obj, null, 2)); }
    };
    try {
      await approveDirector(req, res);
    } catch (err) {
      console.error('approveDirector exception', err);
    }
  }

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error('run error', err);
  process.exit(1);
});