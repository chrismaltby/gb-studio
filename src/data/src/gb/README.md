# Inspiration

- Mother series
- Rugrats

# Summary

## Act 1 - The Friend

- Introduce friend

## Act 2 - The School

- Bullys attack fall into the cave

## Act 3 - The Cave

-

## Act 4 -

How about
Act 1 - Intro
Act 2 - Outdoors/Camping? (Forshadow Cave)
Act 3 - School/Fight
Act 4 - The Cave/The goddess

## Build

```shell
git clone git@github.com:gbdkjs/gbdkjs-example-shooter.git;
cd gbdkjs-example-shooter;
npm install;
```

### Game Boy ROM

```shell
make rom;
open build/gb/game.gb;
```

### Emscripten

```shell
make web;
live-server build/web;
```

### Known Issues

/var/folders/z1/pvknp6gs4h9gc3sr0t7p_nkm0000gn/T/lcc695901.asm:4019: Error: <m> multiple definitions error
/var/folders/z1/pvknp6gs4h9gc3sr0t7p_nkm0000gn/T/lcc695901.asm:4019: Error: <p> phase error: label location changing between passes 2 and 3
/var/folders/z1/pvknp6gs4h9gc3sr0t7p_nkm0000gn/T/lcc695901.asm:4058: Error: <m> multiple definitions error

Means you have a function with name >= 28 characters
