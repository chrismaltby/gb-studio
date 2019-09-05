/* avr.src/arith_cl.h */

  virtual int cpi_Rd_K(t_mem code);
  virtual int sbci_Rd_K(t_mem code);
  virtual int subi_Rd_K(t_mem code);
  virtual int muls_Rd_Rr(t_mem code);
  virtual int mulsu_Rd_Rr(t_mem code);
  virtual int fmul_Rd_Rr(t_mem code);
  virtual int fmuls_Rd_Rr(t_mem code);
  virtual int fmulsu_Rd_Rr(t_mem code);
  virtual int cpc_Rd_Rr(t_mem code);
  virtual int sbc_Rd_Rr(t_mem code);
  virtual int add_Rd_Rr(t_mem code);
  virtual int cp_Rd_Rr(t_mem code);
  virtual int sub_Rd_Rr(t_mem code);
  virtual int adc_Rd_Rr(t_mem code);
  virtual int com_Rd(t_mem code);
  virtual int neg_Rd(t_mem code);
  virtual int inc_Rd(t_mem code);
  virtual int asr_Rd(t_mem code);
  virtual int lsr_Rd(t_mem code);
  virtual int ror_Rd(t_mem code);
  virtual int dec_Rd(t_mem code);
  virtual int mul_Rd_Rr(t_mem code);
  virtual int adiw_Rdl_K(t_mem code);
  virtual int sbiw_Rdl_K(t_mem code);
/* End of avr.src/arith_cl.h */
