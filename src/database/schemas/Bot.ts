import mongoose, { InferSchemaType } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

const UserModel = mongoose.models[DATABASE_MODELS.USER];

export const BotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    token: { type: String, required: true },
    users: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: UserModel,
            },
        ],
        default: [],
        required: false
    },
});

export type BotSchemaType = InferSchemaType<typeof BotSchema>;
