.ORIG x3000
	
JSR DIV
HALT

DIV	
;your code goes here
ST R7, DIV_R7
ST R6, DIV_R7
ST R5, DIV_R5
ST R4, DIV_R4
ST R4, DIV_R3

; OUT

LD R3, DIV_R3
LD R4, DIV_R4
; LD R5, DIV_R5
LD R6, DIV_R6
LD R7, DIV_R7
RET

DIV_R3	.FILL	#0
DIV_R4	.FILL	#0
DIV_R5	.FILL	#0
DIV_R6	.FILL	#0
DIV_R7	.FILL	#0

.END
