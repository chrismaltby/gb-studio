	.include	"global.s"

	;; BANKED:	checked
	.area	_CODE

	;; Send byte in __io_out to the serial port
.send_byte:
_send_byte::			; Banked
	LD	A,#.IO_SENDING
	LD	(__io_status),A ; Store status
	LD	A,#0x01
	LDH	(.SC),A		; Use internal clock
	LD	A,(__io_out)
	LDH	(.SB),A		; Send data byte
	LD	A,#0x81
	LDH	(.SC),A		; Use internal clock
	RET

	;; Receive byte from the serial port in __io_in
.receive_byte:
_receive_byte::			; Banked
	LD	A,#.IO_RECEIVING
	LD	(__io_status),A ; Store status
	XOR	A
	LDH	(.SC),A		; Use external clock
	LD	A,#.DT_RECEIVING
	LDH	(.SB),A		; Send RECEIVING byte
	LD	A,#0x80
	LDH	(.SC),A		; Use external clock
	RET
