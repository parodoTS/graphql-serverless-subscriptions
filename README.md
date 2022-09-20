# graphql-serverless

Implementation of a Graphql **SERVERLESS** service in AWS using:

 - [sst](https://docs.sst.dev/) (serverless stack framework):
	 - [graphql helix](https://www.graphql-helix.com/) (JS Graphql server)
	 - [pothos](https://pothos-graphql.dev/) (GraphQL schema builder for typescript)
	 - [kysely](https://github.com/koskimas/kysely) (typescript SQL query builder)
 - [AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) (interaction with DynamoDB and API GW)

Based on:
 - standard starter template (by SST)
 - [apollo-server-on-aws-lambda](https://aws.amazon.com/es/blogs/opensource/using-apollo-server-on-aws-lambda-with-amazon-eventbridge-for-real-time-event-driven-streaming/) (by AWS Open Source Blog)

It supports:
| |QUERY  |MUTATION|SUBSCRIPTION|
|--|--|--|--|
|REST  | X |X|
|WS	|X|X|X

We use a Lambda function to handle the subscriber *connections* and *disconnections*, and a DynamoDB table to store information about these subscriptions.

When a mutation occurs, the server checks its subscribers and sends a message to them.

## DIAGRAM:

![serverlessProjectNode3 (1)](https://user-images.githubusercontent.com/100789868/180795662-a298f8a7-da07-4de6-b151-f3e751c3718f.jpg)


Network (for the RDS serverless cluster), Security and Monitoring resources are not included in the diagram above.
