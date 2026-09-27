import { planObjective } from "./planner";
import { planMiddleLayer } from "./middle-layer";
import { planLastLayer } from "./last-layer";
import { effectiveStageFor } from "./objective";
self.onmessage = (event) => {
  try {
    const stage = effectiveStageFor(event.data.state, event.data.stage);
    self.postMessage({
      moves:
        stage >= 3
          ? planLastLayer(event.data.state, stage)
          : stage === 2
            ? planMiddleLayer(
                event.data.state,
                event.data.ids[0],
                event.data.ids.slice(1),
              )
            : planObjective(event.data.state, event.data.ids),
    });
  } catch {
    self.postMessage({ moves: null });
  }
};
