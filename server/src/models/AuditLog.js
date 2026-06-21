import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
