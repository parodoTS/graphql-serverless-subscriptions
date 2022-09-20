import { Client } from "@my-sst-app/core/client";
import { SQL } from "@my-sst-app/core/sql";
import { builder } from "../builder";

const ClientType = builder.objectRef<SQL.Row["client"]>("Client").implement({
  fields: (t) => ({
    id: t.exposeID("clientID"),
    title: t.exposeID("title"),
    description: t.exposeID("description"),
  }),
});

builder.queryFields((t) => ({
  clients: t.field({
    type: [ClientType],
    resolve: () => Client.list(),
  }),
}));

builder.mutationFields((t) => ({
  createClient: t.field({
    type: ClientType,
    args: {
      title: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
    },
    resolve: (_, args) => Client.create(args.title, args.description),
  }),
  updateClient: t.field({
    type: ClientType,
    args: {
      id: t.arg.string({ required: true}),
      title: t.arg.string({ required: true }),
      description: t.arg.string({ required: true }),
    },
    resolve: (_, args) => Client.update(args.id, args.title, args.description),
  }),
  deleteClient: t.field({
    type: ClientType,
    args: {
      id: t.arg.string({ required: true}),
    },
    resolve: (_, args) => Client.remove(args.id),
  }),
}));

//MAYBE:
/* builder.subscriptionFields((t) => ({
  changes: t.field({
    type: ClientType,
    subscribe: (createClient),
    resolve: () => //check dynamo and response over WS API GW,
  }),
})); */
