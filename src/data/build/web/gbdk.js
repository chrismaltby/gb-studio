(function(define) {
  define("GBDKJS", function(require, exports) {
    const SCREEN_WIDTH = 160;
    const SCREEN_HEIGHT = 144;
    const BUFFER_WIDTH = 256;
    const BUFFER_HEIGHT = 256;

    const J_LEFT = 0x02;
    const J_RIGHT = 0x01;
    const J_UP = 0x04;
    const J_DOWN = 0x08;
    const J_START = 0x80;
    const J_SELECT = 0x40;
    const J_A = 0x10;
    const J_B = 0x20;

    const JS_KEY_UP = 38;
    const JS_KEY_LEFT = 37;
    const JS_KEY_RIGHT = 39;
    const JS_KEY_DOWN = 40;
    const JS_KEY_ENTER = 13;
    const JS_KEY_ALT = 18;
    const JS_KEY_CTRL = 17;
    const JS_KEY_SHIFT = 16;

    const S_PALETTE = 0x10;
    const S_FLIPX = 0x20;
    const S_FLIPY = 0x40;

    const SHOW_SPRITES = 0x02;

    const TILE_SIZE = 8;
    const DATA_SIZE = 256;
    const NUM_BKG_TILES = 256;
    const NUM_TILES = 384;
    const BUFFER_SIZE = 1024;
    const MAX_SPRITES = 40;

    const COLORS = [
      {
        r: 224,
        g: 248,
        b: 208,
        a: 255
      },
      {
        r: 136,
        g: 192,
        b: 112,
        a: 255
      },
      {
        r: 48,
        g: 104,
        b: 80,
        a: 255
      },
      {
        r: 8,
        g: 24,
        b: 32,
        a: 255
      },
      {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      }
    ];

    function uint(a) {
      return (a + 256) & 255;
    }

    var GBDK = function() {
      // Registers -------------------------------------------------------------

      var LYC_REG = 0;
      Object.defineProperty(this, "LYC_REG", {
        get: function() {
          return LYC_REG;
        },
        set: function(value) {
          LYC_REG = (256 + value) % 256;
        }
      });

      var SCX_REG = 0;
      Object.defineProperty(this, "SCX_REG", {
        get: function() {
          return SCX_REG;
        },
        set: function(value) {
          SCX_REG = (256 + value) % 256;
        }
      });

      var SCY_REG = 0;
      Object.defineProperty(this, "SCY_REG", {
        get: function() {
          return SCY_REG;
        },
        set: function(value) {
          SCY_REG = (256 + value) % 256;
        }
      });

      var WX_REG = 0;
      Object.defineProperty(this, "WX_REG", {
        get: function() {
          return WX_REG;
        },
        set: function(value) {
          WX_REG = (256 + value) % 256;
        }
      });

      var WY_REG = 0;
      Object.defineProperty(this, "WY_REG", {
        get: function() {
          return WY_REG;
        },
        set: function(value) {
          WY_REG = (256 + value) % 256;
        }
      });

      var LCDC_REG = 0;
      Object.defineProperty(this, "LCDC_REG", {
        get: function() {
          return LCDC_REG;
        },
        set: function(value) {
          LCDC_REG = (256 + value) % 256;
        }
      });

      var BGP_REG = 0;
      Object.defineProperty(this, "BGP_REG", {
        get: function() {
          return BGP_REG;
        },
        set: function(value) {
          var i;
          if (value !== BGP_REG) {
            bkg_palette = [
              colors[value & 3],
              colors[(value >> 2) & 3],
              colors[(value >> 4) & 3],
              colors[value >> 6]
            ];
            for (i = 0; i < NUM_BKG_TILES; i++) {
              gfx_data_dirty[i] = true;
            }
            for (i = 0; i < BUFFER_SIZE; i++) {
              bkg_tiles_dirty[i] = true;
              win_tiles_dirty[i] = true;
            }
            BGP_REG = value;
          }
        }
      });

      var OBP0_REG = 0;
      Object.defineProperty(this, "OBP0_REG", {
        get: function() {
          return OBP0_REG;
        },
        set: function(value) {
          var i;
          if (value !== OBP0_REG) {
            OBP0_REG = value;
            obp0_palette = [
              colors[4],
              colors[(value >> 2) & 3],
              colors[(value >> 4) & 3],
              colors[value >> 6]
            ];
            for (i = 128; i < NUM_TILES; i++) {
              gfx_data_dirty[i] = true;
            }
          }
        }
      });

      var OBP1_REG = 0;
      Object.defineProperty(this, "OBP1_REG", {
        get: function() {
          return OBP1_REG;
        },
        set: function(value) {
          var i;
          if (value !== OBP1_REG) {
            OBP1_REG = value;
            obp1_palette = [
              colors[4],
              colors[(value >> 2) & 3],
              colors[(value >> 4) & 3],
              colors[value >> 6]
            ];
            for (i = 128; i < NUM_TILES; i++) {
              gfx_data_dirty[i] = true;
            }
          }
        }
      });

      // Init Canvases ---------------------------------------------------------

      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = SCREEN_WIDTH;
      canvas.height = SCREEN_HEIGHT;

      var buffer_canvas = document.createElement("canvas");
      var buffer_ctx = buffer_canvas.getContext("2d");
      buffer_canvas.width = BUFFER_WIDTH;
      buffer_canvas.height = BUFFER_HEIGHT;

      var window_canvas = document.createElement("canvas");
      var window_ctx = window_canvas.getContext("2d");
      window_canvas.width = BUFFER_WIDTH;
      window_canvas.height = BUFFER_HEIGHT;

      var buffer_debug_canvas = document.createElement("canvas");
      var buffer_debug_ctx = buffer_debug_canvas.getContext("2d");
      buffer_debug_canvas.width = BUFFER_WIDTH;
      buffer_debug_canvas.height = BUFFER_HEIGHT;

      var window_debug_canvas = document.createElement("canvas");
      var window_debug_ctx = window_debug_canvas.getContext("2d");
      window_debug_canvas.width = BUFFER_WIDTH;
      window_debug_canvas.height = BUFFER_HEIGHT;

      var bkg_data_canvas = document.createElement("canvas");
      var bkg_data_ctx = bkg_data_canvas.getContext("2d");
      bkg_data_canvas.width = TILE_SIZE * 16;
      bkg_data_canvas.height = TILE_SIZE * 16;

      var sprite_data_canvas = document.createElement("canvas");
      var sprite_data_ctx = sprite_data_canvas.getContext("2d");
      sprite_data_canvas.width = TILE_SIZE * 16;
      sprite_data_canvas.height = TILE_SIZE * 32;

      var sprite_canvas = document.createElement("canvas");
      var sprite_ctx = sprite_canvas.getContext("2d");
      sprite_canvas.width = TILE_SIZE * 40;
      sprite_canvas.height = TILE_SIZE * 2;

      // Init palettes
      var colors = [].concat(COLORS);
      var bkg_palette = colors;
      var obp0_palette = [colors[4], colors[0], colors[1], colors[3]];
      var obp1_palette = [colors[0], colors[1], colors[3], colors[3]];

      var joypad = 0;

      var lcd_fn = null;
      var bank = 0;

      var bkg_tiles = new Uint8Array(BUFFER_SIZE);
      var bkg_tiles_dirty = new Uint8Array(BUFFER_SIZE);
      var win_tiles = new Uint8Array(BUFFER_SIZE);
      var win_tiles_dirty = new Uint8Array(BUFFER_SIZE);
      var gfx_data = new Uint8Array(DATA_SIZE * 24);
      var gfx_data_dirty = new Uint8Array(NUM_TILES);

      var tile_image_data = ctx.createImageData(TILE_SIZE, TILE_SIZE);
      var tile_image_data_data = tile_image_data.data;

      var sorted_sprites = new Uint8Array(MAX_SPRITES);
      var sprite_tiles = new Uint8Array(MAX_SPRITES);
      var sprite_x = new Uint8Array(MAX_SPRITES);
      var sprite_y = new Uint8Array(MAX_SPRITES);
      var sprite_props = new Uint8Array(MAX_SPRITES);
      for (var i = 0; i < MAX_SPRITES; i++) {
        sorted_sprites[i] = i;
      }
      for (var i = 0; i < BUFFER_SIZE; i++) {
        bkg_tiles_dirty[i] = true;
        win_tiles_dirty[i] = true;
      }

      // Input listeners -------------------------------------------------------

      window.onkeydown = function(e) {
        if (e.keyCode === JS_KEY_LEFT) {
          joypad |= J_LEFT;
        } else if (e.keyCode === JS_KEY_RIGHT) {
          joypad |= J_RIGHT;
        } else if (e.keyCode === JS_KEY_UP) {
          joypad |= J_UP;
        } else if (e.keyCode === JS_KEY_DOWN) {
          joypad |= J_DOWN;
        } else if (e.keyCode === JS_KEY_ENTER) {
          joypad |= J_START;
        } else if (e.keyCode === JS_KEY_ALT) {
          joypad |= J_A;
        } else if (e.keyCode === JS_KEY_CTRL) {
          joypad |= J_B;
        } else if (e.keyCode === JS_KEY_SHIFT) {
          joypad |= J_SELECT;
        } else {
          return;
        }
        e.preventDefault();
      };

      window.onkeyup = function(e) {
        if (e.keyCode === JS_KEY_LEFT) {
          joypad &= ~J_LEFT;
        } else if (e.keyCode === JS_KEY_RIGHT) {
          joypad &= ~J_RIGHT;
        } else if (e.keyCode === JS_KEY_UP) {
          joypad &= ~J_UP;
        } else if (e.keyCode === JS_KEY_DOWN) {
          joypad &= ~J_DOWN;
        } else if (e.keyCode === JS_KEY_ENTER) {
          joypad &= ~J_START;
        } else if (e.keyCode === JS_KEY_ALT) {
          joypad &= ~J_A;
        } else if (e.keyCode === JS_KEY_CTRL) {
          joypad &= ~J_B;
        } else if (e.keyCode === JS_KEY_SHIFT) {
          joypad &= ~J_SELECT;
        } else {
          return;
        }
        e.preventDefault();
      };

      // Private render methods ------------------------------------------------

      function draw_tile_data(ctx, x, y, tile, data, palette) {
        var t = tile;
        for (var i = 0; i < 16; i += 2) {
          for (var j = 0; j < 8; j++) {
            var mask = Math.pow(2, j);
            var index =
              (data[16 * t + i] & mask ? 1 : 0) +
              (data[16 * t + i + 1] & mask ? 2 : 0);
            var pixelIndex = 4 * (7 - j + 8 * (i / 2));
            tile_image_data_data[pixelIndex] = palette[index].r;
            tile_image_data_data[pixelIndex + 1] = palette[index].g;
            tile_image_data_data[pixelIndex + 2] = palette[index].b;
            tile_image_data_data[pixelIndex + 3] = palette[index].a;
          }
        }
        ctx.putImageData(tile_image_data, x * TILE_SIZE, y * TILE_SIZE);
      }

      function draw_tile_canvas(ctx, x, y, tile, canvas) {
        var ty = ((tile / 16) | 0) * TILE_SIZE;
        var tx = tile % 16 * TILE_SIZE;
        ctx.drawImage(
          canvas,
          tx,
          ty,
          TILE_SIZE,
          TILE_SIZE,
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }

      function redraw_gfx_tiles() {
        var i;
        for (i = 0; i < 128; i++) {
          // bkg_tiles
          if (gfx_data_dirty[i]) {
            draw_tile_data(
              bkg_data_ctx,
              i % 16,
              (i / 16) | 0,
              i,
              gfx_data,
              bkg_palette
            );
            gfx_data_dirty[i] = false;
          }
          // sprite_tiles
          if (gfx_data_dirty[256 + i]) {
            // obp0
            draw_tile_data(
              sprite_data_ctx,
              ((i / 2) | 0) % 16,
              2 * ((i / 32) | 0) + i % 2,
              256 + i,
              gfx_data,
              obp0_palette
            );
            // obp1
            draw_tile_data(
              sprite_data_ctx,
              ((i / 2) | 0) % 16,
              16 + (2 * ((i / 32) | 0) + i % 2),
              256 + i,
              gfx_data,
              obp1_palette
            );
            gfx_data_dirty[256 + i] = false;
          }
        }
        // shared sprite and bkg_tiles
        for (i = 128; i < 256; i++) {
          if (gfx_data_dirty[i]) {
            draw_tile_data(
              bkg_data_ctx,
              i % 16,
              (i / 16) | 0,
              i,
              gfx_data,
              bkg_palette
            );
            // obp0
            draw_tile_data(
              sprite_data_ctx,
              ((i / 2) | 0) % 16,
              2 * ((i / 32) | 0) + i % 2,
              i,
              gfx_data,
              obp0_palette
            );
            // obp1
            draw_tile_data(
              sprite_data_ctx,
              ((i / 2) | 0) % 16,
              16 + (2 * ((i / 32) | 0) + i % 2),
              i,
              gfx_data,
              obp1_palette
            );
            gfx_data_dirty[i] = false;
          }
        }
      }

      const redraw_buffer_canvas = function() {
        var i;
        for (i = 0; i < BUFFER_SIZE; i++) {
          if (bkg_tiles_dirty[i]) {
            draw_tile_canvas(
              buffer_ctx,
              i % 32,
              (i / 32) | 0,
              bkg_tiles[i],
              bkg_data_canvas
            );
            bkg_tiles_dirty[i] = false;
          }
        }
      };

      const redraw_window_canvas = function() {
        var i;
        for (i = 0; i < BUFFER_SIZE; i++) {
          if (win_tiles_dirty[i]) {
            draw_tile_canvas(
              window_ctx,
              i % 32,
              (i / 32) | 0,
              win_tiles[i],
              bkg_data_canvas
            );
            win_tiles_dirty[i] = false;
          }
        }
      };

      const redraw_sprite_canvas = function() {
        sprite_canvas.width = sprite_canvas.width;

        // Draw sprites
        for (var si = 0; si < MAX_SPRITES; si++) {
          var i = sorted_sprites[si];
          var t = sprite_tiles[i];
          sprite_ctx.save();
          sprite_ctx.translate(si * TILE_SIZE, 0);
          if (sprite_props[i] & S_FLIPX) {
            sprite_ctx.scale(-1, 1);
            sprite_ctx.translate(-8, 0);
          }
          if (sprite_props[i] & S_FLIPY) {
            sprite_ctx.scale(1, -1);
            sprite_ctx.translate(0, -16);
          }

          var palette_offset = sprite_props[i] & S_PALETTE ? 128 : 0;
          sprite_ctx.drawImage(
            sprite_data_canvas,
            ((t / 2) | 0) % 16 * 8,
            palette_offset + ((t / 32) | 0) * 16,
            8,
            16,
            0,
            0,
            8,
            16
          );
          sprite_ctx.restore();
        }
      };

      function render() {
        canvas.width = canvas.width;

        redraw_gfx_tiles();
        redraw_buffer_canvas();
        redraw_window_canvas();
        redraw_sprite_canvas();

        // Draw screen
        for (var ly = 0; ly < 144; ly++) {
          if ((ly === LYC_REG || LYC_REG === 255) && lcd_fn) {
            Module.dynCall_v(lcd_fn);
          }
          for (var xi = -1; xi < 2; xi++) {
            ctx.drawImage(
              buffer_canvas,
              0,
              (SCY_REG + ly) % 256,
              BUFFER_WIDTH,
              1,
              -(xi * BUFFER_WIDTH) - SCX_REG,
              ly,
              BUFFER_WIDTH,
              1
            );
          }
        }

        buffer_debug_ctx.drawImage(buffer_canvas, 0, 0);
        buffer_debug_ctx.strokeStyle = "red";
        buffer_debug_ctx.lineWidth = 2;
        buffer_debug_ctx.strokeRect(
          SCX_REG - 1,
          SCY_REG - 1,
          SCREEN_WIDTH + 2,
          SCREEN_HEIGHT + 2
        );
        buffer_debug_ctx.strokeRect(
          SCX_REG - 1,
          SCY_REG - 1 - BUFFER_WIDTH,
          SCREEN_WIDTH + 2,
          SCREEN_HEIGHT + 2
        );
        buffer_debug_ctx.strokeRect(
          SCX_REG - 1 - BUFFER_WIDTH,
          SCY_REG - 1,
          SCREEN_WIDTH + 2,
          SCREEN_HEIGHT + 2
        );
        buffer_debug_ctx.strokeRect(
          SCX_REG - 1 - BUFFER_WIDTH,
          SCY_REG - 1 - BUFFER_WIDTH,
          SCREEN_WIDTH + 2,
          SCREEN_HEIGHT + 2
        );

        // Draw window
        ctx.drawImage(
          window_canvas,
          0,
          0,
          BUFFER_WIDTH,
          BUFFER_HEIGHT,
          WX_REG - 7,
          WY_REG,
          BUFFER_WIDTH,
          BUFFER_HEIGHT
        );
        window_debug_ctx.drawImage(window_canvas, 0, 0);
        window_debug_ctx.strokeStyle = "red";
        window_debug_ctx.lineWidth = 2;
        window_debug_ctx.strokeRect(
          -1,
          -1,
          SCREEN_WIDTH + 2 + 8 - WX_REG,
          SCREEN_HEIGHT + 2 - WY_REG
        );

        // Draw sprites
        if (LCDC_REG & SHOW_SPRITES) {
          for (var si = MAX_SPRITES - 1; si >= 0; si--) {
            var i = sorted_sprites[si];
            ctx.drawImage(
              sprite_canvas,
              i * 8,
              0,
              8,
              16,
              sprite_x[i] - 8,
              sprite_y[i] - 16,
              8,
              16
            );
          }
        }
      }

      // Public Methods --------------------------------------------------------

      this.get_canvas = function() {
        return canvas;
      };

      this.get_buffer_canvas = function() {
        return buffer_debug_canvas;
      };

      this.get_window_canvas = function() {
        return window_debug_canvas;
      };

      this.get_bkg_data_canvas = function() {
        return bkg_data_canvas;
      };

      this.get_sprite_data_canvas = function() {
        return sprite_data_canvas;
      };

      this.get_sprite_canvas = function() {
        return sprite_canvas;
      };

      this.set_colors = function(newColors) {
        colors = [].concat(newColors);
      };

      this.assert_bank = function(testBank) {
        return testBank === 0 || testBank === bank;
      };

      this.get_bkg_tiles = function() {
        return bkg_tiles;
      };

      this.get_win_tiles = function() {
        return win_tiles;
      };

      this.get_sprite_tiles = function() {
        return sprite_tiles;
      };

      this.get_sprite_props = function() {
        return sprite_props;
      };

      this.set_joypad = function(joy) {
        joypad = joy;
      }

      // GBDK API --------------------------------------------------------------

      this.SWITCH_ROM_MBC5 = function(newBank) {
        bank = newBank;
      };

      this.wait_vbl_done = function() {
        render();
      };

      this.joypad = function() {
        return joypad;
      };

      this.set_bkg_data = function(first_tile, nb_tiles, data) {
        var i, d, ptr;
        for (i = 0; i < nb_tiles; i++) {
          for (d = 0; d < 16; d++) {
            ptr = (d + (i + first_tile) * 16) % 4096;
            gfx_data[ptr] = data[i * 16 + d];
            gfx_data_dirty[i + first_tile] = true;
          }
        }
      };

      this.set_sprite_data = function(first_tile, nb_tiles, data) {
        var i, d, ptr;
        for (i = 0; i < nb_tiles; i++) {
          var offset = 256;
          if (first_tile + i >= 128) {
            offset = 0;
          }
          for (d = 0; d < 16; d++) {
            ptr = 16 * offset + d + (i + first_tile) * 16;
            gfx_data[ptr] = data[i * 16 + d];
            gfx_data_dirty[offset + i + first_tile] = true;
          }
        }
      };

      this.set_bkg_tiles = function(x, y, w, h, tiles) {
        var ptr;
        for (var yi = 0; yi < h; yi++) {
          for (var xi = 0; xi < w; xi++) {
            ptr = x + xi + (y + yi) * 32;
            bkg_tiles[ptr] = tiles[xi + yi * w];
            bkg_tiles_dirty[ptr] = true;
          }
        }
      };

      this.set_win_tiles = function(x, y, w, h, tiles) {
        var ptr;
        for (var yi = 0; yi < h; yi++) {
          for (var xi = 0; xi < w; xi++) {
            ptr = x + xi + (y + yi) * 32;
            win_tiles[ptr] = tiles[xi + yi * w];
            win_tiles_dirty[ptr] = true;
          }
        }
      };

      this.set_sprite_prop = function(nb, prop) {
        sprite_props[nb] = prop;
      };

      this.move_sprite = function(nb, x, y) {
        sprite_x[nb] = x;
        sprite_y[nb] = y;
      };

      this.set_sprite_tile = function(nb, tile) {
        sprite_tiles[nb] = tile;
      };

      this.add_LCD = function(int_handler) {
        LYC_REG = 0;
        lcd_fn = int_handler;
      };

      this.remove_LCD = function() {
        lcd_fn = null;
      };

      this.disable_interrupts = function() {};

      this.enable_interrupts = function() {};
    };

    exports.GBDK = GBDK;
    exports.uint = uint;
  });
})(
  typeof define === "function" && define.amd
    ? define
    : function(id, factory) {
        if (typeof exports !== "undefined") {
          //commonjs
          factory(require, exports);
        } else {
          factory(function(value) {
            return window[value];
          }, (window[id] = {}));
        }
      }
);
