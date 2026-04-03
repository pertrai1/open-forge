/**
 * ROADMAP types — Phase, Task, and Roadmap interfaces.
 */

/** Task complexity classification determines routing and verification depth. */
export type TaskComplexity = 'trivial' | 'simple' | 'medium' | 'complex';

/** Task completion status. */
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

/** A single atomic task within a phase. */
export interface RoadmapTask {
  /** Task identifier (e.g., "1.3"). */
  readonly id: string;
  /** Human-readable description. */
  readonly description: string;
  /** Task IDs this task depends on. Empty array means no dependencies. */
  readonly dependencies: readonly string[];
  /** Expected deliverable (file path or description). */
  readonly deliverable: string;
  /** Whether the task is marked done in the ROADMAP. */
  readonly completed: boolean;
  /** Complexity classification for routing decisions. */
  readonly complexity: TaskComplexity;
}

/** A named group of tasks that can execute in parallel. */
export interface ParallelGroup {
  /** Group label (e.g., "Group A"). */
  readonly name: string;
  /** Task IDs in this group. */
  readonly taskIds: readonly string[];
  /** Human-readable note (e.g., "all independent"). */
  readonly note: string;
}

/** A phase within the roadmap. */
export interface RoadmapPhase {
  /** Phase number (0-based). */
  readonly number: number;
  /** Phase name (e.g., "Project Foundation"). */
  readonly name: string;
  /** What this phase accomplishes. */
  readonly goal: string;
  /** Ordered list of tasks in this phase. */
  readonly tasks: readonly RoadmapTask[];
  /** Groups of tasks that can run concurrently. */
  readonly parallelGroups: readonly ParallelGroup[];
}

/** A complete parsed roadmap. */
export interface Roadmap {
  /** Project title from the roadmap header. */
  readonly title: string;
  /** Overview section content (tech stack, architecture, etc.). */
  readonly overview: string;
  /** Ordered list of phases. */
  readonly phases: readonly RoadmapPhase[];
}
