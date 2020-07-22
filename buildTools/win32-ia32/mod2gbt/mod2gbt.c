/*
 * mod2gbt v2.2 (Part of GBT Player)
 *
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2009-2018, Antonio Niño Díaz <antonio_nd@outlook.com>
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DEFAULT_ROM_BANK (2)
#define BANK_NUM_UNBANKED 0

unsigned int current_output_bank;

typedef unsigned char u8;
typedef signed   char s8;
typedef unsigned short int u16;
typedef signed   short int s16;

#define abs(x) (((x) > 0) ? (x) : -(x))
#define BIT(n) (1 << (n))

//------------------------------------------------------------------------------
//--                                                                          --
//--                           Read MOD file                                  --
//--                                                                          --
//------------------------------------------------------------------------------

typedef struct __attribute__((packed)) {
    char name[22];
    u16  length;
    u8   finetune; // 4 lower bits
    u8   volume; // 0-64
    u16  repeat_point;
    u16  repeat_length; // Loop if length > 1
} _sample_t;

typedef struct __attribute__((packed)) {
    u8 info[64][4][4]; // [step][channel][byte]
} _pattern_t;

typedef struct __attribute__((packed)) {
    char name[20];
    _sample_t sample[31];
    u8 song_length; // Length in patterns
    u8 unused; // Set to 127, used by Noisetracker
    u8 pattern_table[128]; //0..63
    char identifier[4];
    // Only 64 patterns allowed (see pattern_table) but set to 256 anyway...
    _pattern_t pattern[256];
    // Followed by sample data, unused by the converter
} mod_file_t;

//------------------------------------------------------------------------------

void *load_file(const char *filename)
{
    unsigned int size;
    void *buffer = NULL;
    FILE *datafile = fopen(filename, "rb");

    if (datafile == NULL)
    {
        printf("ERROR: %s couldn't be opened!\n", filename);
        return NULL;
    }

    fseek(datafile, 0, SEEK_END);
    size = ftell(datafile);
    if (size == 0)
    {
        printf("ERROR: Size of %s is 0!\n", filename);
        fclose(datafile);
        return NULL;
    }

    rewind(datafile);
    buffer = malloc(size);
    if (buffer == NULL)
    {
        printf("ERROR: Not enought memory to load %s!\n", filename);
        fclose(datafile);
        return NULL;
    }

    if (fread(buffer, size, 1, datafile) != 1)
    {
        printf("ERROR: Error while reading.\n");
        fclose(datafile);
        free(buffer);
        return NULL;
    }

    fclose(datafile);

    return buffer;
}

//------------------------------------------------------------------------------

void unpack_info(u8 *info, u8 *sample_num, u16 *sample_period, u8 *effect_num,
                 u8 *effect_param)
{
    *sample_num    = (info[0] & 0xF0) | ((info[2] & 0xF0) >> 4);
    *sample_period =  info[1]         | ((info[0] & 0x0F) << 8);
    *effect_num    =  info[2] & 0x0F;
    *effect_param  =  info[3];
}

const u16 mod_period[6 * 12] = {
    1712,1616,1524,1440,1356,1280,1208,1140,1076,1016, 960, 907,
     856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
     428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
     214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
     107, 101,  95,  90,  85,  80,  75,  71,  67,  63,  60,  56,
      53,  50,  47,  45,  42,  40,  37,  35,  33,  31,  30,  28
};

u8 mod_get_index_from_period(u16 period, int pattern, int step, int channel)
{
    if (period > 0)
    {
        if (period < mod_period[(6 * 12) - 1])
        {
            if (channel != 4) // Pitch ignored for noise channel
            {
                printf("\nPattern %d, Step %d, Channel %d. Note too high!\n",
                       pattern, step, channel);
            }
        }
        else if (period > mod_period[0])
        {
            if (channel != 4) // Pitch ignored for noise channel
            {
                printf("\nPattern %d, Step %d, Channel %d. Note too low!\n",
                       pattern, step, channel);
            }
        }
    }
    else
    {
        return -1;
    }

    int i;
    for (i = 0; i < 6 * 12; i++)
        if (period == mod_period[i])
            return i;

    // Couldn't find exact match... get nearest value

    u16 nearest_value = 0xFFFF;
    u8 nearest_index = 0;
    for (i = 0; i < 6 * 12; i++)
    {
        int test_distance = abs(((int)period) - ((int)mod_period[i]));
        int nearest_distance = abs(((int)period) - nearest_value);

        if (test_distance < nearest_distance)
        {
            nearest_value = mod_period[i];
            nearest_index = i;
        }
    }

    return nearest_index;
}

//------------------------------------------------------------------------------
//--                                                                          --
//--                           Save output                                    --
//--                                                                          --
//------------------------------------------------------------------------------

FILE *output_file;
char label_name[64];

void out_open(void)
{
    output_file = fopen("output.c", "w");
}

void out_write_str(const char *str)
{
    fprintf(output_file, str);
}

void out_write_dec(u8 number)
{
    fprintf(output_file, "%d", number);
}

void out_write_hex(u8 number)
{
    fprintf(output_file, "%02X", number);
}

void out_close(void)
{
    fclose(output_file);
}

//------------------------------------------------------------------------------
//--                                                                          --
//--                          Save to Game Boy                                --
//--                                                                          --
//------------------------------------------------------------------------------

/*
SAMPLE PERIOD LUT - MOD values
           C    C#   D    D#   E    F    F#   G    G#   A    A#   B
Octave 0:1712,1616,1525,1440,1357,1281,1209,1141,1077,1017, 961, 907 // C3 to B3
Octave 1: 856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453 // C4 to B4
Octave 2: 428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226 // C5 to B5
Octave 3: 214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113 // C6 to B6
Octave 4: 107, 101,  95,  90,  85,  80,  76,  71,  67,  64,  60,  57 // C7 to B7
Octave 5:  53,  50,  47,  45,  42,  40,  37,  35,  33,  31,  30,  28 // C8 to B8

//From C3 to B8  |  A5 = 1750 = 440.00Hz  |  C5 = 1546
const UWORD GB_frequencies[] = {
      44, 156, 262, 363, 457, 547, 631, 710, 786, 854, 923, 986, // C3 to B3
    1046,1102,1155,1205,1253,1297,1339,1379,1417,1452,1486,1517, // C4 to B4
    1546,1575,1602,1627,1650,1673,1694,1714,1732,1750,1767,1783, // C5 to B5
    1798,1812,1825,1837,1849,1860,1871,1881,1890,1899,1907,1915, // C6 to B6
    1923,1930,1936,1943,1949,1954,1959,1964,1969,1974,1978,1982, // C7 to B7
    1985,1988,1992,1995,1998,2001,2004,2006,2009,2011,2013,2015  // C8 to B8
};

That means... MOD C0 (period 1712) = GB C3 (freq 44, index 0)
Anyway, they don't sound the same...
*/

