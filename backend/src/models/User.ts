import { Schema, model, type Document } from 'mongoose';

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
}

export const UserModel = model<UserDocument>('User', UserSchema);

