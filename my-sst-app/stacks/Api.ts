import {
  StackContext,
  use,
  Api as ApiGateway,
} from "@serverless-stack/resources";
import { Database } from "./Database";
import { DynamoTable, GSI } from "./Dynamo";
import{ ApiWS } from "./WebSocket"

export function Api({ stack, app }: StackContext) {
  const db = use(Database);
  const ws = use(ApiWS);
  const table = use(DynamoTable);

  const api = new ApiGateway(stack, "api", {
    defaults: {
      function: {
        permissions: [db,table],
        environment: {
          RDS_SECRET_ARN: db.secretArn,
          RDS_ARN: db.clusterArn,
          RDS_DATABASE: db.defaultDatabaseName,
          API_GATEWAY_ENDPOINT: ws.url.replace("wss","https"),//.concat("/@connections"),
          TABLE_NAME: table.tableName,
          GSI_NAME: GSI,
          REGION: app.region 
        },
      },
    },
    routes: {
      "POST /graphql": {
        type: "pothos",
        function: {
          handler: "functions/graphql/graphql.handleMessage",
        },
        schema: "services/functions/graphql/schema.ts",
        output: "graphql/schema.graphql",
        // commands: [                                                                          //Usefull to generate GraphqlClient
        //   "npx genql --output ./graphql/genql --schema ./graphql/schema.graphql --esm",
        // ],
      },
    },
  });

  ws.addRoutes(stack,{
    "$default":api.getFunction("POST /graphql")!
  })

  stack.addOutputs({
    API_URL: api.url,
  });

  return api;
}
