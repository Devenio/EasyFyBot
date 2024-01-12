import { Types } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";
import { BidOrderSchema, BidOrderSchemaType } from "../schemas/BidOrder";
import { BaseService } from "./base.service";
import { AccountService } from "./account.service";

export class BidOrderService extends BaseService<BidOrderSchemaType> {
    private accountService = new AccountService();

    constructor() {
        super({
            modelName: DATABASE_MODELS.BID_ORDER,
            schema: BidOrderSchema,
        });
    }

    async findAccountBidOrder(chatId: number, accountId: string) {
        const res = await this.collection.findOne({
            user_chat_id: chatId,
            account_id: accountId,
        });
        return res;
    }

    async updateOrder(bidOrderId: Types.ObjectId, bidPrice: number) {
        const res = this.findOneAndUpdate(
            { _id: bidOrderId },
            { bid_price: bidPrice, updated_date: new Date() }
        );

        return res;
    }

    async addNewOrder(chatId: number, accountId: string, bidPrice: number) {
        const newBidOrder: BidOrderSchemaType = {
            user_chat_id: chatId,
            account_id: new Types.ObjectId(accountId),
            bid_price: bidPrice,
            is_valid: true,
            created_date: new Date(),
        };

        const createdBidOrder = await this.create(newBidOrder);

        if (!createdBidOrder) return;

        await this.accountService.findOneAndUpdate(
            { _id: accountId },
            { $push: { bid_orders: createdBidOrder._id } }
        );
    }
}
