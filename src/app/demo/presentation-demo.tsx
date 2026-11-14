"use client";

import { useState } from "react";

type Member = "Mohammed" | "Saad" | "Mehdi" | "Aymen";
const members: { name: Member; role: string }[] = [
  { name: "Mohammed", role: "Team lead" },
  { name: "Saad", role: "Ordering system" },
  { name: "Mehdi", role: "Customer pages" },
  { name: "Aymen", role: "Testing" },
];
const scenes: {
  title: string;
  actor: Member;
  label: string;
  message: string;
  action: string;
  say: string;
  chapter: number;
}[] = [
  {
    title: "One team, one shared goal",
    actor: "Mohammed",
    label: "The team’s plan",
    message:
      "The team is building an online shop. Mohammed sees who owns each task and what still needs attention.",
    action: "Show the new work update",
    say: "Our four-person team is building an online shop. Each person sees their own tasks, while Mohammed sees the whole plan.",
    chapter: 0,
  },
  {
    title: "Saad adds a way to place orders",
    actor: "Saad",
    label: "Sample GitHub update",
    message:
      "GitHub, where the team keeps its code, reports a new change. Orders can be saved, but checks for missing details are still absent.",
    action: "Show the AI suggestion",
    say: "MergeMind connects Saad’s code update to the project goal. Activity alone does not mean a task is complete.",
    chapter: 0,
  },
  {
    title: "The AI spots a missing step",
    actor: "Mohammed",
    label: "A suggestion, awaiting approval",
    message:
      "Stop incomplete orders. If a customer forgets the price or currency, show a helpful message instead of saving the order.",
    action: "Approve task and assign Saad",
    say: "The AI explains a missing step using the team’s goal and Saad’s update. Mohammed decides whether to approve it and assigns Saad.",
    chapter: 1,
  },
  {
    title: "Aymen checks Saad’s result",
    actor: "Aymen",
    label: "Human confirmation",
    message:
      "For this sample story, Saad has added the checks. Aymen confirms that an incomplete order is stopped and the customer sees a helpful message.",
    action: "Confirm the sample check passed",
    say: "The task appears only after approval. We now simulate Saad’s change and Aymen’s check. A person confirms the result before progress increases.",
    chapter: 1,
  },
  {
    title: "Mehdi gets stuck on the checkout",
    actor: "Mehdi",
    label: "A teammate needs help",
    message:
      "The checkout page is partly built, but Mehdi needs help connecting its order button. He shares what is done and where to continue.",
    action: "Report the blocker to Mohammed",
    say: "Mehdi has already built the page layout, but he is stuck connecting the order button. He records the blocker and leaves clear handoff notes.",
    chapter: 2,
  },
  {
    title: "Mohammed finds someone available",
    actor: "Mohammed",
    label: "Lead-approved handoff",
    message:
      "Saad has finished both of his tasks. Mohammed can give him Mehdi’s existing task, keeping the work and notes together.",
    action: "Reassign the checkout task to Saad",
    say: "Mohammed sees that Saad has finished all his current tasks. He chooses Saad to take over. The system does not silently assign the work.",
    chapter: 2,
  },
  {
    title: "Saad picks up where Mehdi stopped",
    actor: "Saad",
    label: "Same task, new owner",
    message:
      "Saad receives the existing checkout task and Mehdi’s notes. He can continue the work instead of starting again.",
    action: "Pick up the task",
    say: "The same task moves into Saad’s workspace with its history. Mehdi can see the handoff. Reassigning work does not mark it complete.",
    chapter: 2,
  },
  {
    title: "The team has a clear next step",
    actor: "Mohammed",
    label: "Shared team overview",
    message:
      "Two tasks are complete. Saad is continuing the checkout page, Aymen still has a shopping-journey check, and Mohammed can see the remaining work.",
    action: "Replay the story",
    say: "The team can see what changed, who is responsible, and what happens next. The checkout blocker is being investigated, so it stays visible until someone confirms it is resolved.",
    chapter: 3,
  },
];

