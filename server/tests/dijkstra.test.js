import test from 'node:test'; import assert from 'node:assert/strict'; import {dijkstra,reconstructPath} from '../src/algorithms/dijkstra.js';
test('dijkstra finds shortest path',()=>{const g={A:[{to:'B',weight:2},{to:'C',weight:8}],B:[{to:'C',weight:3}],C:[]};const r=dijkstra(g,'A');assert.equal(r.distances.C,5);assert.deepEqual(reconstructPath(r.previous,'A','C'),['A','B','C']);});
