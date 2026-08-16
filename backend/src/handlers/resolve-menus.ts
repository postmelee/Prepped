import { createLambdaHandlers } from "../lambda.ts";

const handlers = createLambdaHandlers();

export const handler = handlers.resolveMenus;