int volume_mod_to_gb(int v) // Channels 1,2,4
{
    return (v == 64) ? 0xF : (v >> 2);
}

int volume_mod_to_gb_ch3(int v) // Channel 3
{
    int vol = volume_mod_to_gb(v);

    switch (vol)
    {
        case 0: case 1: case 2: case 3:
            return 0;

        case 4: case 5: case 6: case 7:
            return 3;

        case 8: case 9: case 10: case 11:
            return 2;

        default:
        case 12: case 13: case 14: case 15:
            return 1;
    }

    return 0;
}

int speed_mod_to_gb(int s)
{
    // Amiga's 50 Hz to GB's 60 Hz
    return (s * 60) / 50;
}

// Returns 1 if ok
int effect_mod_to_gb(u8 pattern_number, u8 step_number, u8 channel,
                     u8 effectnum, u8 effectparams, u8 *converted_num,
                     u8 *converted_params)
{
    switch (effectnum)
    {
        case 0x0: // Arpeggio
        {
            *converted_num = 1;
            *converted_params = effectparams;
            return 1;
        }
        case 0xB: // Jump
        {
            *converted_num = 8;
            *converted_params = effectparams;
            return 1;
        }
        case 0xC: // Volume -> Not handled here
        {
            printf("Strange error at pattern %d, step %d, channel %d: "
                   "%01X%02X\n", pattern_number, step_number, channel,
                   effectnum, effectparams);
            return 0;
        }
        case 0xD: // Break + Set step
        {
            *converted_num = 9; // Effect value is BCD, convert to integer
            *converted_params = (((effectparams & 0xF0) >> 4) * 10)
                              +   (effectparams & 0x0F);
            //*converted_params = effectparams; // ... or not?
            return 1;
        }
        case 0xE:
        {
            if ((effectparams & 0xF0) == 0x80) // Pan
            {
                u8 left = 0;
                u8 right = 0;

                switch (effectparams & 0xF)
                {
                    case 0: case 1: case 2: case 3:
                        left = 1;
                        break;

                    default:
                    case 4: case 5: case 6: case 7:
                    case 8: case 9: case 10: case 11:
                        left = 1;
                        right = 1;
                        break;

                    case 12: case 13: case 14: case 15:
                        right = 1;
                        break;
                }
                *converted_num = 0;
                *converted_params = (left << (3 + channel))
                                  | (right << (channel - 1)); // Channel 1-4
                return 1;
            }
            if ((effectparams & 0xF0) == 0xC0) // Cut note
            {
                *converted_num = 2;
                *converted_params = (effectparams & 0xF);
                return 1;
            }
            else // Error
            {
                printf("Unsupported effect at pattern %d, step %d, channel %d: "
                       "%01X%02X\n", pattern_number, step_number, channel,
                       effectnum, effectparams);
                return 0;
            }
            break;
        }
        case 0xF: // Speed
        {
            if (effectparams > 0x1F) // Nothing
            {
                printf("Unsupported BPM speed effect at pattern %d, step %d, "
                       "channel %d: %01X%02X\n", pattern_number, step_number,
                       channel, effectnum, effectparams);
                return 0;
            }
            else // Speed
            {
                *converted_num = 10;
                *converted_params = speed_mod_to_gb(effectparams);
                return 1;
            }
            break;
        }
        default: // Nothing
        {
            printf("Unsupported effect at pattern %d, step %d, channel %d: "
                   "%01X%02X\n", pattern_number, step_number, channel,
                   effectnum, effectparams);
            return 0;
        }
    }
    return 0;
}

