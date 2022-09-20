import { schema } from "./schema";
import { createGQLHandler } from "@serverless-stack/node/graphql";

import { generateLambdaProxyResponse, generateApolloCompatibleEventFromWebsocketEvent } from '../connection/utils';
import { GraphQLSchema } from "graphql";

const { parse, validate } = require('graphql');

import { mergeSchemas } from "@graphql-tools/schema"

const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const gatewayClient = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: process.env.API_GATEWAY_ENDPOINT,
});

const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: process.env.REGION,
});

//Add the Subscription with String as response for simplicity
const mergedSchema: GraphQLSchema = mergeSchemas({
  schemas: [schema],
  typeDefs: /* GraphQL */ `
    type Subscription {
      creation: String
      changes: String
      deletions: String
    }
  `,
});

const mutationAndQueryHandler = createGQLHandler({
   schema: mergedSchema
});

export async function handleMessage(event: any,context: any, callback: any): Promise<any> {
  console.log("EVENT:"+JSON.stringify(event));
  console.log("CONTEXT:"+JSON.stringify(context));
  console.log("CALLBACK:"+JSON.stringify(callback));
  const operation = JSON.parse(event.body.replace(/\n/g, ''));      
  const graphqlDocument = parse(operation.query);                     // this can launch an ERROR (in WS: Internal Server Error, to improve verbose catch the error) 
  const validationErrors = validate(mergedSchema, graphqlDocument);
  const isWsConnection: boolean = !event.rawPath;                     // "rawPath" not in WS API
  
  console.log("ERRORS:"+JSON.stringify(validationErrors));
  console.log("is WS?:"+isWsConnection);

  if (validationErrors.length > 0) {
    if (isWsConnection) {
      await gatewayClient.postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: JSON.stringify(validationErrors),
      }).promise();
    }

    return generateLambdaProxyResponse(400, JSON.stringify(validationErrors));
  }

  if (graphqlDocument.definitions[0].operation === 'subscription') {
    if (!isWsConnection) {
      return generateLambdaProxyResponse(400, 'Subscription not support via REST');
    }
    const { connectionId } = event.requestContext;
    const subscriptionId: string = graphqlDocument.definitions[0].selectionSet.selections[0].name.value;

    const oneHourFromNow = Math.round(Date.now() / 1000 + 120);//3600);
    await dynamoDbClient.put({
      TableName: process.env.TABLE_NAME!,
      Item: {
        subscriptionId,
        connectionId,
        ttl: oneHourFromNow,
      },
    }).promise();

    return generateLambdaProxyResponse(200, 'Ok');
  }

  let response:any;

  // To allow Queries/Mutations over WS:
  if (isWsConnection) {
    response = await mutationAndQueryHandler(generateApolloCompatibleEventFromWebsocketEvent(event),context,callback);
    await gatewayClient.postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: response.body,
    }).promise();
  }else {
    response = await mutationAndQueryHandler(event,context,callback);
  }

  if ( graphqlDocument.definitions[0].operation === 'mutation' && response.statusCode === 200){   
    let connections:any;

    // Because we use different names for subscriptions and mutations (if not we can just: connections = await getConnectionsSubscribedToTopic(graphqlDocument.definitions[0].selectionSet.selections[0].name.value);):
    if (graphqlDocument.definitions[0].selectionSet.selections[0].name.value=="createClient"){
      connections = await getConnectionsSubscribedToTopic("creations");
    }else if(graphqlDocument.definitions[0].selectionSet.selections[0].name.value=="updateClient"){
      connections = await getConnectionsSubscribedToTopic("changes");
    }else{
      connections = await getConnectionsSubscribedToTopic("deletions");
    }
      
    const postToConnectionPromises = connections?.map((c: any) => gatewayClient.postToConnection({
      ConnectionId: c.connectionId,
      Data: JSON.stringify({ data: response.body }), 
    }).promise());
    await Promise.allSettled(postToConnectionPromises!);
  }
  
  return response;
}

async function getConnectionsSubscribedToTopic(subscriptionId: string): Promise<any> {
  const { Items: connectionId } = await dynamoDbClient.query({
    TableName: process.env.TABLE_NAME!,
    KeyConditionExpression: 'subscriptionId = :subscriptionId',
    ExpressionAttributeValues: {
      ':subscriptionId': subscriptionId,
    },
  }).promise();

  return connectionId;
}