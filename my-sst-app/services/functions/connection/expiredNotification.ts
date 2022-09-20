const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const gatewayClient = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: process.env.API_GATEWAY_ENDPOINT,
});

export async function notifyHandler(event: any): Promise<any> {
    for (const item of event.Records){ 
        const subscription={connectionID: item.dynamodb.Keys.connectionId.S, subscriptionId: item.dynamodb.Keys.subscriptionId.S};
        await gatewayClient.postToConnection({
            ConnectionId: subscription.connectionID,
            Data: `Expired subscription: ${subscription.subscriptionId}`,
        }).promise();
    }

    return
}