void convert_channel1(u8 pattern_number, u8 step_number, u8 note_index,
                      u8 samplenum, u8 effectnum, u8 effectparams)
{
    u8 result[3] = {0, 0, 0};
    int command_len = 1; // NOP

    u8 instrument = samplenum & 3;

    if (note_index > (6 * 12 - 1)) // Not valid note -> check if any effect
    {
        if ((effectnum != 0) || (effectparams != 0))
        {
            // Volume or others?
            if (effectnum == 0xC)
            {
                // Volume
                result[0] = BIT(5) | volume_mod_to_gb(effectparams);
                command_len = 1;
            }
            else
            {
                // Others
                u8 converted_num, converted_params;
                if (effect_mod_to_gb(pattern_number, step_number, 1, effectnum,
                                     effectparams, &converted_num,
                                     &converted_params) == 1)
                {
                    result[0] = BIT(6) | (instrument << 4) | converted_num;
                    result[1] = converted_params;
                    command_len = 2;
                }
                else
                {
                    if (effectnum != 0)
                    {
                        printf("Invalid command at pattern %d, step %d, channel"
                               " 1: %01X%02X\n", pattern_number, step_number,
                               effectnum, effectparams);
                    }

                    // NOP
                    result[0] = 0;
                    command_len = 1;
                }
            }
        }
        else
        {
            // NOP
            result[0] = 0;
            command_len = 1;
        }
    }
    else // New note
    {
        u8 converted_num, converted_params;
        if (effectnum == 0xC)
        {
            // Note + Volume
            result[0] = BIT(7) | note_index;
            result[1] = (instrument << 4) | volume_mod_to_gb(effectparams);
            command_len = 2;
        }
        else
        {
            if (effect_mod_to_gb(pattern_number, step_number, 1, effectnum,
                                 effectparams, &converted_num,
                                 &converted_params) == 1)
            {
                // Note + Effect
                result[0] = BIT(7) | note_index;
                result[1] = BIT(7) | (instrument << 4) | converted_num;
                result[2] = converted_params;
                command_len = 3;
            }
            else // Note + No effect!! -> Bad, we need at least volume change!!
            {
                printf("Invalid command at pattern %d, step %d, channel 1: "
                       "%01X%02X\n", pattern_number, step_number, effectnum,
                       effectparams);

                if (effectnum == 0)
                    printf("Volume must be set when using a note.\n");
            }
        }
    }

    out_write_str("0x");
    out_write_hex(result[0]);

    if (command_len > 1)
    {
        out_write_str(",0x");
        out_write_hex(result[1]);

        if (command_len > 2)
        {
            out_write_str(",0x");
            out_write_hex(result[2]);
        }
    }
}

