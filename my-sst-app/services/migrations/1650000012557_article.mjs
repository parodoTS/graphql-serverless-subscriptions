import { Kysely } from "kysely";

/**
 * @param db {Kysely<any>}
 */
export async function up(db) {
  await db.schema
    .createTable("client")
    .addColumn("clientID", "text", col => col.primaryKey())
    .addColumn("title", "text", col => col.notNull())
    .addColumn("description", "text", col => col.notNull())
    .addColumn("created", "timestamp", col => col.defaultTo("now()"))
    .execute();

  await db.schema
    .createIndex("idx_client_created")
    .on("client")
    .column("created")
    .execute();
}

/**
 * @param db {Kysely<any>}
 */
export async function down(db) {
  await db.schema.dropIndex("idx_client_created").execute();
  await db.schema.dropTable("client").execute();
}
