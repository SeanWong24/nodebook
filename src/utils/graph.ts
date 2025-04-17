import { DataSet, Network, Options } from "vis-network/standalone";
import { Edge } from "./edge";
import { Node } from "./node";
import { Signal } from "@preact/signals";

let network: Network;

export function drawGraph(
  container: HTMLDivElement,
  nodes: Node[],
  edges: Edge[],
  extras?: {
    selectedNodeId: Signal<number | undefined>;
  }
) {
  const data = {
    nodes: new DataSet(
      nodes.map((n) => ({
        ...n,
        shape: n.source ? "dot" : "triangle",
      }))
    ),
    edges: new DataSet(edges),
  };

  const options: Options = {
    nodes: {
      //   shape: "dot",
      size: 16,
      color: {
        border: "black",
        background: "#97C2FC",
      },
      font: {
        size: 14,
        color: "#bababa",
      },
    },
    edges: {
      arrows: "to",
      width: 2,
      color: "#727272",
      smooth: {
        enabled: true,
        type: "continuous",
        roundness: 0.5,
      },
      font: {
        size: 12,
        color: "#bbbbbb",
      },
    },
    physics: {
      enabled: true,
    },
  };

  network = new Network(container, data, options);
  network.fit();
  network.on("oncontext", (params) => {
    params.event.preventDefault();
    alert(JSON.stringify(params));
  });
  network.on("selectNode", (params) => {
    if (!extras?.selectedNodeId) return;
    extras.selectedNodeId.value = params.nodes[0];
  });
}

export function focusToNode(nodeId: number) {
  network?.focus(nodeId, { animation: true });
  network?.selectNodes([nodeId]);
}
