import mongoose, { Document, Schema } from 'mongoose';

const PositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  zIndex: { type: Number, required: true },
});

const WidgetSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  position: { type: PositionSchema, required: true },
  minimized: { type: Boolean, default: false },
  maximized: { type: Boolean, default: false },
  fullscreen: { type: Boolean, default: false },
  config: { type: Schema.Types.Mixed, default: {} },
});

const PortalSettingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    layout: { type: [WidgetSchema], default: [] },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

export type PortalSettingDocument = Document & mongoose.InferSchemaType<typeof PortalSettingSchema>;

export const PortalSettingModel = mongoose.model<PortalSettingDocument>('PortalSetting', PortalSettingSchema);
