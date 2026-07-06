import type { SceneTilemapData } from "shared/lib/resources/types";

const WORK_BUDGET_MS = 4;
const TIME_CHECK_INTERVAL = 1024;

type Subscriber = (tiles: Uint32Array) => void;

interface FlattenJob {
  tilemap: SceneTilemapData;
  width: number;
  height: number;
  tiles: Uint32Array;
  layerIndex: number;
  cellIndex: number;
  subscribers: Set<Subscriber>;
  prioritySubscribers: Set<Subscriber>;
  queued: boolean;
  complete: boolean;
}

const jobsByTilemap = new WeakMap<SceneTilemapData, Map<string, FlattenJob>>();
const queue: FlattenJob[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

const processJobChunk = (job: FlattenJob) => {
  const size = job.width * job.height;
  const deadline = performance.now() + WORK_BUDGET_MS;
  let operations = 0;

  while (job.layerIndex < job.tilemap.layers.length) {
    const layer = job.tilemap.layers[job.layerIndex];
    if (!layer.visible) {
      job.layerIndex++;
      job.cellIndex = 0;
      continue;
    }

    while (job.cellIndex < size) {
      const tile = layer.tiles[job.cellIndex];
      if (tile) {
        job.tiles[job.cellIndex] = tile;
      }
      job.cellIndex++;
      operations++;

      if (
        operations % TIME_CHECK_INTERVAL === 0 &&
        performance.now() >= deadline
      ) {
        return false;
      }
    }

    job.layerIndex++;
    job.cellIndex = 0;
  }

  job.complete = true;
  return true;
};

const scheduleQueue = () => {
  if (timer !== undefined) {
    return;
  }
  timer = setTimeout(processQueue, 0);
};

const processQueue = () => {
  timer = undefined;
  let job = queue.shift();
  while (job && job.subscribers.size === 0) {
    job.queued = false;
    job = queue.shift();
  }
  if (!job) {
    return;
  }
  job.queued = false;

  if (processJobChunk(job)) {
    job.subscribers.forEach((subscriber) => subscriber(job.tiles));
    job.subscribers.clear();
    job.prioritySubscribers.clear();
  } else {
    job.queued = true;
    if (job.prioritySubscribers.size) {
      queue.unshift(job);
    } else {
      queue.push(job);
    }
  }

  scheduleQueue();
};

const getJob = (tilemap: SceneTilemapData, width: number, height: number) => {
  let jobs = jobsByTilemap.get(tilemap);
  if (!jobs) {
    jobs = new Map();
    jobsByTilemap.set(tilemap, jobs);
  }

  const key = `${width}x${height}`;
  let job = jobs.get(key);
  if (!job) {
    job = {
      tilemap,
      width,
      height,
      tiles: new Uint32Array(width * height),
      layerIndex: 0,
      cellIndex: 0,
      subscribers: new Set(),
      prioritySubscribers: new Set(),
      queued: false,
      complete: false,
    };
    jobs.set(key, job);
  }
  return job;
};

export const scheduleFlattenTilemap = (
  tilemap: SceneTilemapData,
  width: number,
  height: number,
  subscriber: Subscriber,
  priority = false,
) => {
  const job = getJob(tilemap, width, height);
  if (job.complete) {
    const completeTimer = setTimeout(() => subscriber(job.tiles), 0);
    return () => clearTimeout(completeTimer);
  }

  job.subscribers.add(subscriber);
  if (priority) {
    job.prioritySubscribers.add(subscriber);
  }
  if (!job.queued) {
    job.queued = true;
    queue.unshift(job);
    scheduleQueue();
  }

  return () => {
    job.subscribers.delete(subscriber);
    job.prioritySubscribers.delete(subscriber);
  };
};
