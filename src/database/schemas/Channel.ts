import mongoose from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

const BotModel = mongoose.model(DATABASE_MODELS.BOT);

export const ChannelSchema = new mongoose.Schema({
    channel_id: { type: String, required: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    url: { type: String, required: true },
    bot_to_lock_ids: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: BotModel,
            },
        ],
        default: [],
    },
});
