const toArrayBuffer = (buf: Buffer) => {
  if (buf.length === buf.buffer.byteLength) {
    return buf.buffer;
  }
  return buf.subarray(0, buf.length);
};

export default toArrayBuffer;
