# Feature: Interactive 3D Rubik's Cube Beginner Tutor

Build a web application that teaches a beginner how to solve a 3x3 Rubik's Cube using the 7-step beginner method demonstrated in Cuby's tutorial:

https://www.youtube.com/watch?v=GyY0OxDk5lI

This is NOT a generic Rubik's Cube solver.

This is an interactive spatial learning tool.

Its main purpose is to help a beginner understand:

- which physical piece they are currently solving
- where that piece is now
- where it needs to go
- how each cube movement changes its position and orientation
- which already-solved pieces must be preserved
- why a movement or algorithm works

The 3D cube is the primary teaching surface.

Text, notation and controls support the cube rather than replacing it.

---

# 1. Core learning principle

At every moment, reduce the visual information to what matters for the current objective.

The learner should NOT have to visually parse all 54 stickers.

Relevant pieces remain colored.

Irrelevant pieces remain physically visible but become translucent neutral gray.

This allows the learner to understand the geometry of the complete cube while directing attention toward the pieces involved in the current task.

Conceptually:

RELEVANT
→ normal Rubik colors

TARGET
→ normal colors + stronger visual emphasis

SOLVED / PROTECTED
→ normal colors, but visually distinguishable from current target

DESTINATION
→ subtle ghost / outline / positional marker

MOVING LAYER
→ translucent, but visible during movement

IRRELEVANT
→ translucent neutral gray

Never completely remove irrelevant pieces from the scene.

The learner must retain the spatial context of a complete 3x3 cube.

---

# 2. Visual style

The cube should look more like a clean SVG/vector illustration than a photorealistic Rubik's Cube.

Desired characteristics:

- clean geometry
- slightly rounded cubies
- crisp outlines
- simple materials
- minimal reflections
- no photorealism
- no dramatic lighting
- soft shadows only when useful for depth
- strong readability
- educational-diagram aesthetic

Inactive cubies should resemble translucent gray acrylic/glass blocks, but remain visually simple.

Colored stickers should be flat and easy to distinguish.

Avoid:

- excessive gloss
- realistic plastic texture
- strong reflections
- cinematic lighting
- excessive glow
- visual effects that compete with the educational information

The 3D rendering should feel close to an interactive vector diagram.

---

# 3. Technology

Use:

- React
- TypeScript
- Three.js
- React Three Fiber
- @react-three/drei where useful
- Vite

Keep these concerns separate:

src/
  cube/
    model/
    moves/
    scramble/
    history/
    selectors/
    validation/

  tutorial/
    engine/
    steps/
    cases/
    algorithms/
    guidance/

  rendering/
    Cube3D/
    materials/
    highlighting/
    camera/

  components/
    Tutorial/
    MovePlayer/
    AlgorithmPlayer/
    Controls/

  app/

Three.js is ONLY the rendering and interaction layer.

The logical cube model is the source of truth.

---

# 4. Logical cube model

Represent all physical pieces independently.

Track:

- piece ID
- piece type
- original identity
- current position
- current orientation
- sticker colors
- solved position
- solved orientation

Piece types:

- center
- edge
- corner

A physical piece keeps the same identity throughout the entire session.

For example:

WHITE_RED_EDGE

remains WHITE_RED_EDGE regardless of where it moves.

This is essential because the tutorial must be able to follow the same physical piece through several rotations.

---

# 5. Supported notation

Support at minimum:

U U' U2
D D' D2
L L' L2
R R' R2
F F' F2
B B' B2

A move modifies CubeState.

Three.js then animates the transition.

Never determine CubeState by reading Three.js transforms.

---

# 6. Initial experience

When the application opens:

show a solved 3x3 cube.

The initial orientation must use WHITE as the primary reference face.

The application should establish a consistent tutorial orientation before teaching begins.

Provide:

SCRAMBLE

When pressed:

1. Generate a valid scramble.
2. Animate the scramble.
3. Store the scramble sequence.
4. Finish in the exact corresponding logical state.
5. Enable "Start tutorial".

Also support predefined/seeded scrambles for testing.

---

# 7. Seven tutorial stages

The application teaches exactly this beginner progression:

