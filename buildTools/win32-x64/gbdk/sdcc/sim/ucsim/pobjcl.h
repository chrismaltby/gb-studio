/*
 * Simulator of microcontrollers (pobjcl.h)
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

#ifndef POBJ_HEADER
#define POBJ_HEADER

#include "ddconfig.h"

#include "pobjt.h"


/*									    #
  ==========================================================================#
								    cl_base #
  ==========================================================================#
									    #
*/

class cl_base
{
public:
  cl_base(void);
  virtual ~cl_base(void);

  virtual int init(void);
};


/*									    #
  ==========================================================================#
								    cl_list #
  ==========================================================================#
									    #
*/

class cl_list: public cl_base
{
public:
  t_index	   count;
protected:
  void		   **Items;
  t_index	   Limit;
  t_index	   Delta;

public:
  cl_list(t_index alimit, t_index adelta);
  virtual ~cl_list(void);

	  void	   *at(t_index index);
  virtual t_index  index_of(void *item);
  	  int	   get_count(void);
  virtual void     *pop(void);
  virtual void     *top(void);

  //void	   pack(void);
  virtual void	   set_limit(t_index alimit);

	  void	   free_at(t_index index);
	  void	   disconn_at(t_index index);
	  void	   disconn(void *item);
	  void	   disconn_all(void);

	  void	   add_at(t_index index, void *item);
	  void	   put_at(t_index index, void *item);
  virtual t_index  add(void *item);
  virtual void     push(void *item);

	  void	   *first_that(match_func test, void *arg);
	  void	   *last_that(match_func test, void *arg);
	  void	   for_each(iterator_func action, void *arg);

	  void	   error(t_index code, t_index info);
private:
  virtual void	   free_item(void *item);
};


/*									    #
  ==========================================================================#
							     cl_sorted_list #
  ==========================================================================#
									    #
*/

class cl_sorted_list: public cl_list
{
public:
  bool		   Duplicates;

  cl_sorted_list(t_index alimit, t_index adelta);
  virtual ~cl_sorted_list(void);
  
  virtual bool	   search(void *key, t_index& index);
  virtual t_index  index_of(void *item);
  virtual t_index  add(void *item);
  virtual void	   *key_of(void *item);
private:
  virtual int	   compare(void *key1, void *key2)= 0;
};


/*									    #
  ==========================================================================#
							         cl_strings #
  ==========================================================================#
									    #
*/

class cl_strings: public cl_sorted_list
{
public:
  cl_strings(t_index alimit, t_index adelta);
  virtual ~cl_strings(void);
  
private:
  virtual int	   compare(void *key1, void *key2);
  virtual void	   free_item(void *item);
};


/*									    #
  ==========================================================================#
							        cl_ustrings #
  ==========================================================================#
									    #
*/

class cl_ustrings: public cl_strings
{
public:
  cl_ustrings(t_index alimit, t_index adelta);
  virtual ~cl_ustrings(void);
  
private:
  virtual int	   compare(void *key1, void *key2);
  virtual bool	   search(void *key, t_index &index);
};


#endif

/* End of pobj.h */
