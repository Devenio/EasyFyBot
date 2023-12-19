import mongoose from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

const BotModel = mongoose.model(DATABASE_MODELS.BOT);

export const UserSchema = new mongoose.Schema({
    chat_id: { type: Number, required: true },
    user_name: { type: String, required: false },
    first_name: { type: String, required: true },
    ban: { type: Boolean, required: true },
    created_date: { type: Date, default: Date.now },
    is_super_admin: { type: Boolean, default: false },
    admin_bot_ids: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: BotModel,
            },
        ],
        default: [],
    },
});
