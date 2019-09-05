

            //--------------------------------------------------------------------
            //Written by Dmitry S. Obukhov, 1997
            //dso@usa.net
            //--------------------------------------------------------------------
            //Modified for SDCC by Sandeep Dutta, 1999
            //sandeep.dutta@usa.net
            //--------------------------------------------------------------------
            //malloc and free functions implementation for embedded system
            //Non-ANSI keywords are C51 specific.
            // xdata - variable in external memory (just RAM)
            //--------------------------------------------------------------------

            #define MEMHEADER   struct MAH// Memory Allocation Header

            MEMHEADER
            {
              MEMHEADER xdata *  next;
              MEMHEADER xdata *  prev;
              unsigned int       len;
	      unsigned char      mem;
            };

            #define HEADER_SIZE (sizeof(MEMHEADER)-1)
            #define NULL        (void xdata * ) 0


            //Static here means: can be accessed from this module only
            static MEMHEADER xdata * FIRST_MEMORY_HEADER_PTR;
            void init_dynamic_memory(MEMHEADER xdata * array, unsigned int size) 
            {

            //This function MUST be called after the RESET.
            //Parameters: array - pointer to memory allocated by the linker
            //            size  - size of this memory pool
            //Example:
            //     #define DYNAMIC_MEMORY_SIZE 0x2000
            //     .....
            //     unsigned char xdata dynamic_memory_pool[DYNAMIC_MEMORY_SIZE];
            //     unsigned char xdata * current_buffer;
            //     .....
            //     void main(void)
            //     {
            //         ...
            //         init_dynamic_memory(dynamic_memory_pool,DYNAMIC_MEMORY_SIZE);
            //         Now it is possible to use malloc.
            //         ...
            //         current_buffer = malloc(0x100);
            //
            //

              if ( !array ) /*Reserved memory starts on 0x0000 but it's NULL...*/
              {             //So, we lost one byte!
                 array = (MEMHEADER xdata * )((char xdata * ) array + 1) ;
                 size --;
              }
              FIRST_MEMORY_HEADER_PTR = array;
              //Reserve a mem for last header
              array->next = (MEMHEADER xdata * )(((char xdata * ) array) + size - HEADER_SIZE);
              array->next->next = NULL; //And mark it as last
              array->prev       = NULL; //and mark first as first
              array->len        = 0;    //Empty and ready.
            }

            void  xdata * malloc (unsigned int size)
            {
              register MEMHEADER xdata * current_header;
              register MEMHEADER xdata * new_header;

              if (size>(0xFFFF-HEADER_SIZE)) return NULL; //To prevent overflow in next line
              size += HEADER_SIZE; //We need a memory for header too
              current_header = FIRST_MEMORY_HEADER_PTR;
              while (1)
              {

                //    current
                //    |   len       next
                //    v   v         v
                //....*****.........******....
                //         ^^^^^^^^^
                //           spare

                if ((((unsigned int)current_header->next) -
                     ((unsigned int)current_header) -
                     current_header->len) >= size) break; //if spare is more than need
                current_header = current_header->next;    //else try next             
                if (!current_header->next)  return NULL;  //if end_of_list reached    
              }
              if (!current_header->len)
              { //This code works only for first_header in the list and only
                 current_header->len = size; //for first allocation
                 return ((xdata *)&(current_header->mem));
              } //else create new header at the begin of spare
              new_header = (MEMHEADER xdata * )((char xdata *)current_header + current_header->len);
              new_header->next = current_header->next; //and plug it into the chain
              new_header->prev = current_header;
              current_header->next  = new_header;
              if (new_header->next)  new_header->next->prev = new_header;
              new_header->len  = size; //mark as used
              return ((xdata *)&(new_header->mem));
            }

            void free (MEMHEADER xdata * p)
            {
              register MEMHEADER xdata * prev_header;
              if ( p ) //For allocated pointers only!
              {
                  p = (MEMHEADER xdata * )((char xdata *)  p - HEADER_SIZE); //to start of header
                  if ( p->prev ) // For the regular header
                  {
                    prev_header = p->prev;
                    prev_header->next = p->next;
                    if (p->next)  p->next->prev = prev_header;
                  }
                  else p->len = 0; //For the first header
              }
            }
            //END OF MODULE

