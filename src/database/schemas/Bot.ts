import mongoose from "mongoose";

export const BotSchema = new mongoose.Schema({
    name: { type: String, required: true },
});
