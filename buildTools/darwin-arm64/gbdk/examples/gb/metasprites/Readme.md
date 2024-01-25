
Metasprite Example
==================

Demonstrates using the metasprite features to move and animate a large sprite.

* Press A button to show / hide the metasprite
* Press B button to cycle through the metasprite animations
* Press SELECT button to cycle the metasprite through Normal / Flip-Y / Flip-XY / Flip-X
* Up / Down / Left / Right to move the metasprite

In this example the move_metasprite...() functions are called every
frame to simplify the example code, regardless of whether the updates
are needed or not.

In a real game it would be better to only call them if something changed
(such as movement or rotation) since that reduces CPU usage on frames where
the updates aren't required.


