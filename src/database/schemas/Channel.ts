import mongoose, { InferSchemaType } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

export const ChannelSchema = new mongoose.Schema({
    channel_id: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    url: { type: String, required: true }
});

export type ChannelSchemaType = InferSchemaType<typeof ChannelSchema>;