void convert_channel2(u8 pattern_number, u8 step_number, u8 note_index,
                      u8 samplenum, u8 effectnum, u8 effectparams)
{
    u8 result[3] = {0, 0, 0};
    int command_len = 1; // NOP

    u8 instrument = samplenum & 3;

    if (note_index > (6 * 12 - 1)) // Not valid note -> check if any effect
    {
        if ((effectnum != 0) || (effectparams != 0))
        {
            // Volume or others?
            if (effectnum == 0xC)
            {
                // Volume
                result[0] = BIT(5) | volume_mod_to_gb(effectparams);
                command_len = 1;
            }
            else
            {
                // Others
                u8 converted_num, converted_params;
                if (effect_mod_to_gb(pattern_number, step_number, 2, effectnum,
                                     effectparams, &converted_num,
                                     &converted_params) == 1)
                {
                    result[0] = BIT(6) | (instrument << 4) | converted_num;
                    result[1] = converted_params;
                    command_len = 2;
                }
                else
                {
                    if (effectnum != 0)
                    {
                        printf("Invalid command at pattern %d, step %d, channel"
                               " 2: %01X%02X\n", pattern_number, step_number,
                               effectnum, effectparams);
                    }

                    // NOP
                    result[0] = 0;
                    command_len = 1;
                }
            }
        }
        else
        {
            // NOP
            result[0] = 0;
            command_len = 1;
        }
    }
    else // New note
    {
        u8 converted_num, converted_params;
        if (effectnum == 0xC)
        {
            // Note + Volume
            result[0] = BIT(7) | note_index;
            result[1] = (instrument << 4) | volume_mod_to_gb(effectparams);
            command_len = 2;
        }
        else
        {
            if (effect_mod_to_gb(pattern_number, step_number, 2, effectnum,
                                 effectparams, &converted_num,
                                 &converted_params) == 1)
            {
                // Note + Effect
                result[0] = BIT(7) | note_index;
                result[1] = BIT(7) | (instrument << 4) | converted_num;
                result[2] = converted_params;
                command_len = 3;
            }
            else // Note + No effect!! -> We need at least volume change!
            {
                printf("Invalid command at pattern %d, step %d, channel 2: "
                       "%01X%02X\n", pattern_number, step_number, effectnum,
                       effectparams);

                if (effectnum == 0)
                    printf("Volume must be set when using a new note.\n");
            }
        }
    }

    out_write_str("0x");
    out_write_hex(result[0]);

    if (command_len > 1)
    {
        out_write_str(",0x");
        out_write_hex(result[1]);

        if (command_len > 2)
        {
            out_write_str(",0x");
            out_write_hex(result[2]);
        }
    }
}

void convert_channel3(u8 pattern_number, u8 step_number, u8 note_index,
                      u8 samplenum, u8 effectnum, u8 effectparams)
{
    u8 result[3] = {0, 0, 0};
    int command_len = 1; // NOP

    if (note_index > (6 * 12 - 1)) // Not valid note -> check if any effect
    {
        if ((effectnum != 0) || (effectparams != 0))
        {
            // Volume or others?
            if (effectnum == 0xC)
            {
                // Volume
                result[0] = BIT(5) | volume_mod_to_gb_ch3(effectparams);
                command_len = 1;
            }
            else
            {
                // Others
                u8 converted_num, converted_params;
                if (effect_mod_to_gb(pattern_number, step_number, 3, effectnum,
                                     effectparams, &converted_num,
                                     &converted_params) == 1)
                {
                    result[0] = BIT(6) | converted_num;
                    result[1] = converted_params;
                    command_len = 2;
                }
                else
                {
                    if (effectnum != 0)
                    {
                        printf("Invalid command at pattern %d, step %d, channel"
                               " 3: %01X%02X\n", pattern_number, step_number,
                               effectnum, effectparams);
                    }

                    // NOP
                    result[0] = 0;
                    command_len = 1;
                }
            }
        }
        else
        {
            // NOP
            result[0] = 0;
            command_len = 1;
        }
    }
    else // New note
    {
        u8 instrument = (samplenum - 8) & 15; // Only 0-7 implemented

        u8 converted_num, converted_params;
        if (effectnum == 0xC)
        {
            // Note + Volume
            result[0] = BIT(7) | note_index;
            result[1] = (volume_mod_to_gb_ch3(effectparams) << 4) | instrument;
            command_len = 2;
        }
        else
        {
            if (effect_mod_to_gb(pattern_number, step_number, 3, effectnum,
                                 effectparams, &converted_num,
                                 &converted_params) == 1)
            {
                if (converted_num > 7)
                {
                    printf("Invalid command at pattern %d, step %d, channel 3: "
                           "%01X%02X\nOnly 0-7 allowed in this mode.\n",
                           pattern_number, step_number, effectnum,
                           effectparams);
                }
                else
                {
                    // Note + Effect
                    result[0] = BIT(7) | note_index;
                    result[1] = BIT(7) | (converted_num << 4) | instrument;
                    result[2] = converted_params;
                    command_len = 3;
                }
            }
            else // Note + No effect!! -> We need at least volume change!
            {
                printf("Invalid command at pattern %d, step %d, channel 3: "
                       "%01X%02X\n", pattern_number, step_number, effectnum,
                       effectparams);

                if (effectnum == 0)
                    printf("Volume must be set when using a note.\n");
            }
        }
    }

    out_write_str("0x");
    out_write_hex(result[0]);

    if (command_len > 1)
    {
        out_write_str(",0x");
        out_write_hex(result[1]);

        if (command_len > 2)
        {
            out_write_str(",0x");
            out_write_hex(result[2]);
        }
    }
}

