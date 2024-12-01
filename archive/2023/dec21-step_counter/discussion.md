# Part 2 Discussion Points
> _General approach:_ With an exact number of steps, only ~1/2 of the accessible plots will be reachable, as all paths to an individual plot take either an _even_ number or _odd_ number of steps to reach.
> The general area reachable to _up-down-left-right_ movement will be rhombus-shaped, which will include & exclude triangle-shaped "corners" of the map.
> By identifying connected maps as _even-parity_ or _odd-parity_ maps, every complete map included in the reachable area should add either the _even-step_ accessible plots or the _odd-step_ accessible plots, respectively.
> For example, `(65,0)` should take an odd number of steps from the start `(65,65)` in the original map, but the equivalent plot in an adjacent map will take an even number of steps to reach.

For a _n=3_ radius set of maps, the _even-_ and _odd-parity_ maps are arranged as below:
```
   ,0,        Legend:
 ,0 E 0,        0 O   -- partially- or fully-accessible odd-parity maps
0 E O E 0
 '0 E 0'        ,' E  -- partially- or fully-accessible even-parity maps
   '0'
```

To calculate the number of reachable points, use the following formula:
```
  reachable = [ n^2 * odd-maps - n * odd-corners ] + [ (n-1)^2 * even-maps + (n-1) * even-corners ]
```

### On determining accessible plots
In part 1, we can use flood fill to identify the plots accessible from the center with exactly `64` steps (cf. next section).
Any plot accessible with an even number of steps less than or equal to 64 will also be reachable.

In part 2, we now make use of the "corners" and the "gaps" which create a network of "straight-line" paths to the edge of any partially-reachable map.
For a 2x2 grid of maps along the top-right edge of the "reachability rhombus", the network looks like:
```
┌───┬───┐┌───┬───┐
|OO╱|╲  ||  ╱|╲  |
|O╱O|O╲ || ╱ | ╲ |       Legend:
├───┼───┤├───┼───┤
|O╲O|O╱O||E╲ | ╱ |        O    reachable odd-parity plot
|OO╲|╱OO||EE╲|╱  |
└───┴───┘└───┴───┘        E    reachable even-parity plot
┌───┬───┐┌───┬───┐
|EE╱|╲EE||OO╱|╲  |
|E╱E|E╲E||O╱O|O╲ |        "nearest corner" = corner closest to start (bottom-left in this example)
├───┼───┼┼───┼───┤
|E╲E|E╱E||O╲O|O╱O|
|EE╲|╱EE||OO╲|╱OO|
└───┴───┘└───┴───┘
```

For a plot to be "reachable", it has to be within the range of steps from the starting point.
To be "accessible", a path must exist which connects a plot to one of the reachable gap lines.
To be both "accessible" and "reachable", the shortest path from the nearest corner to a plot in a partially-reachable map must be less than or equal to the remaining steps available (`65` for even-parity maps, `131` for odd-parity maps).

### Flood fill algorithm
> _Key idea (branch-first search):_ Start with an array of plots reachable with _n_ steps.
> For each plot, collect the possible plots one can move to and filter out those that are already reachable.
> Assign the remaining possible plots _n + 1_ steps and use them for the next iteration.

Pseudo-code for the above:
```
function gardenWalk ( allPlots, maxSteps ):
  nSteps = 0
  allPlots['start']['steps'] = nSteps
  nPlots = [ allPlots['start'] ]
  reached = [ ...nPlots ]
  while nSteps++ <= maxSteps:
    next = [ ...walk(plot) for plot in nPlots if plot not in reached ]
    for plot in next:
      plot['steps'] = nSteps
    reached.extend(next)
    nPlots = next

  return reached
```

For part 1, the single starting point is in the center.
For part 2, each corner also represents a starting point.
To be accessible and reachable, the maxSteps from the corner will be `65`.
However, since there is a gap, using `maxSteps = 64` should be sufficient.

One can futher divide `reached` array into _even-_ and _odd-numbered_ paths (using `plot['steps'] % 2`).