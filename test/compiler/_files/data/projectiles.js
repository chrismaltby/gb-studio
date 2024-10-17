export const projectileStateTest = {
  scene: {
    symbol: "test_scene",
    projectiles: [
      {
        spriteSheetId: "sprite1",
        spriteStateId: "Explode",
        actorId: "$self$",
        x: 0,
        y: 0,
        otherActorId: "$self$",
        direction: "right",
        angle: 0,
        angleVariable: "L0",
        directionType: "direction",
        initialOffset: 0,
        speed: 2,
        animSpeed: 15,
        lifeTime: 1,
        loopAnim: true,
        destroyOnHit: true,
        collisionGroup: "3",
        collisionMask: ["1"],
      },
      {
        spriteSheetId: "sprite1",
        spriteStateId: "State2",
        actorId: "$self$",
        x: 0,
        y: 0,
        otherActorId: "$self$",
        direction: "right",
        angle: 0,
        angleVariable: "L0",
        directionType: "direction",
        initialOffset: 0,
        speed: 2,
        animSpeed: 15,
        lifeTime: 1,
        loopAnim: true,
        destroyOnHit: true,
        collisionGroup: "3",
        collisionMask: ["1"],
      },
    ],
  },

  sprites: [
    {
      id: "one",
    },
    {
      id: "sprite1",
      name: "bullet",
      symbol: "sprite_bullet",
      numFrames: 1,
      type: "static",
      filename: "bullet.png",
      inode: "89675901",
      checksum: "20f72d8c2befb3e03da3f64a307172a5d95853d1",
      width: 16,
      height: 16,
      states: [
        {
          id: "41704cc3-5282-4245-b276-372c1d14ccf8",
          name: "",
          animationType: "fixed",
          flipLeft: false,
          animations: [
            {
              id: "b936011a-76ba-4991-8e63-ada6c1a4d920",
              frames: [
                {
                  id: "83e39af5-35c8-4261-9deb-ebd1e4130c9a",
                  tiles: [
                    {
                      id: "c92a6650-fa5c-4616-9bac-af0ea12b43b8",
                      x: 0,
                      y: 0,
                      sliceX: 0,
                      sliceY: 0,
                      flipX: false,
                      flipY: false,
                      palette: 0,
                      paletteIndex: 0,
                      objPalette: "OBP0",
                      priority: false,
                    },
                    {
                      id: "55719445-045c-4a3d-ae20-36594a5dd190",
                      x: 8,
                      y: 0,
                      sliceX: 8,
                      sliceY: 0,
                      flipX: false,
                      flipY: false,
                      palette: 0,
                      paletteIndex: 0,
                      objPalette: "OBP0",
                      priority: false,
                    },
                  ],
                },
              ],
            },
            {
              id: "99c146a9-604c-48f0-ab71-87aab591f499",
              frames: [
                { id: "a85e7faf-f0c8-4e59-8fbc-3274a8d29b9f", tiles: [] },
              ],
            },
            {
              id: "35c7c1b6-eae4-4775-b332-2ffd78eb312d",
              frames: [
                { id: "ad468e20-fdef-446e-a76b-45535451c5a8", tiles: [] },
              ],
            },
            {
              id: "6b1aaa4e-90cd-42ad-9e17-9bd46733173f",
              frames: [
                { id: "c48572f4-c2a6-42cf-807e-ff5124f042e4", tiles: [] },
              ],
            },
            {
              id: "4c9a02ed-f9aa-460b-b2dd-7798eb38724d",
              frames: [
                { id: "fef61676-6f7f-4d01-96ac-cc2dcf8a0cb6", tiles: [] },
              ],
            },
            {
              id: "d5d4a46e-01e9-4a11-ad9b-0dc48527155c",
              frames: [
                { id: "406ff1ce-5e94-4169-84ea-7ccb99d5561f", tiles: [] },
              ],
            },
            {
              id: "5e362ed3-8f7e-41aa-9c01-284f0f3aeff5",
              frames: [
                { id: "1f62fc60-e265-4931-af4a-342f6d665438", tiles: [] },
              ],
            },
            {
              id: "b8cc3288-6fca-480d-a57c-b2354b54646e",
              frames: [
                { id: "2fa7db3f-1b6e-47e3-979e-52a49a59ec1f", tiles: [] },
              ],
            },
          ],
        },
        {
          id: "b6225e5d-311d-4513-8ad7-b0c9db93910e",
          name: "State2",
          animations: [
            {
              id: "86d64e4d-3cf5-49ee-a194-0cac840baccd",
              frames: [
                {
                  id: "1b5138d5-ba4a-4291-ad6f-acdebeb5672e",
                  tiles: [
                    {
                      id: "15eaad29-bebd-495c-adef-63dd6d941453",
                      x: 1,
                      y: 4,
                      sliceX: 0,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                    {
                      id: "150b71ff-7656-4103-8159-9a9441eeb442",
                      x: 4,
                      y: -2,
                      sliceX: 0,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                  ],
                },
              ],
            },
            {
              id: "ed5d3a78-4fde-4abb-afd5-c29a28aee413",
              frames: [
                { id: "8660b18a-6c8a-4136-b8bc-cc4aa6287fe6", tiles: [] },
              ],
            },
            {
              id: "2d3c1487-0172-4fe1-969c-d1c46a9d33a6",
              frames: [
                { id: "f1edae6c-3cfe-4a6f-80aa-22367d6a73c4", tiles: [] },
              ],
            },
            {
              id: "72aa6924-9f41-4dfd-a40a-443afe371229",
              frames: [
                { id: "98fdb748-3bb0-4a3e-8ded-318dc4844e45", tiles: [] },
              ],
            },
            {
              id: "38b64ee6-efb7-4c72-bc84-1b58bce1f9d1",
              frames: [
                { id: "0a97f854-d983-4911-86f3-ee23dfd2bca2", tiles: [] },
              ],
            },
            {
              id: "5f9c34c1-8633-44a6-801a-105ae8bf6af4",
              frames: [
                { id: "90da7f12-471e-4cce-be4b-94fbc04c88eb", tiles: [] },
              ],
            },
            {
              id: "b862e1d1-882c-4d49-b3cf-71a7f74187bb",
              frames: [
                { id: "1fe00311-dd04-4be8-aada-81caa1345025", tiles: [] },
              ],
            },
            {
              id: "d702fc71-3f3f-4c50-8047-6f4c23aba6c1",
              frames: [
                { id: "73d0fb71-c36b-4206-9762-ed8f8eff615b", tiles: [] },
              ],
            },
          ],
          animationType: "fixed",
          flipLeft: true,
        },
        {
          id: "180bc4fb-7af0-42f5-882d-bec0b780e5c4",
          name: "Open",
          animations: [
            {
              id: "028306d6-0c56-4cc8-becc-db8b6e131051",
              frames: [
                {
                  id: "7219ae80-dfaa-45d2-8858-2be093a04875",
                  tiles: [
                    {
                      id: "768f87f9-488b-48b1-947b-f1ff88d66e1b",
                      x: -3,
                      y: -1,
                      sliceX: 0,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                  ],
                },
                {
                  id: "60ca77f7-c63c-4dae-b86c-ecb57662ae84",
                  tiles: [
                    {
                      id: "52ea4eb8-c725-46c2-8c00-46bd5879d360",
                      x: 5,
                      y: 0,
                      sliceX: 8,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                  ],
                },
                {
                  id: "273b9dc2-5495-463f-9edb-599e9275e8d6",
                  tiles: [
                    {
                      id: "73287941-52bd-496f-9c17-6da4cbc4b4ba",
                      x: 0,
                      y: 0,
                      sliceX: 0,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                    {
                      id: "80517638-4f12-4981-9726-49d2f48c5164",
                      x: 9,
                      y: 0,
                      sliceX: 8,
                      sliceY: 0,
                      palette: 0,
                      flipX: false,
                      flipY: false,
                      objPalette: "OBP0",
                      paletteIndex: 0,
                      priority: false,
                    },
                  ],
                },
              ],
            },
            {
              id: "4f683ce4-f9f0-48c3-9dc1-e510d790b8ef",
              frames: [
                { id: "febb6319-5f33-4c8e-b483-11fc015b3453", tiles: [] },
              ],
            },
            {
              id: "14527128-df6c-4888-afe1-753137e3467e",
              frames: [
                { id: "2fcbdb85-058c-41dd-96a0-4a83533d8689", tiles: [] },
              ],
            },
            {
              id: "61ea7360-c4c6-4ce7-b73b-e2ddf6e27af1",
              frames: [
                { id: "35523f14-f82e-4392-b7dc-ac83d665d5c1", tiles: [] },
              ],
            },
            {
              id: "95001400-9cb9-4808-b41a-68736608592f",
              frames: [
                { id: "2512272b-4a61-4f1a-be88-080fbed319af", tiles: [] },
              ],
            },
            {
              id: "eb658349-65e4-44c4-a701-1fa40d167098",
              frames: [
                { id: "17b91a23-63a8-4d3b-a8cb-1482fbe49f85", tiles: [] },
              ],
            },
            {
              id: "dbd74eda-85a6-4bc5-81f8-da5cefad698f",
              frames: [
                { id: "81713d9e-18af-4836-bf09-af3a5e4c06f6", tiles: [] },
              ],
            },
            {
              id: "fda36d03-b649-413b-bc3a-7b43a28592bc",
              frames: [
                { id: "0e814509-ade9-4498-8b17-0284cb93ac58", tiles: [] },
              ],
            },
          ],
          animationType: "fixed",
          flipLeft: true,
        },
      ],
      numTiles: 1,
      canvasWidth: 16,
      canvasHeight: 16,
      boundsX: 0,
      boundsY: 0,
      boundsWidth: 16,
      boundsHeight: 16,
      animSpeed: 15,
      _v: 1706020738439,
      data: [],
      tiles: [],
      metasprites: [
        [
          { tile: 0, x: 8, y: 0, props: 0 },
          { tile: 0, x: -8, y: 0, props: 32 },
        ],
        [
          { tile: 0, x: 4, y: 2, props: 32 },
          { tile: 0, x: -3, y: -6, props: 32 },
        ],
        [{ tile: 0, x: -3, y: 1, props: 32 }],
        [{ tile: 0, x: 5, y: 0, props: 0 }],
        [
          { tile: 0, x: 9, y: 0, props: 0 },
          { tile: 0, x: -9, y: 0, props: 32 },
        ],
      ],
      animationOffsets: [
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 0, end: 0 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 1, end: 1 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
        { start: 2, end: 4 },
      ],
      metaspritesOrder: [0, 1, 2, 3, 4],
      tileset: {
        symbol: "sprite_bullet_tileset",
        data: [],
      },
    },
  ],

  expectedOutput: `#pragma bank 255

// Scene: Scene 1
// Projectiles

#include "gbs_types.h"
#include "data/sprite_bullet.h"
#include "data/sprite_bullet.h"

BANKREF(test_scene_projectiles)

const struct projectile_def_t test_scene_projectiles[] = {
    {
        // Projectile 0,
        .sprite = TO_FAR_PTR_T(sprite_bullet),
        .move_speed = 32,
        .life_time = 60,
        .collision_group = COLLISION_GROUP_3,
        .collision_mask = COLLISION_GROUP_1,
        .bounds = {
            .left = 0,
            .bottom = 7,
            .right = 15,
            .top = -8
        },
        .anim_tick = 15,
        .animations = {
            {
                .start = 0,
                .end = 0
            },
            {
                .start = 0,
                .end = 0
            },
            {
                .start = 0,
                .end = 0
            },
            {
                .start = 0,
                .end = 0
            }
        },
        .initial_offset = 0
    },
    {
        // Projectile 1,
        .sprite = TO_FAR_PTR_T(sprite_bullet),
        .move_speed = 32,
        .life_time = 60,
        .collision_group = COLLISION_GROUP_3,
        .collision_mask = COLLISION_GROUP_1,
        .bounds = {
            .left = 0,
            .bottom = 7,
            .right = 15,
            .top = -8
        },
        .anim_tick = 15,
        .animations = {
            {
                .start = 1,
                .end = 1
            },
            {
                .start = 1,
                .end = 1
            },
            {
                .start = 1,
                .end = 1
            },
            {
                .start = 1,
                .end = 1
            }
        },
        .initial_offset = 0
    }
};
`,
};
