"use strict";

/**
 * Helpers.js
 *
 * Helper and support functions.
 *
 * Author:  		Maarten Janssen
 * Date:    		2015-04-26
 * Last updated:	2015-07-22
 */
var Helpers = {
  /**
   * Read a 2-byte word form the the buffer at a given offset.
   *
   * @param	{Uint8Array}	buffer			The buffer we're going to read from.
   * @param	{Integer}		offset			The buffer position to start reading.
   * @return	{Integer}						A 16-bit value read from the buffer.
   */
  readWord: function (buffer, offset) {
    return buffer[offset] + (buffer[offset + 1] << 8);
  },

  /**
   * Read a big-endian 2-byte word form the the buffer at a given offset.
   *
   * @param	{Uint8Array}	buffer			The buffer we're going to read from.
   * @param	{Integer}		offset			The buffer position to start reading.
   * @return	{Integer}						A 16-bit value read from the buffer.
   */
  readWordBE: function (buffer, offset) {
    return (buffer[offset] << 8) + buffer[offset + 1];
  },

  /**
   * Read a 4-byte double word from the buffer at a given offset.
   *
   * @param	{Uint8Array}	buffer			The buffer we're going to read from.
   * @param	{Integer}		offset			The buffer position to start reading.
   * @return	{Integer}						A 32-bit value read from the buffer.
   */
  readDWord: function (buffer, offset) {
    return (
      buffer[offset] +
      (buffer[offset + 1] << 8) +
      (buffer[offset + 2] << 16) +
      (buffer[offset + 3] << 24)
    );
  },

  /**
   * Read a string of given length from the buffer.
   *
   * @param	{Uint8Array}	buffer			The buffer we're going to read from.
   * @param	{Integer}		offset			The buffer position to start reading.
   * @param	{Integer}		length			Optional length of the string we want to read. Reads until 0 char if
   *											undefined.
   * @return	{String}						The string read from the buffer.
   */
  readString: function (buffer, offset, length) {
    var str = "";

    if (length) {
      for (var i = 0; i < length; i++) {
        str += String.fromCharCode(buffer[offset + i]);
      }
    } else {
      while (buffer[offset]) {
        str += String.fromCharCode(buffer[offset++]);
      }
    }

    return str;
  },
};

module.exports = Helpers;
