.ORIG x3000

; TEST: Code overlap
MAIN
  ADD R0, R0, #0
  HALT

; @SUBROUTINE
SUBROUTINE_1
  ADD R0, R0, #0
  BR MAIN

; @SUBROUTINE
SUBROUTINE_2
  BR SUBROUTINE_1

.END
