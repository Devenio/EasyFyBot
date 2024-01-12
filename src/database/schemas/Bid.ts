import mongoose, { InferSchemaType } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

const AccountModel = mongoose.models[DATABASE_MODELS.ACCOUNT];

export const BidSchema = new mongoose.Schema({
    accounts: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: AccountModel,
            },
        ],
        default: [],
    },
    is_active: { type: Boolean, required: true },
    bid_id: { type: Number, required: true },
    title: { type: String, required: false },
    start_date: { type: Date, required: true },
    expired_date: { type: Date, required: true },
    created_date: { type: Date, default: Date.now, required: false },
});

export type BidSchemaType = InferSchemaType<typeof BidSchema>;