void convert_channel4(u8 pattern_number, u8 step_number, u8 note_index,
                      u8 samplenum, u8 effectnum, u8 effectparams)
{
    u8 result[3] = {0, 0, 0};
    int command_len = 1; // NOP

    if (note_index > (6 * 12 - 1)) // Not valid note -> check if any effect
    {
        if ((effectnum != 0) || (effectparams != 0))
        {
            // Volume or others?
            if (effectnum == 0xC)
            {
                // Volume
                result[0] = BIT(5) | volume_mod_to_gb(effectparams);
                command_len = 1;
            }
            else
            {
                // Others
                u8 converted_num, converted_params;
                if (effect_mod_to_gb(pattern_number, step_number, 4, effectnum,
                                     effectparams, &converted_num,
                                     &converted_params) == 1)
                {
                    result[0] = BIT(6) | converted_num;
                    result[1] = converted_params;
                    command_len = 2;
                }
                else
                {
                    if (effectnum != 0)
                    {
                        printf("Invalid command at pattern %d, step %d, channel"
                               " 4: %01X%02X\n", pattern_number, step_number,
                               effectnum, effectparams);
                    }

                    // NOP
                    result[0] = 0;
                    command_len = 1;
                }
            }
        }
        else
        {
            // NOP
            result[0] = 0;
            command_len = 1;
        }
    }
    else // New note (not a real note...)
    {
        u8 instrument = (samplenum - 16) & 0x1F; // Only 0 - 0xF implemented

        u8 converted_num, converted_params;
        if (effectnum == 0xC)
        {
            // Note + Volume
            result[0] = BIT(7) | instrument;
            result[1] = volume_mod_to_gb(effectparams);
            command_len = 2;
        }
        else
        {
            if (effect_mod_to_gb(pattern_number, step_number, 4, effectnum,
                                 effectparams, &converted_num,
                                 &converted_params) == 1)
            {
                // Note + Effect
                result[0] = BIT(7) | instrument;
                result[1] = BIT(7) | converted_num;
                result[2] = converted_params;
                command_len = 3;
            }
            else // Note + No effect!! -> We need at least volume change!
            {
                printf("Invalid command at pattern %d, step %d, channel 4: "
                       "%01X%02X\n", pattern_number, step_number, effectnum,
                       effectparams);

                if(effectnum == 0)
                    printf("Volume must be set when using a new note.\n");
            }
        }
    }

    out_write_str("0x");
    out_write_hex(result[0]);

    if (command_len > 1)
    {
        out_write_str(",0x");
        out_write_hex(result[1]);

        if (command_len > 2)
        {
            out_write_str(",0x");
            out_write_hex(result[2]);
        }
    }
}

