/**
 * Compute which tasks/challenges a team has unlocked.
 *
 * Rules:
 *   1. First task (by order) in each group is unlocked if it's a group intro
 *      OR if it has requiresPrevious: false.
 *   2. Tasks with requiresPrevious: false are always unlocked.
 *   3. A task is unlocked if the previous task in the SAME GROUP has an
 *      approved submission.
 *   4. Tasks in team.unlockedOverride are always unlocked.
 *
 * Group intro cards are always unlocked (they're just informational).
 */
export function computeTaskUnlocks(tasks, submissions, overrides = []) {
  const sorted = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /* Set of task IDs that have an approved submission */
  const approvedTaskIds = new Set(
    submissions
      .filter((s) => s.status === "approved")
      .map((s) => String(s.taskId?._id || s.taskId))
  );

  const overrideSet = new Set(overrides.map((id) => String(id)));

  const unlocked = new Set();
  const locked = new Set();

  /* Track previous task per group */
  const previousTaskByGroup = {};

  for (let i = 0; i < sorted.length; i++) {
    const task = sorted[i];
    const taskId = String(task._id);
    const group = task.group || "__default__";

    /* Group intro cards are always unlocked */
    if (task.isGroupIntro) {
      unlocked.add(taskId);
      previousTaskByGroup[group] = taskId;
      continue;
    }

    const isFirstInGroup = !previousTaskByGroup[group];
    const noRequirement = task.requiresPrevious === false;
    const isOverridden = overrideSet.has(taskId);
    const previousApproved =
      previousTaskByGroup[group] &&
      approvedTaskIds.has(previousTaskByGroup[group]);

    if (isFirstInGroup || noRequirement || isOverridden || previousApproved) {
      unlocked.add(taskId);
    } else {
      locked.add(taskId);
    }

    previousTaskByGroup[group] = taskId;
  }

  return { unlocked, locked };
}