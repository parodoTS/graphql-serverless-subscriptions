export * as Client from "./client";

import { ulid } from "ulid";
import { SQL } from "./sql";

export async function create(title: string, description: string) {
  const [result] = await SQL.DB.insertInto("client")
    .values({ clientID: ulid(), description, title })
    .returningAll()
    .execute();
  return result;
}

export async function update(id: string, title: string, description: string) {
  const [result] = await SQL.DB.updateTable("client")
    .set( {description, title })
    .where("clientID","=",id)
    .returningAll()
    .execute();
  return result;
}

export async function remove(id: string) {
  const [result] = await SQL.DB.deleteFrom("client")
    .where("clientID","=",id)
    .returningAll()
    .execute();
  return result;
}

export async function list() {
  return await SQL.DB.selectFrom("client")
    .selectAll()
    .orderBy("created", "desc")
    .execute();
}
