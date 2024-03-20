import { DATABASE_MODELS } from "../../utils/constant";
import { CategorySchema, CategorySchemaType } from "../schemas/Category";
import { BaseService } from "./base.service";

export class CategoryService extends BaseService<CategorySchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.CATEGORY,
            schema: CategorySchema,
        });
    }
}
