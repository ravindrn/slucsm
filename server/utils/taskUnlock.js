/**
 * Compute which tasks a team has unlocked.
 *
 * Rules:
 *   1. First task (lowest order) is always unlocked.
 *   2. Tasks with `requiresPrevious: false` are always unlocked.
 *   3. A task is unlocked if the previous task (by order) has at least one approved submission.
 *   4. Tasks in `team.unlockedOverride` are always unlocked.
 *
 * @param {Array}  tasks       - All active tasks for the event (unsorted ok, we sort)
 * @param {Array}  submissions - All submissions for THIS team
 * @param {Array}  overrides   - Array of task IDs the admin force-unlocked
 * @returns {{ unlocked: Set<string>, locked: Set<string> }}
 */
export function computeTaskUnlocks(tasks, submissions, overrides = []) {
  const sorted = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /* Set of task IDs that have at least one approved submission */
  const approvedTaskIds = new Set(
    submissions
      .filter((s) => s.status === "approved")
      .map((s) => String(s.taskId?._id || s.taskId))
  );

  const overrideSet = new Set(overrides.map((id) => String(id)));

  const unlocked = new Set();
  const locked = new Set();

  let previousTaskId = null;

  for (let i = 0; i < sorted.length; i++) {
    const task = sorted[i];
    const taskId = String(task._id);

    const isFirst = i === 0;
    const noRequirement = task.requiresPrevious === false;
    const isOverridden = overrideSet.has(taskId);
    const previousApproved =
      previousTaskId && approvedTaskIds.has(previousTaskId);

    if (isFirst || noRequirement || isOverridden || previousApproved) {
      unlocked.add(taskId);
    } else {
      locked.add(taskId);
    }

    previousTaskId = taskId;
  }

  return { unlocked, locked };
}