import { useComputed, useSignal, useSignalEffect } from "@preact/signals";
import { getDirectoryHandle } from "./utils/file-access";
import {
  saveDB,
  initializeDB,
  insertEdge,
  insertNode,
  openDB,
  queryNodes,
  queryEdges,
} from "./utils/db";
import { Database } from "sql.js";
import { drawGraph, focusToNode } from "./utils/graph";
import { Node } from "./utils/node";
import { Edge } from "./utils/edge";
import { getBlob, setBlob } from "./utils/blob";

import "./app.css";
import viteLogo from "./assets/vite.svg?raw";
import preactLogo from "./assets/preact.svg?raw";

export function App() {
  const rootDirectoryHandle = useSignal<FileSystemDirectoryHandle>();
  const blobDirectoryHandle = useSignal<FileSystemDirectoryHandle>();
  const dbFileHandle = useSignal<FileSystemFileHandle>();
  const db = useSignal<Database>();
  const nodes = useSignal<Node[]>([]);
  const edges = useSignal<Edge[]>([]);
  const container = useSignal<HTMLDivElement | null>();
  const selectedNodeId = useSignal<number>();
  const selectedNode = useComputed(() =>
    nodes.value.find((n) => n.id === selectedNodeId.value)
  );
  const coneections = useComputed(() =>
    edges.value
      .filter((e) => e.from === selectedNodeId.value)
      .map((e) => ({
        id: e.to,
        label: nodes.value.find((n) => n.id === e.to)?.label,
        relationship: e.label,
      }))
  );
  const coneectionsReversed = useComputed(() =>
    edges.value
      .filter((e) => e.to === selectedNodeId.value)
      .map((e) => ({
        id: e.from,
        label: nodes.value.find((n) => n.id === e.from)?.label,
        relationship: e.label,
      }))
  );
  const contentUrl = useSignal<string>("");

  useSignalEffect(() => {
    showNodeContent(selectedNodeId.value);
  });

  return (
    <div
      className="main-container container neumo"
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 3fr",
        gridTemplateRows: "2fr 1fr",
      }}
    >
      <div
        className="graph-container container neumo hollow"
        ref={(el) => (container.value = el)}
        style={{ gridColumn: "1 / span 1" }}
      ></div>
      <div
        className="content-container container neumo hollow"
        style={{ gridRow: "1 / span 2", gridColumn: "2 / span 1" }}
      >
        {contentUrl.value ? (
          <iframe src={contentUrl}></iframe>
        ) : selectedNode.value && !selectedNode.value.source ? (
          <p style={{ margin: "var(--space-lg)" }}>No content for the node</p>
        ) : (
          <p style={{ margin: "var(--space-lg)" }}>
            Click a node to see the content
          </p>
        )}
      </div>
      <div className="extras container neumo hollow">
        {!rootDirectoryHandle.value && (
          <button class="neumo" onClick={openNodebook}>
            Open Nodebook
          </button>
        )}
        {db.value && nodes.value.length <= 0 && (
          <button class="neumo" onClick={insertMock}>
            Insert Mock
          </button>
        )}
        <div style={{ fontSize: "2em" }}>{selectedNode.value?.label}</div>
        {selectedNode.value && (
          <div>
            <h3>Link To</h3>
            {coneections.value.map((c) => (
              <button
                class="neumo"
                onClick={() => {
                  focusToNode(c.id);
                  selectedNodeId.value = c.id;
                }}
              >
                {c.relationship ? ` (${c.relationship}) ` : ""}
                {c.label}
              </button>
            ))}
          </div>
        )}
        {selectedNode.value && (
          <div>
            <h3>Link From</h3>
            {coneectionsReversed.value.map((c) => (
              <button
                onClick={() => {
                  focusToNode(c.id);
                  selectedNodeId.value = c.id;
                }}
              >
                {c.relationship ? `(${c.relationship}) ` : ""}
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  async function openNodebook() {
    rootDirectoryHandle.value = await getDirectoryHandle();

    if (!rootDirectoryHandle.value) return;
    dbFileHandle.value = await rootDirectoryHandle.value.getFileHandle(
      "db.sqlite",
      {
        create: true,
      }
    );
    blobDirectoryHandle.value =
      await rootDirectoryHandle.value.getDirectoryHandle("blob", {
        create: true,
      });

    db.value = await openDB(dbFileHandle.value);
    initializeDB(db.value);

    setTimeout(() => {
      queryDB();
    });
  }

  async function insertMock() {
    if (!blobDirectoryHandle.value) return;
    await setBlob(
      blobDirectoryHandle.value,
      "2.svg",
      new Blob([viteLogo], { type: "image/svg" })
    );
    await setBlob(
      blobDirectoryHandle.value,
      "4.svg",
      new Blob([preactLogo], { type: "image/svg" })
    );

    if (!db.value) return;
    const nodes = [
      {
        id: 1,
        label: "Vite",
        size: 25,
        source: "https://vite.dev/",
      },
      {
        id: 2,
        label: "Vite Logo",
        type: "image/svg",
        source: "2.svg",
        size: 10,
      },
      {
        id: 3,
        label: "Preact",
        source: "https://preactjs.com/",
      },
      {
        id: 4,
        label: "Preact Logo",
        type: "image/svg",
        source: "4.svg",
        size: 10,
      },
      {
        id: 5,
        label: "React",
        source: "https://react.dev/",
      },
      {
        id: 6,
        label: "ESBuild",
        size: 5,
      },
      {
        id: 7,
        label: "Rollup",
        size: 5,
      },
      {
        id: 8,
        label: "Webpack",
        size: 25,
      },
    ];
    for (const n of nodes) insertNode(db.value, n);
    const edges = [
      { from: 1, to: 2 },
      { from: 3, to: 4 },
      { from: 1, to: 3, label: "Supports" },
      { from: 1, to: 5, label: "Supports" },
      { from: 3, to: 5, label: "Alternative" },
      { from: 5, to: 3, label: "Alternative" },
      { from: 1, to: 6, label: "Uses" },
      { from: 1, to: 7, label: "Uses" },
      { from: 8, to: 3, label: "Supports" },
      { from: 8, to: 5, label: "Supports" },
    ];
    for (const e of edges) insertEdge(db.value, e);

    queryDB();

    if (!dbFileHandle.value) return;
    saveDB(db.value, dbFileHandle.value);
  }

  function queryDB() {
    if (!db.value) return;
    nodes.value = queryNodes(db.value) as Node[];
    edges.value = queryEdges(db.value) as Edge[];

    if (!container.value) return;
    drawGraph(container.value, nodes.value ?? [], edges.value ?? [], {
      selectedNodeId,
    });
  }

  async function showNodeContent(id?: number) {
    if (id == null) {
      contentUrl.value = "";
      return;
    }
    if (!blobDirectoryHandle.value) {
      contentUrl.value = "";
      return;
    }
    const node = nodes.value.find((n) => n.id === id);
    if (!node?.source) {
      contentUrl.value = "";
      return;
    }
    if (!node.type) {
      contentUrl.value = node.source;
      return;
    }
    const blob = await getBlob(blobDirectoryHandle.value, node.source);
    const url = URL.createObjectURL(blob);
    contentUrl.value = url;
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  }
}
