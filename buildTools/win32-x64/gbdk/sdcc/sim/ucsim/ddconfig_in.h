/*
 * Simulator of microcontrollers (ddconfig.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#ifndef DDCONFIG_HEADER
#define DDCONFIG_HEADER

#define DD_TRUE  1
#define DD_FALSE 0
#define bool     int

#undef STDC_HEADERS
#undef HAVE_GETOPT_H
#undef HAVE_UNISTD_H
#undef HAVE_DIRENT_H
#undef HAVE_SYS_NDIR_H
#undef HAVE_SYS_DIR_H
#undef HAVE_SYS_SOCKET_H
#undef HAVE_NDIR_H
#undef HAVE_DLFCN_H

#undef SOCKET_AVAIL
#undef SOCKLEN_T

#undef FD_NEED_TIME_H
#undef FD_NEED_TYPES_H
#undef FD_NEED_SELECT_H
#undef HEADER_FD
#undef FD_HEADER_OK

#undef SCANF_A
#undef GNU_GETCWD

#undef HAVE_STRLEN
#undef HAVE_STRCPY
#undef HAVE_STRCAT
#undef HAVE_STRSTR
#undef HAVE_STRCMP
#undef HAVE_STRERROR
#undef HAVE_STRTOK
#undef HAVE_STRDUP
#undef HAVE_STRCHR

#undef HAVE_MEMCPY

#undef HAVE_VPRINTF
#undef HAVE_DOPRNT
#undef HAVE_VSNPRINTF
#undef HAVE_VASPRINTF

#undef HAVE_GETLINE
#undef HAVE_GETDELIM
#undef HAVE_FGETS

#undef HAVE_YYLEX

#undef RETSIGTYPE
#undef SIZEOF_CHAR
#undef SIZEOF_SHORT
#undef SIZEOF_INT
#undef SIZEOF_LONG
#undef SIZEOF_LONG_LONG
#undef TYPE_BYTE
#undef TYPE_WORD
#undef TYPE_DWORD
#define TYPE_UBYTE unsigned TYPE_BYTE
#define TYPE_UWORD unsigned TYPE_WORD
#define TYPE_UDWORD unsigned TYPE_DWORD
#undef WORDS_BIGENDIAN

#undef VERSIONSTR
#undef VERSIONHI
#undef VERSIONLO
#undef VERSIONP

#undef ACCEPT_SOCKLEN_T

#endif

/* End of ddconfig.h */
