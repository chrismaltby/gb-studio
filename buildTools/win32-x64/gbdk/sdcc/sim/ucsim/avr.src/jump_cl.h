/* avr.src/jump_cl.h */

  virtual int ijmp(t_mem code);
  virtual int eijmp(t_mem code);
  virtual int icall(t_mem code);
  virtual int eicall(t_mem code);
  virtual int ret(t_mem code);
  virtual int reti(t_mem code);
  virtual int rjmp_k(t_mem code);
  virtual int rcall_k(t_mem code);
  virtual int cpse_Rd_Rr(t_mem code);
  virtual int jmp_k(t_mem code);
  virtual int call_k(t_mem code);
  virtual int brbs_s_k(t_mem code);
  virtual int brbc_s_k(t_mem code);
  virtual int sbrc_Rr_b(t_mem code);
  virtual int sbrs_Rr_b(t_mem code);
  virtual int sbic_P_b(t_mem code);
  virtual int sbis_P_b(t_mem code);

/* End of avr.src/jump_cl.h */
