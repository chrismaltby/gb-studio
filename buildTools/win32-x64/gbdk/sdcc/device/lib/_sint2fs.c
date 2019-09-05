/* convert signed int to float */
float __sint2fs (signed int si) {
  signed long sl=si;
  return __slong2fs(sl);
}
