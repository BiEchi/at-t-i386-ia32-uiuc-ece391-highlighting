.ORIG x3000

; TEST: Unusable label
XYZ
	LD R1, XYZ
	ADD
; TEST: Label at the same location and duplicated label
DUPLICATED_LABEL
DUPLICATED_LABEL
ADD R0, R0, R1
AND
.END
