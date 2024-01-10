import mongoose, { InferSchemaType } from "mongoose";

export const UserSchema = new mongoose.Schema({
    chat_id: { type: Number, required: true },
    user_name: { type: String, required: false },
    first_name: { type: String, required: true },
    is_ban: { type: Boolean, default: false, required: false },
    created_date: { type: Date, default: Date.now, required: false },
    is_admin: { type: Boolean, default: false, required: false },
    phone: { type: String, default: '', required: false }
});

export type UserSchemaType = InferSchemaType<typeof UserSchema>;
