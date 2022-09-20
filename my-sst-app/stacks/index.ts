import { App } from "@serverless-stack/resources";
import { Api } from "./Api";
import { Database } from "./Database";
import { DynamoTable } from "./Dynamo";
import { ApiWS } from "./WebSocket";
//import { Web } from "./Web";

export default function main(app: App) {
  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    srcPath: "services",
  });
  app.stack(Database).stack(DynamoTable).stack(ApiWS).stack(Api);//.stack(Web);
}
