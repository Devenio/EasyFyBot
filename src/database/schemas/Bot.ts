import mongoose, { InferSchemaType } from "mongoose";

export const BotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    token: { type: String, required: true },
});

export type BotSchemaType = InferSchemaType<typeof BotSchema>;
