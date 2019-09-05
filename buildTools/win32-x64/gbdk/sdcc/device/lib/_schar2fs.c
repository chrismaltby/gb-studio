/* convert signed char to float */
float __schar2fs (signed char sc) {
  signed long sl=sc;
  return __slong2fs(sl);
}
