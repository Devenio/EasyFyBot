import { Types } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";
import { BidOrderSchema, BidOrderSchemaType } from "../schemas/BidOrder";
import { BaseService } from "./base.service";
import { AccountSchema, AccountSchemaType } from "../schemas/Account";

export class AccountService extends BaseService<AccountSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.ACCOUNT,
            schema: AccountSchema,
        });
    }

    async findHighestBidPrice(accountId: Types.ObjectId) {
        try {
            const account = await this.collection
                .findOne({ _id: accountId })
                .populate({
                    path: "bid_orders",
                    model: DATABASE_MODELS.BID_ORDER,
                    options: { sort: { bid_price: -1 }, limit: 1 },
                });

                console.log(account);

            if (!account) {
                throw new Error("Account not found");
            }

            const highestBidOrder = account.bid_orders[0];
            const highestBidPrice = highestBidOrder
                ? // @ts-ignore
                  highestBidOrder.bid_price
                : null;

            return highestBidPrice;
        } catch (error) {
            console.error("Error finding highest bid price:", error);
            throw error;
        }
    }
}