void convert_pattern(_pattern_t *pattern, u8 number)
{
    out_write_str("const unsigned char ");
    out_write_str(label_name);
    out_write_dec(number);
    out_write_str("[] = {\n");

    int step;
    for (step = 0; step < 64; step++)
    {
        out_write_str("  ");

        u8 data[4]; // Packed data

        u8 samplenum; // Unpacked data
        u16 sampleperiod;
        u8 effectnum, effectparams;

        u8 note_index;

        // Channel 1
        memcpy(data, pattern->info[step][0], 4);
        unpack_info(data, &samplenum, &sampleperiod, &effectnum, &effectparams);
        note_index = mod_get_index_from_period(sampleperiod, number, step, 1);
        convert_channel1(number, step, note_index, samplenum, effectnum,
                         effectparams);
        out_write_str(", ");

        // Channel 2
        memcpy(data, pattern->info[step][1], 4);
        unpack_info(data, &samplenum, &sampleperiod, &effectnum, &effectparams);
        note_index = mod_get_index_from_period(sampleperiod, number, step, 2);
        convert_channel2(number, step, note_index, samplenum, effectnum,
                         effectparams);
        out_write_str(", ");

        //Channel 3
        memcpy(data, pattern->info[step][2], 4);
        unpack_info(data, &samplenum, &sampleperiod, &effectnum, &effectparams);
        note_index = mod_get_index_from_period(sampleperiod, number, step, 3);
        convert_channel3(number, step, note_index, samplenum, effectnum,
                         effectparams);
        out_write_str(", ");

        //Channel 4
        memcpy(data, pattern->info[step][3], 4);
        unpack_info(data, &samplenum, &sampleperiod, &effectnum, &effectparams);
        note_index = mod_get_index_from_period(sampleperiod, number, step, 4);
        convert_channel4(number, step, note_index, samplenum, effectnum,
                         effectparams);

        if (step == 63)
            out_write_str("\n");
        else
            out_write_str(",\n");
    }

    out_write_str("};\n\n");
}

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------

void print_usage(void)
{
    printf("Usage: mod2gbt modfile.mod label_name [N]\n");
    printf("       N: Set output to ROM bank N (defaults to %d, use 0 for unbanked)",
           DEFAULT_ROM_BANK);
    printf("\n\n");
}

int main(int argc, char *argv[])
{
    int i;

    printf("mod2gbt v2.2 (part of GBT Player)\n");
    printf("Copyright (c) 2009-2018 Antonio Niño Díaz "
           "<antonio_nd@outlook.com>\n");
    printf("All rights reserved\n");
    printf("\n");

    if ((argc < 3) || (argc > 4))
    {
        print_usage();
        return -1;
    }

    strcpy(label_name, argv[2]);

    current_output_bank = DEFAULT_ROM_BANK;

    if (argc == 4)
    {
        if (sscanf(argv[3], "%d", &current_output_bank) != 1)
        {
            printf("Invalid bank: '%s'\n\n", argv[4]);
            print_usage();
            return -2;
        }
        else
        {
            if (current_output_bank == BANK_NUM_UNBANKED) {
                printf("Bank set to 0, so output will be unbanked\n");
            } else {
                printf("Output to bank: %d\n", current_output_bank);
            }
        }
    }

    mod_file_t *modfile = load_file(argv[1]);

    if (modfile == NULL)
        return -2;

    printf("%s loaded!\n", argv[1]);

    if (strncmp(modfile->identifier, "M.K.", 4) == 0)
    {
        printf("Valid mod file!\n");
    }
    else
    {
        printf("ERROR: Not a valid mod file.\n"
               "Only 4 channel mod files with 31 samples allowed.\n");
        return -3;
    }

    printf("\nSong name: ");
    for (i = 0; i < 20; i++)
        if (modfile->name[i])
            printf("%c", modfile->name[i]);
    printf("\n");

    u8 num_patterns = 0;

    for (i = 0; i < 128; i++)
        if (modfile->pattern_table[i] > num_patterns)
            num_patterns = modfile->pattern_table[i];

    num_patterns++;

    printf("Number of patterns: %d\n", num_patterns);

    out_open();

    out_write_str("\n// File created by mod2gbt\n\n");

    if (current_output_bank != BANK_NUM_UNBANKED) {
        out_write_str("#pragma bank=");
        out_write_dec(current_output_bank);
        out_write_str("\n\n");
    }

    printf("\nConverting patterns...\n");
    for (i = 0; i < num_patterns; i++)
    {
        printf(".");
        convert_pattern(&(modfile->pattern[i]), i);
    }

    printf("\n\nPattern order...\n");

    out_write_str("const unsigned char * const ");
    out_write_str(label_name);
    out_write_str("_Data[] = {\n");

    for (i = 0; i < modfile->song_length; i++)
    {
        out_write_str("    ");
        out_write_str(label_name);
        out_write_dec(modfile->pattern_table[i]);
        out_write_str(",\n");
    }

    out_write_str("    0x0000\n");
    out_write_str("};\n\n");

    out_close();

    printf("\nDone!\n");

    return 0;
}
