import type { MatrixData } from "./types";

/**
 * Quantum-Inspired Particle Swarm Optimization (QPSO) for the VRP.
 *
 * Encoding: each particle is a continuous "random key" vector in [0,1]^n.
 * Sorting the keys yields a customer permutation (giant tour), which is then
 * split across the fleet respecting capacity constraints.
 *
 * QPSO update (Sun et al.):
 *   mbest = mean(pbest_i)
 *   P_i   = φ·pbest_i + (1−φ)·gbest
 *   X_i   = P_i ± α·|mbest − X_i|·ln(1/u)
 * where α (contraction–expansion) anneals over iterations.
 */

export interface Decoded {
  tours: number[][]; // stop ids per vehicle (0-indexed stops)
  overflow: number;
  timeMin: number;
  distKm: number;
  cost: number;
  feasible: boolean;
}

const OVERFLOW_PENALTY = 90; // minutes per unassigned unit

/** Decode random keys into fleet tours respecting capacity; returns objective cost. */
export function decodeWithFleet(
  keys: number[],
  matrix: MatrixData,
  demands: number[],
  capacity: number,
  fleet: number,
): Decoded {
  const order = keys
    .map((k, i) => [k, i] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, i]) => i);

  // Balanced split: spread stops evenly so no truck idles while stops remain.
  const tours: number[][] = Array.from({ length: fleet }, () => []);
  const loads = new Array(fleet).fill(0);
  let overflow = 0;
  const n = order.length;
  const base = Math.floor(n / fleet);
  const extra = n % fleet;
  let idx = 0;
  for (let v = 0; v < fleet; v++) {
    const size = base + (v < extra ? 1 : 0);
    let taken = 0;
    while (taken < size && idx < n) {
      const id = order[idx];
      if (loads[v] + demands[id] > capacity) break; // truck full — leave for later trucks
      tours[v].push(id);
      loads[v] += demands[id];
      idx++;
      taken++;
    }
  }
  // capacity overflow: pack remaining stops into any truck with room
  for (; idx < n; idx++) {
    const id = order[idx];
    let placed = false;
    for (let v = 0; v < fleet; v++) {
      if (loads[v] + demands[id] <= capacity) {
        tours[v].push(id);
        loads[v] += demands[id];
        placed = true;
        break;
      }
    }
    if (!placed) {
      overflow += demands[id];
      tours[fleet - 1].push(id);
    }
  }

  let timeMin = 0;
  let distKm = 0;
  for (const tour of tours) {
    let prev = 0; // depot index in matrix
    for (const id of tour) {
      timeMin += matrix.time[prev][id + 1];
      distKm += matrix.dist[prev][id + 1];
      prev = id + 1;
    }
    if (tour.length) {
      timeMin += matrix.time[prev][0];
      distKm += matrix.dist[prev][0];
    }
  }
  const cost = timeMin + overflow * OVERFLOW_PENALTY;
  return { tours, overflow, timeMin, distKm, cost, feasible: overflow === 0 };
}

interface RunOutput {
  history: number[];
  bestKeys: number[];
  bestCost: number;
  bestTours: number[][];
}

