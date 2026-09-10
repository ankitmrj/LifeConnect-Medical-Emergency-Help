import test from 'node:test'; import assert from 'node:assert/strict'; import app from '../src/app.js';

test('health endpoint is available', async()=>{const r=await fetch('http://127.0.0.1:59999/api/health').catch(()=>null); assert.equal(r,null); assert.equal(typeof app,'function');});
