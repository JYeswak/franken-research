// Engine-only analogue of candidate B: engine A behind a worker_threads message round trip.
import { parentPort, workerData } from 'node:worker_threads';
import { hydrate, search } from './engine-a.mjs';

const idx = hydrate(workerData.text);
parentPort.postMessage('ready');
parentPort.on('message', (q) => parentPort.postMessage(search(idx, q)));