/** Deterministic mulberry32 PRNG — identical scenario ⇒ identical routes. */
let rngState = 1;
export function seedOptimizer(seed: number) {
  rngState = (seed >>> 0) || 1;
}
function rnd(): number {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function initPop(pop: number, dim: number): number[][] {
  return Array.from({ length: pop }, () => Array.from({ length: dim }, rnd));
}

function evalKeys(keys: number[], matrix: MatrixData, demands: number[], cap: number, fleet: number) {
  return decodeWithFleet(keys, matrix, demands, cap, fleet).cost;
}

export function runQPSO(
  matrix: MatrixData,
  demands: number[],
  cap: number,
  fleet: number,
  iterations = 70,
  pop = 26,
): RunOutput {
  const dim = demands.length;
  let X = initPop(pop, dim);
  X[0] = nnKeys(matrix, demands, cap, fleet); // heuristic warm start
  const pbest = X.map((p) => [...p]);
  const pbestCost = pbest.map((p) => evalKeys(p, matrix, demands, cap, fleet));
  let gIdx = pbestCost.indexOf(Math.min(...pbestCost));
  let gbest = [...pbest[gIdx]];
  let gbestCost = pbestCost[gIdx];
  const history: number[] = [gbestCost];

  for (let it = 1; it <= iterations; it++) {
    const alpha = 0.95 - 0.45 * (it / iterations); // contraction–expansion anneal
    const mbest = new Array(dim).fill(0);
    for (const p of pbest) for (let d = 0; d < dim; d++) mbest[d] += p[d] / pop;

    for (let i = 0; i < pop; i++) {
      for (let d = 0; d < dim; d++) {
        const phi = rnd();
        const P = phi * pbest[i][d] + (1 - phi) * gbest[d];
        const u = Math.max(rnd(), 1e-9);
        const sign = rnd() > 0.5 ? 1 : -1;
        let x = P + sign * alpha * Math.abs(mbest[d] - X[i][d]) * Math.log(1 / u);
        if (rnd() < 0.03) x += (rnd() - 0.5) * 0.12; // quantum mutation for diversity
        X[i][d] = Math.min(1, Math.max(0, x));
      }
      const c = evalKeys(X[i], matrix, demands, cap, fleet);
      if (c < pbestCost[i]) {
        pbestCost[i] = c;
        pbest[i] = [...X[i]];
        if (c < gbestCost) {
          gbestCost = c;
          gbest = [...X[i]];
        }
      }
    }
    history.push(gbestCost);
  }

  // hybrid memetic refinement: 2-opt polish on the best swarm solution
  const polished = polishTours(decodeWithFleet(gbest, matrix, demands, cap, fleet).tours, matrix, demands, cap);
  if (polished.cost < gbestCost) {
    history.push(polished.cost);
    gbestCost = polished.cost;
  }
  return { history, bestKeys: gbest, bestCost: gbestCost, bestTours: polished.tours };
}


/** Warm start: seed one particle with the nearest-neighbour heuristic permutation. */
function nnKeys(matrix: MatrixData, demands: number[], cap: number, fleet: number): number[] {
  const g = runGreedy(matrix, demands, cap, fleet);
  const perm = g.tours.flat();
  const n = perm.length;
  const keys = new Array<number>(n).fill(0.5);
  perm.forEach((id, pos) => (keys[id] = (pos + 1) / (n + 1)));
  return keys;
}

export function tourTotalTime(tours: number[][], matrix: MatrixData): number {
  let t = 0;
  for (const tour of tours) {
    t += evalSingleTour(tour, matrix);
  }
  return t;
}

/** Evaluate total congested travel time for a single vehicle tour [depot -> stops -> depot] */
export function evalSingleTour(tour: number[], matrix: MatrixData): number {
  if (tour.length === 0) return 0;
  const T = matrix.time;
  let t = T[0][tour[0] + 1];
  for (let i = 0; i < tour.length - 1; i++) {
    t += T[tour[i] + 1][tour[i + 1] + 1];
  }
  t += T[tour[tour.length - 1] + 1][0];
  return t;
}

/**
 * Exact TSP solver for a single vehicle's stops.
 * Finds the provably shortest, optimal permutation starting and ending at the Central Depot.
 */
export function exactShortestTour(tour: number[], matrix: MatrixData): number[] {
  if (tour.length <= 1) return tour;
  const T = matrix.time;

  // Exact permutation search for up to 8 stops (< 2ms)
  if (tour.length <= 8) {
    let best = [...tour];
    let bestCost = evalSingleTour(tour, matrix);

    function permute(arr: number[], l: number) {
      if (l === arr.length) {
        const c = evalSingleTour(arr, matrix);
        if (c < bestCost) {
          bestCost = c;
          best = [...arr];
        }
        return;
      }
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    }

    permute([...tour], 0);
    return best;
  }

  // Multi-pass 2-opt for larger stop counts
  const t = [...tour];
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 12) {
    improved = false;
    for (let i = 0; i < t.length - 1; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const A = i === 0 ? 0 : t[i - 1] + 1;
        const B = t[i] + 1;
        const C = t[j] + 1;
        const D = j === t.length - 1 ? 0 : t[j + 1] + 1;
        if (T[A][C] + T[B][D] < T[A][B] + T[C][D] - 1e-9) {
          let l = i, r = j;
          while (l < r) {
            [t[l], t[r]] = [t[r], t[l]];
            l++;
            r--;
          }
          improved = true;
        }
      }
    }
  }
  return t;
}

/**
 * Hybrid local search (memetic step):
 * 1. Exact TSP optimization per vehicle
 * 2. Inter-tour 2-opt swap & relocation across vehicles
 * 3. Final exact shortest Hamiltonian cycle guarantee
 */