1. White cross
2. White corners
3. Middle layer
4. Yellow cross
5. Yellow edges
6. Last-layer permutation
7. Final orientation / solved cube

The exact educational content and algorithms will be refined from Cuby's tutorial.

Do NOT invent missing Cuby content.

Use:

TODO(CUBY_CONTENT)

for content that has not yet been verified.

---

# 8. White remains the primary spatial reference

During the first stages, WHITE must remain the primary visual reference.

This is important.

Do not arbitrarily rotate the cube so that another color becomes the apparent primary face.

When showing progress toward:

- white cross
- white corners
- first layer

the learner should retain a stable mental model of where the white face is.

Camera changes must preserve this spatial continuity.

The camera may orbit around the cube, but the cube's logical orientation must remain stable.

Camera position does NOT redefine U/F/R/etc.

---

# 9. Two synchronized perspectives

Support an optional dual-view mode.

This is NOT two unrelated camera angles.

The intention is to simulate two people looking at the same cube sitting on a table:

PERSON A
views the cube from the front/top.

PERSON B
views the SAME cube from the opposite side/top.

Both cameras should therefore:

- have approximately the same elevation
- have approximately the same distance
- point toward the same cube center
- differ mainly by ~180 degrees around the vertical axis

Conceptually:

        Camera B
           ↓

       [ CUBE ]

           ↑
        Camera A

Both views display the exact same CubeState and animation.

If a layer turns in one view, the same physical movement must appear simultaneously from the opposite perspective.

---

# 10. Dual view must be optional

Some learners may find two simultaneous views useful.

Others may find them confusing.

Provide a control:

Dual perspective
[ ON / OFF ]

When OFF:

use one large primary cube.

When ON:

show:

Primary view
Opposite view

The primary view remains dominant.

The secondary view exists only as a spatial aid.

Do not introduce a different logical orientation for the second view.

It is another camera observing the same physical cube.

---

# 11. Camera controls

Allow:

- orbit
- zoom within reasonable limits
- reset camera
- focus target piece
- enable/disable opposite perspective

Avoid constant automatic camera movement.

Do not rotate the camera during an algorithm unless explicitly requested.

Spatial continuity is more important than cinematic presentation.

---

# 12. Tutorial stages are bounded

A critical product rule:

The controls should solve ONLY THE CURRENT TUTORIAL STAGE.

They should NOT automatically continue solving the entire cube.

Example:

Current stage:

STEP 1 — WHITE CROSS

The tutorial engine may guide and demonstrate movements until the white cross is complete.

Once the white cross is complete:

STOP.

Do not automatically begin solving white corners.

Show that the stage objective has been reached.

The learner explicitly chooses to continue to Step 2.

The same rule applies to every stage.

---

# 13. Stage-local history

Each tutorial stage has its own movement history.

Example:

Step 1 begins with CubeState S0.

The learner performs:

M1
M2
M3
M4

History:

S0
↓ M1
S1
↓ M2
S2
↓ M3
S3
↓ M4
S4

The learner must be able to move backward:

S4 → S3 → S2 → S1 → S0

and forward again.

This behaves like undo/redo.

The history boundary is the beginning of the current tutorial stage.

UNDO must NOT accidentally undo the scramble or previous completed stages.

---

# 14. Undo / Redo controls

Provide explicit controls:

|←
←
PLAY / PAUSE
→
→|

Semantics:

|←
Beginning of current demonstration/objective

←
Previous movement

→
Next movement

→|
End of current demonstration/objective

Additionally provide:

UNDO
REDO

when the learner manually performs moves.

All navigation must modify the real logical CubeState.

Do not merely reverse an animation.

---

# 15. Scrubbing through movement history

When useful, provide a timeline:

START ─────●──────── END

Dragging the timeline must reconstruct the exact corresponding CubeState.

Example:

R U R' U'

positions:

0  Initial state
1  after R
2  after U
3  after R'
4  after U'

Moving from position 4 back to 1 must produce the exact state after R.

Cube state, highlighted pieces, instructional text and both cameras must remain synchronized.

---

# 16. Two different teaching modes

