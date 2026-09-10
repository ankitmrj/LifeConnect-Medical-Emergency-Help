class MinHeap {
  constructor() { this.items = []; }
  push(item) { this.items.push(item); this.#up(this.items.length - 1); }
  pop() {
    if (!this.items.length) return null;
    const top = this.items[0], last = this.items.pop();
    if (this.items.length && last) { this.items[0] = last; this.#down(0); }
    return top;
  }
  #up(i) { while (i) { const p = Math.floor((i-1)/2); if (this.items[p].distance <= this.items[i].distance) break; [this.items[p], this.items[i]] = [this.items[i], this.items[p]]; i = p; } }
  #down(i) { const n = this.items.length; while (true) { let s=i,l=i*2+1,r=l+1; if(l<n&&this.items[l].distance<this.items[s].distance)s=l; if(r<n&&this.items[r].distance<this.items[s].distance)s=r; if(s===i)break; [this.items[s],this.items[i]]=[this.items[i],this.items[s]]; i=s; } }
}

export function dijkstra(graph, sourceNode) {
  const dist = {}, prev = {}, heap = new MinHeap();
  for (const node of Object.keys(graph)) dist[node] = Infinity;
  dist[sourceNode] = 0; heap.push({ node: sourceNode, distance: 0 });
  while (heap.items.length) {
    const cur = heap.pop(); if (!cur || cur.distance !== dist[cur.node]) continue;
    for (const edge of graph[cur.node] || []) {
      const next = cur.distance + Number(edge.weight);
      if (next < (dist[edge.to] ?? Infinity)) { dist[edge.to] = next; prev[edge.to] = cur.node; heap.push({ node: edge.to, distance: next }); }
    }
  }
  return { distances: dist, previous: prev };
}

export function reconstructPath(previous, source, destination) {
  const path = []; let current = destination;
  while (current !== undefined) { path.push(current); if (current === source) return path.reverse(); current = previous[current]; }
  return [];
}

export function createSyntheticRoutingGraph(points) {
  const graph = {};
  for (const p of points) graph[p.id] = [];
  // Configurable demo graph: complete weighted graph using straight-line distance.
  // This is intentionally NOT represented as driving/road distance.
  for (const a of points) for (const b of points) if (a.id !== b.id) graph[a.id].push({ to: b.id, weight: a.distanceTo(b) });
  return graph;
}
