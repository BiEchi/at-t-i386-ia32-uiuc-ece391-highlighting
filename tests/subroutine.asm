.ORIG x3000

HALT
; @SUBROUTINE
SUBROUTINE
	ST R0, MEM_SAVE_0
	ST R1, MEM_SAVE_1
	ST R6, MEM_SAVE_6
	ST R7, MEM_SAVE_7

	LDR R0, R6, #0
	OUT

	LD R0, MEM_SAVE_0
	LD R6, MEM_SAVE_0
	LD R7, MEM_SAVE_7
	RET

MEM_SAVE_0 .FILL x0
MEM_SAVE_1 .FILL x0
MEM_SAVE_6 .FILL x0
MEM_SAVE_7 .FILL x0

.END