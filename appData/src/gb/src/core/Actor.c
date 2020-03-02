#include "Actor.h"
#include "Sprite.h"
#include "Scroll.h"
#include "GameTime.h"
#include "BankManager.h"

void UpdateActors_b();
void MoveActors_b();
void ActivateActor_b(UBYTE i);
void ActivateActorColumn_b(UBYTE tx_a, UBYTE ty_a);
void DeactivateActor_b(UBYTE i);

Actor actors[MAX_ACTORS];
UBYTE actors_active[MAX_ACTIVE_ACTORS];
UBYTE actors_active_size = 0;

Pos map_next_pos;
Vector2D map_next_dir;
UBYTE map_next_sprite = 0;

void UpdateActors()
{
    PUSH_BANK(ACTOR_BANK);
    UpdateActors_b();
    POP_BANK;
}

void MoveActors()
{
    PUSH_BANK(ACTOR_BANK);
    MoveActors_b();
    POP_BANK;
}

void ActivateActor(UBYTE i)
{
    PUSH_BANK(ACTOR_BANK);
    ActivateActor_b(i);
    POP_BANK;
}

void ActivateActorColumn(UBYTE tx_a, UBYTE ty_a)
{
    PUSH_BANK(ACTOR_BANK);
    ActivateActorColumn_b(tx_a, ty_a);
    POP_BANK;
}

void DeactivateActor(UBYTE i)
{
    PUSH_BANK(ACTOR_BANK);
    DeactivateActor_b(i);
    POP_BANK;
}

UBYTE ActorAtTile(UBYTE tx_a, UBYTE ty_a)
{
    UBYTE i;

    for (i = actors_active_size - 1; i != 0; i--)
    {
        UBYTE a = actors_active[i];
        UBYTE tx_b, ty_b;

        tx_b = DIV_8(actors[a].pos.x);
        ty_b = DIV_8(actors[a].pos.y);

        if ((ty_a == ty_b) &&
            (tx_a == tx_b || tx_a == tx_b + 1))
        {
            return a;
        }
    }
    return 0;
}

UBYTE ActorOverlapsActorTile(UBYTE tx_a, UBYTE ty_a)
{
    UBYTE i;

    for (i = actors_active_size - 1; i != 0; i--)
    {
        UBYTE a = actors_active[i];
        UBYTE tx_b, ty_b;

        tx_b = DIV_8(actors[a].pos.x);
        ty_b = DIV_8(actors[a].pos.y);

        if ((ty_a == ty_b || ty_a == ty_b - 1) &&
            (tx_a == tx_b || tx_a == tx_b + 1 || tx_a + 1 == tx_b))
        {
            return a;
        }
    }
    return 0;
}

UBYTE ActorOverlapsPlayer()
{
    UBYTE i;

    for (i = actors_active_size - 1; i != 0; i--)
    {
        UBYTE a = actors_active[i];
        if (
            (actors[0].pos.x + 16 >= actors[a].pos.x) &&
            (actors[0].pos.x <= actors[a].pos.x + 16) &&
            (actors[0].pos.y + 8 >= actors[a].pos.y) &&
            (actors[0].pos.y <= actors[a].pos.y + 8))
        {
            return a;
        }
    }
    return 0;
}