Do NOT treat all seven stages as algorithm memorization.

There are two teaching modes.

## MODE A — Spatial Guided Learning

Primarily:

Step 1 — White Cross
Step 2 — White Corners

These stages teach reasoning.

The system inspects CubeState and selects a small objective.

Example:

"Find the white-red edge."

Then:

"This edge belongs between the white center and the red center."

Then:

"Move it to a position where it can be inserted."

The learner should visually understand what is happening.

Algorithms should NOT dominate these stages.

---

# 17. White cross teaching

The white cross is especially important.

Treat it as four smaller objectives:

0/4 white edges
1/4
2/4
3/4
4/4

For every target edge:

identify:

- the white edge
- its second color
- corresponding side center
- target position
- already solved cross edges

Example:

TARGET
white-red edge

REFERENCE CENTERS
white center
red center

PROTECTED
already solved white-blue edge

DESTINATION
position between white and red centers

Everything else becomes translucent gray.

---

# 18. Cross correctness

A white cross is NOT complete merely because four white stickers form a cross.

Each edge must also align with its lateral center.

Validate actual piece permutation and orientation.

Correct:

white-red edge
between white center and red center

white-blue edge
between white center and blue center

etc.

---

# 19. Protecting solved pieces

This is a major teaching concept.

Once an edge or corner is correctly solved, the learner should understand that later moves can disturb it.

Visually distinguish:

CURRENT TARGET

from:

ALREADY SOLVED / PROTECTED

Teach patterns such as:

1. temporarily move a solved piece
2. make space for another piece
3. insert the target
4. restore the protected piece

The learner should see why the already-solved piece returns to its correct location.

---

# 20. White corners

Use the same spatial-learning philosophy.

For each corner:

identify:

- target corner
- its three colors
- corresponding three centers
- destination
- already solved first-layer pieces

Show only those relevant colors.

Everything else remains translucent.

Teach the learner to recognize where a corner belongs before showing movements.

---

# 21. Algorithm-based stages

Later stages can use repeatable algorithms.

When an algorithm is appropriate, display it clearly.

Example:

R   U   R'   U'
        ↑
     current

The exact algorithms must live in tutorial configuration.

Never hardcode algorithms directly inside React components.

---

# 22. Algorithm Player

Create a reusable AlgorithmPlayer.

It must support:

- previous movement
- next movement
- play
- pause
- restart
- jump to end
- timeline scrubbing
- adjustable animation speed

Example:

R  U  R'  U'

If current index = 2:

