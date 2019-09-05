/* convert signed long to float */
float __slong2fs (signed long sl) {
  if (sl<0) 
    return -__ulong2fs(-sl);
  else 
    return __ulong2fs(sl);
}
