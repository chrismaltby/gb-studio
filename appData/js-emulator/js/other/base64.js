"use strict";
var toBase64 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+" , "/", "="];
var fromBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function base64(data) {
	try {
		var base64 = window.btoa(data);	//Use this native function when it's available, as it's a magnitude faster than the non-native code below.
	}
	catch (error) {
		//Defaulting to non-native base64 encoding...
		var base64 = "";
		var dataLength = data.length;
		if (dataLength > 0) {
			var bytes = [0, 0, 0];
			var index = 0;
			var remainder = dataLength % 3;
			while (data.length % 3 > 0) {
				//Make sure we don't do fuzzy math in the next loop...
				data[data.length] = " ";
			}
			while (index < dataLength) {
				//Keep this loop small for speed.
				bytes = [data.charCodeAt(index++) & 0xFF, data.charCodeAt(index++) & 0xFF, data.charCodeAt(index++) & 0xFF];
				base64 += toBase64[bytes[0] >> 2] + toBase64[((bytes[0] & 0x3) << 4) | (bytes[1] >> 4)] + toBase64[((bytes[1] & 0xF) << 2) | (bytes[2] >> 6)] + toBase64[bytes[2] & 0x3F];
			}
			if (remainder > 0) {
				//Fill in the padding and recalulate the trailing six-bit group...
				base64[base64.length - 1] = "=";
				if (remainder == 2) {
					base64[base64.length - 2] = "=";
					base64[base64.length - 3] = toBase64[(bytes[0] & 0x3) << 4];
				}
				else {
					base64[base64.length - 2] = toBase64[(bytes[1] & 0xF) << 2];
				}
			}
		}
	}
	return base64;
}
function base64_decode(data) {
	try {
		var decode64 = window.atob(data);	//Use this native function when it's available, as it's a magnitude faster than the non-native code below.
	}
	catch (error) {
		//Defaulting to non-native base64 decoding...
		var decode64 = "";
		var dataLength = data.length;
		if (dataLength > 3 && dataLength % 4 == 0) {
			var sixbits = [0, 0, 0, 0];	//Declare this out of the loop, to speed up the ops.
			var index = 0;
			while (index < dataLength) {
				//Keep this loop small for speed.
				sixbits = [fromBase64.indexOf(data.charAt(index++)), fromBase64.indexOf(data.charAt(index++)), fromBase64.indexOf(data.charAt(index++)), fromBase64.indexOf(data.charAt(index++))];
				decode64 += String.fromCharCode((sixbits[0] << 2) | (sixbits[1] >> 4)) + String.fromCharCode(((sixbits[1] & 0x0F) << 4) | (sixbits[2] >> 2)) + String.fromCharCode(((sixbits[2] & 0x03) << 6) | sixbits[3]);
			}
			//Check for the '=' character after the loop, so we don't hose it up.
			if (sixbits[3] >= 0x40) {
				decode64.length -= 1;
				if (sixbits[2] >= 0x40) {
					decode64.length -= 1;
				}
			}
		}
	}
	return decode64;
}
function to_little_endian_dword(str) {
	return to_little_endian_word(str) + to_little_endian_word(str >> 16);
}
function to_little_endian_word(str) {
	return to_byte(str) + to_byte(str >> 8);
}
function to_byte(str) {
	return String.fromCharCode(str & 0xFF);
}
function arrayToBase64(arrayIn) {
	var binString = "";
	var length = arrayIn.length;
	for (var index = 0; index < length; ++index) {
		if (typeof arrayIn[index] == "number") {
			binString += String.fromCharCode(arrayIn[index]);
		}
	}
	return base64(binString);
}
function base64ToArray(b64String) {
	var binString = base64_decode(b64String);
	var outArray = [];
	var length = binString.length;
	for (var index = 0; index < length;) {
		outArray.push(binString.charCodeAt(index++) & 0xFF);
	}
	return outArray;
}