R  U  [R']  U'

The cube must visually represent exactly that state.

---

# 23. Guided Move Player

Create a separate abstraction from AlgorithmPlayer:

GuidedMovePlayer

This is important for Steps 1 and 2.

A guided sequence may be generated dynamically from CubeState.

It can contain:

- movement
- explanation
- target piece
- relevant pieces
- protected pieces
- destination
- camera suggestion

Example:

{
  move: "D",
  explanation:
    "Move the target edge away temporarily so we can align it with the red center.",
  targetPiece: WHITE_RED_EDGE,
  protectedPieces: [...]
}

This allows spatial teaching without pretending that the learner is memorizing an algorithm.

---

# 24. Visual attention model

Every piece can have one of these visual roles:

IRRELEVANT
RELATED
TARGET
PROTECTED
DESTINATION
MOVING

Suggested hierarchy:

TARGET
100% color
strong outline

PROTECTED
100% color
subtle secondary outline

RELATED
100% color
normal outline

MOVING
translucent unless otherwise relevant

IRRELEVANT
neutral gray
high transparency

DESTINATION
ghost / outline marker

Do not rely solely on opacity or color.

Use shape/outline differences where appropriate.

---

# 25. Important visual behavior during turns

Suppose only one target edge is colored.

If the learner performs R:

do NOT make the other eight pieces of the R layer disappear.

During the movement:

- target remains strongly highlighted
- relevant pieces retain color
- other cubies in the rotating layer remain translucent
- entire layer visibly rotates

The learner must understand:

"I am following this piece"

AND simultaneously:

"The whole right layer is rotating."

---

# 26. Piece trajectory

The system must allow the learner to follow a physical piece through several movements.

For example:

WHITE_RED_EDGE

position A
↓
R
↓
position B
↓
U
↓
position C
↓
R'
↓
position D

Its identity never changes.

Optionally allow a subtle trajectory aid, but avoid drawing large distracting paths through the cube.

The physical movement itself should communicate most of the trajectory.

---

# 27. Destination visualization

When placing a piece, indicate where it belongs.

Use a subtle:

- ghost cubie
- outline
- target frame
- positional marker

Do not replace the actual cube geometry.

Example:

CURRENT
white-red edge highlighted

DESTINATION
ghost position between white and red centers

The learner should visually connect:

piece
→ movement
→ destination

---

# 28. Tutorial engine

Do not implement the tutorial as a fixed slideshow.

The engine must inspect CubeState.

Example:

interface TutorialStage {
  id: string;
  title: string;

  isComplete(state: CubeState): boolean;

  getNextObjective(
    state: CubeState
  ): TutorialObjective | null;
}

interface TutorialObjective {
  id: string;

  targetPieces: PieceId[];
  relevantPieces: PieceId[];
  protectedPieces: PieceId[];

  destination?: PiecePosition;

  getGuidance(
    state: CubeState
  ): GuidedInstruction[];
}

The same stage must work from different valid scrambles.

---

# 29. Tutorial content architecture

Keep content separate from logic and rendering.

Example:

tutorial/
  cuby-beginner/
    step-1-white-cross.ts
    step-2-white-corners.ts
    step-3-middle-layer.ts
    step-4-yellow-cross.ts
    step-5-yellow-edges.ts
    step-6-permutation.ts
    step-7-final.ts

Content can define:

- explanation
- cases
- recognition rules
- algorithms
- tips
- protected pieces
- visual focus

---

# 30. Primary UI hierarchy

Do not build a dashboard-heavy interface.

The cube should dominate the screen.

Conceptually:

-----------------------------------

STEP 1 OF 7
WHITE CROSS

Current objective:
Place the white-red edge

-----------------------------------

        MAIN CUBE

     [optional opposite
          perspective]

-----------------------------------

Movement / algorithm controls

←     ▶     →

-----------------------------------

Short explanation

-----------------------------------

Secondary settings should remain secondary.

---

# 31. Avoid excessive interface chrome

Do not create many cards around the cube.

Avoid:

- excessive sidebars
- dashboards
- statistics
- redundant miniature cubes
- unnecessary progress widgets
- decorative controls

The learner's attention should remain on:

1. cube
2. current target
3. current movement
4. explanation

---

# 32. Stage progress

Show simple progress when appropriate.

For example:

WHITE CROSS

● ● ○ ○

2 / 4 edges

For white corners:

● ● ● ○

3 / 4 corners

Do not confuse stage progress with movement history.

They are separate concepts.

---

# 33. Manual interaction

The architecture must support manual face turns.

Ideally implement them.

Every manual turn must go through the logical cube engine.

Never directly rotate Three.js objects without producing a logical move.

Manual actions should participate in undo/redo.

---

# 34. Correct vs incorrect learner moves

When the learner makes a manual move:

do not immediately block every move that is not the suggested move.

Allow exploration when possible.

The tutorial engine should re-evaluate CubeState.

It should be able to determine:

- objective still valid
- target moved
- protected piece disturbed
- objective completed
- learner needs recovery guidance

This is important.

The experience should teach the cube, not force the learner through a rigid animation.

---

# 35. Stage reset

Provide:

RESET CURRENT STAGE

This returns to the CubeState captured when the current stage began.

It must NOT:

- remove the original scramble
- reset the whole cube
- alter previous completed stages

Example:

Step 3 begins at state S.

After experimenting with 14 moves:

Reset Step

returns exactly to S.

---

# 36. Debug tools

Development-only debug panel:

- solved state
- generate scramble
- predefined scramble
- enter scramble notation
- execute move
- execute sequence
- undo
- redo
- select piece by ID
- highlight target
- mark protected piece
- mute irrelevant pieces
- toggle transparency
- show piece IDs
- inspect piece orientation
- inspect piece position
- jump to tutorial stage
- change animation speed
- toggle dual cameras
- reset camera

This panel is essential for validating tutorial behavior.

---

# 37. Tests

Cube correctness takes priority over UI polish.

Unit test:

R + R' = identity

U + U' = identity

R R R R = identity

R2 R2 = identity

scramble + inverse(scramble) = solved

Test:

- edge permutation
- edge orientation
- corner permutation
- corner orientation
- stage completion
- target selectors
- protected-piece selectors
- history
- undo
- redo
- stage reset

Three.js must not be necessary to test cube logic.

---

# 38. Animation synchronization

Logical state and animation must never diverge.

Use an explicit movement lifecycle.

Example:

State A
↓
request move M
↓
calculate State B
↓
animate A → B
↓
commit B
↓
ready

Handle rapid navigation safely.

If the learner presses:

NEXT
NEXT
BACK
NEXT

rapidly, CubeState must remain correct.

---

# 39. Dual-camera synchronization

Both views observe the same animated cube.

Do NOT maintain two cube instances with independent logical state.

Prefer:

one logical CubeState
one movement/animation model
two synchronized render views/cameras

Both must display the exact same moment in the animation.

---

# 40. First complete implementation target

Build enough functionality to demonstrate the actual product concept, not just a rotating cube.

Required:

1. Correct logical 3x3 model.
2. SVG-like/vector-inspired Three.js rendering.
3. Transparent inactive cubies.
4. Colored relevant pieces.
5. Animated turns.
6. Scramble.
7. Stable white-oriented tutorial reference.
8. Main camera.
9. Optional opposite camera.
10. Stage-local history.
11. Undo/redo.
12. Reset current stage.
13. GuidedMovePlayer.
14. AlgorithmPlayer.
15. White-cross stage.
16. At least one white-corner teaching case.
17. One algorithmic later-stage example.
18. Target highlighting.
19. Protected-piece highlighting.
20. Destination visualization.
21. Unit tests.

---

# 41. Critical demonstration scenario

The following must work end-to-end.

Start application.

A solved cube appears.

WHITE is established as the primary tutorial reference.

Press:

SCRAMBLE

The cube scrambles.

Press:

START TUTORIAL

Display:

STEP 1 OF 7
WHITE CROSS

The system inspects CubeState.

It chooses one unsolved white edge.

Example:

WHITE-RED EDGE

The cube changes visual focus.

Colored:

- white-red edge
- white center
- red center
- already solved white-cross edges

Translucent gray:

- everything else

A destination marker shows where WHITE_RED_EDGE belongs.

The learner can rotate the camera.

If Dual Perspective is enabled:

a second synchronized view appears from approximately 180° around the cube at the same elevation.

The learner follows the suggested movement.

The target piece physically moves.

The entire affected layer remains visible while rotating.

After the movement:

the tutorial explains the new spatial relationship.

The learner presses BACK.

The cube returns to the exact previous state.

The learner presses FORWARD.

The movement occurs again.

Eventually:

WHITE_RED_EDGE reaches its correct position.

The system marks it as protected.

It selects another white edge.

Continue until:

4 / 4 WHITE EDGES

The white cross is geometrically correct AND every side color matches its center.

STOP.

Do NOT automatically solve white corners.

Show:

WHITE CROSS COMPLETE

The learner explicitly selects:

CONTINUE TO STEP 2

---

# 42. Product principle

For every feature, ask:

"Does this help the learner understand what happened to the physical pieces?"

Prefer spatial understanding over memorization.

Prefer visual focus over showing the entire cube at full visual weight.

Prefer reversible exploration over passive animation.

Prefer one clear teaching objective over many simultaneous instructions.

The learner should eventually be able to look at a physical cube and reason:

"This is the piece I need."

"It belongs there because these colors match those centers."

"This turn moves it here."

"This solved piece will be displaced."

"I can restore it afterward."

"This algorithm is moving these specific pieces in this specific way."

The goal is not merely to finish a Rubik's Cube.

The goal is to understand enough of the cube's spatial behavior to reproduce the beginner method on a physical 3x3 cube without depending on the application.