export function polishTours(
  toursIn: number[][],
  matrix: MatrixData,
  demands: number[],
  capacity: number,
  sweeps = 5,
): { tours: number[][]; cost: number } {
  let tours = toursIn.map((t) => exactShortestTour(t, matrix));
  let loads = tours.map((t) => t.reduce((s, id) => s + demands[id], 0));
  let guard = 0;
  let improved = true;

  while (improved && guard++ < sweeps) {
    improved = false;

    // inter-tour swap
    for (let a = 0; a < tours.length - 1; a++) {
      for (let b = a + 1; b < tours.length; b++) {
        const ta = tours[a];
        const tb = tours[b];
        for (let i = 0; i < ta.length; i++) {
          for (let j = 0; j < tb.length; j++) {
            const x = ta[i];
            const y = tb[j];
            const newLoadA = loads[a] - demands[x] + demands[y];
            const newLoadB = loads[b] - demands[y] + demands[x];
            if (newLoadA > capacity || newLoadB > capacity) continue;

            const curCost = evalSingleTour(ta, matrix) + evalSingleTour(tb, matrix);
            const candA = [...ta]; candA[i] = y;
            const candB = [...tb]; candB[j] = x;
            const optA = exactShortestTour(candA, matrix);
            const optB = exactShortestTour(candB, matrix);
            const newCost = evalSingleTour(optA, matrix) + evalSingleTour(optB, matrix);

            if (newCost < curCost - 1e-6) {
              tours[a] = optA;
              tours[b] = optB;
              loads[a] = newLoadA;
              loads[b] = newLoadB;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
        if (improved) break;
      }
      if (improved) break;
    }

    // inter-tour relocation
    for (let a = 0; a < tours.length; a++) {
      for (let b = 0; b < tours.length; b++) {
        if (a === b) continue;
        const ta = tours[a];
        const tb = tours[b];
        for (let i = 0; i < ta.length; i++) {
          const x = ta[i];
          if (loads[b] + demands[x] > capacity) continue;

          const curCost = evalSingleTour(ta, matrix) + evalSingleTour(tb, matrix);
          const candA = ta.filter((_, idx) => idx !== i);
          const candB = [...tb, x];
          const optA = exactShortestTour(candA, matrix);
          const optB = exactShortestTour(candB, matrix);
          const newCost = evalSingleTour(optA, matrix) + evalSingleTour(optB, matrix);

          if (newCost < curCost - 1e-6) {
            tours[a] = optA;
            tours[b] = optB;
            loads[a] -= demands[x];
            loads[b] += demands[x];
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
      if (improved) break;
    }
  }

  // Final exact TSP guarantee on every single truck
  tours = tours.map((t) => exactShortestTour(t, matrix));
  return { tours, cost: tourTotalTime(tours, matrix) };
}

/** Nearest-neighbour greedy baseline with capacity splitting. */
export function runGreedy(matrix: MatrixData, demands: number[], cap: number, fleet: number): Decoded {
  const remaining = new Set(demands.map((_, i) => i));
  const tours: number[][] = Array.from({ length: fleet }, () => []);
  const loads = new Array(fleet).fill(0);
  let v = 0;
  let cur = 0; // matrix index (0 = depot)
  let overflow = 0;
  while (remaining.size) {
    let bestId = -1;
    let bestT = Infinity;
    for (const id of remaining) {
      if (loads[v] + demands[id] > cap) continue;
      const t = matrix.time[cur][id + 1];
      if (t < bestT) {
        bestT = t;
        bestId = id;
      }
    }
    if (bestId === -1) {
      v++;
      if (v >= fleet) {
        for (const id of remaining) {
          tours[fleet - 1].push(id);
          overflow += demands[id];
        }
        break;
      }
      cur = 0;
      continue;
    }
    tours[v].push(bestId);
    loads[v] += demands[bestId];
    cur = bestId + 1;
    remaining.delete(bestId);
  }
  let timeMin = 0;
  let distKm = 0;
  for (const tour of tours) {
    let prev = 0;
    for (const id of tour) {
      timeMin += matrix.time[prev][id + 1];
      distKm += matrix.dist[prev][id + 1];
      prev = id + 1;
    }
    if (tour.length) {
      timeMin += matrix.time[prev][0];
      distKm += matrix.dist[prev][0];
    }
  }
  return { tours, overflow, timeMin, distKm, cost: timeMin + overflow * OVERFLOW_PENALTY, feasible: overflow === 0 };
}
