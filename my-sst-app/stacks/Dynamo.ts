import { StackContext, Table } from "@serverless-stack/resources";

export const GSI="ConnectionIdMap"

export function DynamoTable({ stack }: StackContext) {

    const table =new Table(stack, "Connections", {
        timeToLiveAttribute: "ttl",
        fields: {
            connectionId: "string",
            subscriptionId: "string",
            //ttl added in runtime
        },
        primaryIndex: { partitionKey: "subscriptionId", sortKey: "connectionId" },
        globalIndexes: {
            [GSI] : {
              partitionKey: "connectionId",
              sortKey: "subscriptionId",
              projection: "keys_only",
            },
          },
        stream:"keys_only",
    });

    return table;
}

