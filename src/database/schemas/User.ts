import mongoose, { InferSchemaType } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

const BotModel = mongoose.models[DATABASE_MODELS.BOT];

export const UserSchema = new mongoose.Schema({
    chat_id: { type: Number, required: true },
    user_name: { type: String, required: false },
    first_name: { type: String, required: true },
    is_ban: { type: Boolean, default: false, required: false },
    created_date: { type: Date, default: Date.now, required: false },
    is_super_admin: { type: Boolean, default: false, required: false },
    admin_bot_ids: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: BotModel,
            },
        ],
        default: [],
        required: false,
    }
});

export type UserSchemaType = InferSchemaType<typeof UserSchema>;
