import mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
	chat_id: { type: Number, required: true },
	user_name: { type: String, required: false },
	first_name: { type: String, required: true },
	ban: { type: Boolean, required: true },
	created_date: { type: Date, default: Date.now },
});
