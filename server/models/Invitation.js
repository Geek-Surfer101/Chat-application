import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invitationSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
