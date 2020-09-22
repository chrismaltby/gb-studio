
#include "ParentedActors.h"
#include "Actor.h"
#include "DataManager.h"
#include "data_ptrs.h"

void PositionParentedActors() {
	  // Linked sprite magic
  for (UBYTE i = 1; i != actors_len; ++i) // loop through the actors
  {
	const UBYTE parent_actor = actors[i].parent_actor;
	if (parent_actor != i) {
		// quick and dirty check if parent actor is active
		if (actors[i].sprite_index == 0 && actors[parent_actor].sprite_index != 0) {
			ActivateActor(i);
		}
		actors[i].pos.x = actors[parent_actor].pos.x + actors[i].start_pos.x;
		actors[i].pos.y = actors[parent_actor].pos.y + actors[i].start_pos.y;
		actors[i].dir.x = actors[parent_actor].dir.x;
		actors[i].dir.y = actors[parent_actor].dir.y;
		actors[i].frame = actors[i].frames_len == actors[parent_actor].frames_len ? actors[parent_actor].frame : actors[i].frame;
		actors[i].enabled = parent_actor != 0 ? actors[parent_actor].enabled : TRUE;
		actors[i].rerender = actors[parent_actor].rerender;
	}
  }
}