// TODO try wa-sqlite

import initSqlJs, { Database } from "sql.js";
import sqlJsWorkletURL from "sql.js/dist/sql-wasm.wasm?url";
import { Edge } from "./edge";
import { Node } from "./node";

const SQL = await initSqlJs({
  locateFile: () => sqlJsWorkletURL,
});

export async function openDB(fileHandle: FileSystemFileHandle) {
  const file = await fileHandle.getFile();
  const data = new Uint8Array(await file.arrayBuffer());
  return new SQL.Database(data);
}

export function initializeDB(db: Database) {
  createNodesTable(db);
  createEdgesTable(db);
}

function createNodesTable(db: Database) {
  const TABLE_NAME = "nodes";
  const query = /* sql */ `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT,
      \`type\` TEXT,
      source TEXT,
      \`size\` INTEGER 
    )`;
  db.exec(query);
}

function createEdgesTable(db: Database) {
  const TABLE_NAME = "edges";
  const query = /* sql */ `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      \`from\` INTEGER NOT NULL,
      \`to\` INTEGER NOT NULL,
      label TEXT,
      FOREIGN KEY (\`from\`) REFERENCES nodes(id),
      FOREIGN KEY (\`to\`) REFERENCES nodes(id)
    )`;
  db.exec(query);
}

export function insertNode(db: Database, node: Node) {
  const TABLE_NAME = "nodes";
  const query = /* sql */ `INSERT INTO ${TABLE_NAME} (${Object.keys(node)
    .map((d) => "`" + d + "`")
    .join(", ")}) VALUES (${Object.keys(node)
    .map(() => "?")
    .join(",")})`;
  db.exec(query, Object.values(node));
}

export function insertEdge(db: Database, edge: Edge) {
  const TABLE_NAME = "edges";
  const query = /* sql */ `INSERT INTO ${TABLE_NAME} (${Object.keys(edge)
    .map((d) => "`" + d + "`")
    .join(", ")}) VALUES (${Object.keys(edge)
    .map(() => "?")
    .join(", ")})`;
  db.exec(query, Object.values(edge));
}

export function queryNodes(db: Database) {
  const TABLE_NAME = "nodes";
  const query = /* sql */ `SELECT * FROM ${TABLE_NAME}`;
  const statement = db.prepare(query);
  const result = [];
  while (statement.step()) result.push(statement.getAsObject());
  return result;
}

export function queryEdges(db: Database) {
  const TABLE_NAME = "edges";
  const query = /* sql */ `SELECT * FROM ${TABLE_NAME}`;
  const statement = db.prepare(query);
  const result = [];
  while (statement.step()) result.push(statement.getAsObject());
  return result;
}

export async function saveDB(db: Database, fileHandle: FileSystemFileHandle) {
  const writable = await fileHandle.createWritable();
  const data = db.export();
  await writable.write(data);
  await writable.close();
}