export function Demo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [explore, setExplore] = useState(false);
  const [viewAs, setViewAs] = useState<Member>("Mohammed");
  const scene = scenes[sceneIndex];
  const viewer = explore ? viewAs : scene.actor;
  const approved = sceneIndex >= 3;
  const verified = sceneIndex >= 4;
  const blocked = sceneIndex >= 5;
  const delegated = sceneIndex >= 6;
  const resumed = sceneIndex >= 7;
  const tasks = [
    { title: "Prepare the project", owner: "Saad", status: "Done" },
    {
      title: "Build the checkout page",
      owner: delegated ? "Saad" : "Mehdi",
      status: blocked && !resumed ? "Blocked" : "In progress",
    },
    { title: "Check the shopping journey", owner: "Aymen", status: "To do" },
    ...(approved
      ? [
          {
            title: "Stop incomplete orders",
            owner: "Saad",
            status: verified ? "Done" : "In progress",
          },
        ]
      : []),
  ];
  const done = tasks.filter((task) => task.status === "Done").length;
  const progress = Math.round((done / tasks.length) * 100);
  const personal =
    viewer === "Mohammed"
      ? tasks
      : tasks.filter((task) => task.owner === viewer);
  const workload = members
    .filter((member) => member.name !== "Mohammed")
    .map((member) => {
      const list = tasks.filter((task) => task.owner === member.name);
      return {
        name: member.name,
        done: list.filter((task) => task.status === "Done").length,
        open: list.filter((task) => task.status !== "Done").length,
      };
    });
  const canDelegate =
    workload.find((member) => member.name === "Saad")?.open === 0;
  function go(index: number) {
    setSceneIndex(Math.max(0, Math.min(scenes.length - 1, index)));
    setExplore(false);
  }
  function advance() {
    if (sceneIndex === 5 && !canDelegate) return;
    go(sceneIndex === scenes.length - 1 ? 0 : sceneIndex + 1);
  }

  return (
    <div className="walkthrough">
      <div className="walk-top">
        <span className="demo-label">GUIDED DEMO · SAMPLE DATA</span>
        <div>
          <button
            className="text-button"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? "Hide" : "Show"} speaker notes
          </button>
          <button className="text-button" onClick={() => go(0)}>
            Start again
          </button>
        </div>
      </div>
      <div className="walk-title">
        <div>
          <p className="kicker">MERGEMIND / TEAM ORBIT</p>
          <h1>A clear next step for everyone.</h1>
        </div>
        <span>
          About 90 seconds
          <br />
          <strong>
            {sceneIndex + 1} of {scenes.length} scenes
          </strong>
        </span>
      </div>
      <ol className="walk-chapters" aria-label="Story chapters">
        {[
          "Understand the work",
          "Approve a useful task",
          "Help a blocked teammate",
          "See the whole team",
        ].map((name, index) => (
          <li
            key={name}
            aria-current={scene.chapter === index ? "step" : undefined}
            className={
              scene.chapter === index
                ? "active"
                : scene.chapter > index
                  ? "past"
                  : ""
            }
          >
            <b>0{index + 1}</b>
            {name}
          </li>
        ))}
      </ol>
      <div className="walk-stage">
        <section
          className="walk-story"
          aria-live="polite"
          aria-labelledby="scene-title"
        >
          <p className="kicker">{scene.label}</p>
          <h2 id="scene-title">{scene.title}</h2>
          <p className="walk-message">{scene.message}</p>
          {sceneIndex === 0 && (
            <div className="walk-evidence">
              <strong>The goal</strong>
              <p>
                Customers can place an order. Missing details produce a helpful
                message.
              </p>
              <span>
                Customer website + ordering system
                <br />
                Two connected GitHub repositories
              </span>
            </div>
          )}
          {sceneIndex === 1 && (
            <div className="walk-evidence">
              <strong>Observed in the sample update</strong>
              <p>Order saving added in orbit/api, sample change #18.</p>
              <span>
                No required-detail checks shown. No test results supplied.
              </span>
            </div>
          )}
          {sceneIndex === 2 && (
            <div className="walk-evidence">
              <strong>Why this suggestion?</strong>
              <p>
                Team goal: explain missing details.
                <br />
                Sample change #18: checks are absent.
                <br />
                Mehdi’s task: build the checkout page.
              </p>
              <span>
                AI suggestion only. Saad receives it after Mohammed’s approval.
              </span>
            </div>
          )}
          {sceneIndex === 3 && (
            <div className="walk-evidence">
              <strong>Sample acceptance check</strong>
              <p>
                Missing price or currency stops the order and shows a useful
                message.
              </p>
              <span>
                This button simulates Aymen’s human confirmation. No real test
                runs here.
              </span>
            </div>
          )}
          {(sceneIndex === 4 || sceneIndex === 6) && (
            <div className="walk-evidence">
              <strong>Mehdi’s handoff notes</strong>
              <p>
                “The page layout is ready. I’m stuck connecting the order
                button. Continue from the existing checkout page.”
              </p>
              <span>
                {delegated
                  ? "Mohammed reassigned the same task. Notes and existing work are preserved."
                  : "Progress stays with the task when the owner changes."}
              </span>
            </div>
          )}
          {sceneIndex === 5 && (
            <div className="walk-evidence">
              <strong>Who has room to help?</strong>
              <ul className="walk-workload">
                {workload.map((member) => (
                  <li key={member.name}>
                    <b>{member.name}</b>
                    <span>
                      {member.done} finished / {member.open} unfinished
                    </span>
                    <em>
                      {member.open === 0 && member.done > 0
                        ? "Available"
                        : "Has work"}
                    </em>
                  </li>
                ))}
              </ul>
              <span>
                Mohammed checks suitability and decides. Availability alone
                never assigns a task.
              </span>
            </div>
          )}
          {sceneIndex === 7 && (
            <div className="walk-evidence">
              <strong>What the team now knows</strong>
              <p>
                Order checks: finished.
                <br />
                Checkout owner: Saad.
                <br />
                Checkout blocker: under investigation.
              </p>
              <span>
                Completed tasks determine progress. Code activity and handoffs
                do not.
              </span>
            </div>
          )}
        </section>
        <section
          className="walk-workspace"
          aria-live="polite"
          aria-labelledby="workspace-title"
        >
          <div className="walk-person">
            <span>{viewer.slice(0, 2).toUpperCase()}</span>
            <div>
              <p>
                {explore ? "Exploring a member’s view" : "This step happens in"}
              </p>
              <h2 id="workspace-title">{viewer}’s workspace</h2>
            </div>
          </div>
          <div className="walk-metrics">
            <div>
              <b>{progress}%</b>
              <span>
                {done} of {tasks.length} tasks complete
              </span>
            </div>
            <span>{viewer === "Mohammed" ? "Team overview" : "My tasks"}</span>
          </div>
          <div
            className="demo-progress"
            role="progressbar"
            aria-label="Human-confirmed task progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          {sceneIndex === 3 && (
            <p className="walk-explain">
              The new task makes 4 in total. 1 is complete, so progress is 25%.
            </p>
          )}
          {blocked && (
            <p className="walk-alert">
              {resumed
                ? "Checkout blocker: under investigation"
                : "Checkout task blocked: help needed"}
            </p>
          )}
          {delegated && (
            <p className="walk-handoff">
              Mohammed reassigned checkout: Mehdi → Saad. Notes preserved.
            </p>
          )}
          <div className="walk-tasks">
            {personal.map((task) => (
              <article className="walk-task" key={task.title}>
                <div>
                  <h3>{task.title}</h3>
                  <p>{task.owner}</p>
                </div>
                <span
                  className={
                    task.status === "Done"
                      ? "finished"
                      : task.status === "Blocked"
                        ? "blocked"
                        : ""
                  }
                >
                  {task.status}
                </span>
              </article>
            ))}
          </div>
          {personal.length === 0 && (
            <p className="walk-explain">
              No task is currently assigned to you.
              {viewer === "Mehdi" && delegated
                ? " Your checkout task and notes are now with Saad."
                : ""}
            </p>
          )}
          {sceneIndex === 2 && (
            <p className="walk-pending">
              “Stop incomplete orders” is still a proposal. It is not on
              anyone’s task list yet.
            </p>
          )}
        </section>
      </div>
      <div className="walk-controls">
        <button
          className="walk-back"
          disabled={sceneIndex === 0}
          onClick={() => go(sceneIndex - 1)}
        >
          ← Previous
        </button>
        <p>
          {explore
            ? "Viewing the same sample work through another member’s eyes."
            : `Acting as ${scene.actor}. The next workspace opens automatically.`}
        </p>
        <button
          className="button"
          onClick={advance}
          disabled={sceneIndex === 5 && !canDelegate}
        >
          {scene.action}
          <span>{sceneIndex === 7 ? "↺" : "→"}</span>
        </button>
      </div>
      <div className="walk-explore">
        <button
          className="text-button"
          onClick={() => {
            setViewAs(scene.actor);
            setExplore(!explore);
          }}
        >
          {explore
            ? "Return to guided view"
            : "Explore each member’s workspace"}
        </button>
        {explore && (
          <div role="group" aria-label="View as a team member">
            {members.map((member) => (
              <button
                key={member.name}
                aria-pressed={viewAs === member.name}
                onClick={() => setViewAs(member.name)}
              >
                {member.name}
                <small>{member.role}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      {showNotes && (
        <aside className="demo-notes">
          <span>WHAT TO SAY / SCENE {sceneIndex + 1}</span>
          <p>“{scene.say}”</p>
        </aside>
      )}
      <p className="walk-disclaimer">
        Illustrative prototype. Work, AI output, and checks are simulated.
        Previous rewinds this sample story; Start again resets it. No live
        GitHub, AI, or task changes.
      </p>
    </div>
  );
}
