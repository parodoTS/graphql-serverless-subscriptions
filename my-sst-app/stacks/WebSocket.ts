import {StackContext, use, WebSocketApi, Function} from "@serverless-stack/resources";
import { CfnEventSourceMapping, EventSourceMapping, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoTable, GSI } from "./Dynamo";
//import { Api } from "./Api";

export function ApiWS({ stack, app }: StackContext) {
  const table = use(DynamoTable);
  //const ApolloServer = use(Api).getFunction("POST /graphql");

  const apiWS = new WebSocketApi(stack, "Api", {
    accessLog: false,
    routes: {
      $connect: {
        function: {
            timeout: 20,
            permissions: [table],
            environment: { 
                TABLE_NAME: table.tableName,
                GSI_NAME: GSI,
                REGION: app.region
            },
            handler:"functions/connection/connectionLambda.connectionHandler",
          }
        },
      
    },
  });

  apiWS.addRoutes(stack, {
      "$disconnect": apiWS.getFunction("$connect")!,    //not sure if this non-null assertion operator works properly
  });

  const notifyFunction = new Function(stack, "notify", {
    handler: "functions/connection/expiredNotification.notifyHandler",
    environment: {
      API_GATEWAY_ENDPOINT: apiWS.url.replace("wss","https"),//.concat("/@connections"),,
    },
    permissions:[table,apiWS]
  });

  //Currently filters not suppoted in cdk
  const cfnSourceMapping = new CfnEventSourceMapping(stack,'MyCfnEventSourceMapping', {
    functionName: notifyFunction.functionName,
    eventSourceArn: table.cdk.table.tableStreamArn,
    startingPosition: StartingPosition.TRIM_HORIZON,
  })

  cfnSourceMapping.addPropertyOverride('FilterCriteria', {
      Filters: [
        {
          Pattern:
              "{\"userIdentity\":{\"type\":[\"Service\"],\"principalId\":[\"dynamodb.amazonaws.com\"]}}"
        },
      ],
  })

  stack.addOutputs({
    WS_API_URL: apiWS.url,
  });

  return apiWS;

}