// This file is now editing.

import { ResourceOperationKind } from "vscode-languageserver";
import {
  BasicBlock
} from "./basicBlock";

export enum CC {
  none = 0x0,  // Invalid CC, usually on program start
  p = 0x1,
  z = 0x2,
  n = 0x4,
  nz = n | z,
  np = n | p,
  zp = z | p,
  nzp = n | z | p,
};

export enum INSTFLAG {
  none = 0x0,
  isIncomplete = 0x1,
  isSubroutineStart = 0x2,
  isFound = 0x4,
  isDead = 0x8,
  isAlwaysBR = 0x10,
  isNeverBR = 0x20,
  hasRedundantCC = 0x40,
  useMemoryTwice = 0x80, // movl LABEL1, LABEL2
  useImmediateTwice = 0x90,
  warnedUnrolledLoop = 0x100,
};

enum DATATYPE {
  register = 0x0,
  immediateValue = 0x1,
  label = 0x2,
};

export enum OPTYPE {
  arithmeticOperation = 0x0,
  moveOperation = 0x1,
  controlOperation = 0x2,
  label = 0x4,
  directiveNumber = 0x8,
  directiveString = 0x16,
  directiveData,
  directiveText,
  directiveEnd,
  aloneOperation,
}

export class Instruction {
  // Internal variables
  public rawString: string;                            // The original line content
  public optype: number = NaN;                          // Operation type
  public memAddr: number = NaN;                        // Memory address
  public mem: string = "";                             // Targeting memory (label name)
  public destMem: number = NaN;                        // Destination memory address
  public line: number = NaN;                           // Line number
  public reg: string = "";
  public src: string = "";                            // Source reg
  public dest: string = "";                           // Destination reg
  public immVal: number = NaN;                         // Immediate value/ PC offset
  public immValType: string = "";                      // Immediate value type: R, X, #, 0/1
  public immValArray: number[] = [];                   // Array of Immediate Value (for .long 1, 2, 3, 4/labels)
  public immValTypeArray: string[] = [];
  public cc: CC = CC.none;                             // Only valid for BR instructions, cc[2, 1, 0] = n, z, p
  public flags: number = INSTFLAG.none;                // Flags, see INSTFLAG above
  // Subroutine
  public subroutineNum: number = NaN;                  // Subroutine ID
  public codeOverlap: number = NaN;                    // Subroutine ID of the other code that overlaps
  // Added for CFG
  public nextInstruction: Instruction | null = null;   // Pointer to next instruction
  public jumpTarget: Instruction | null = null;          // Pointer to jump target
  public inBlock: BasicBlock | null = null;            // Basic block containing the instruction
  public redundantCC: CC = CC.none;                    // Only valid for jump instructions, indicate which CC is redundant

  constructor(inst: string) {
    // Replace white spaces by normal spaces
    let space: RegExp = new RegExp("[\s\n\r\t]", 'g');
    this.rawString = inst.replace(space, " ");

    // Parse instruction into lower cases
    let instlst = inst.toLowerCase().split(/(\s|,)/); // \s means all white spaces

    // Label
    if (instlst.length == 1 && instlst[0].charAt(instlst[0].length-1) == ":") {
      this.optype = OPTYPE.label;
    }

    // Remove auxiliary parts
    for (let i = instlst.length; i > 0; i--) {
      if (instlst[i] == '' || instlst[i] == ' ' || instlst[i] == '\t' || instlst[i] == ',') {
        instlst.splice(i, 1);
      }
    }

    // Assign values to variables
    switch (instlst[0]) {
      // operations not setting flags
      // actually they will, so warning will pop up if jump after these operations
      case "addb":
      case "addw":
      case "addl":
      case "addq":
      case "subb":
      case "subw":
      case "subl":
      case "subq":
      case "negb":
      case "negw":
      case "negl":
      case "negq":
      case "incb":
      case "incw":
      case "incl":
      case "incq":
      case "decb":
      case "decw":
      case "decl":
      case "decq":
      case "mulb":
      case "mulw":
      case "mull":
      case "mulq":
      case "divb":
      case "divw":
      case "divl":
      case "divq":
      case "imulb":
      case "imulw":
      case "imull":
      case "imulq":
      case "idivb":
      case "idivw":
      case "idivl":
      case "idivq":
      case "salb":
      case "salw":
      case "sall":
      case "salq":
      case "shlb":
      case "shlw":
      case "shll":
      case "shlq":
      case "sarb":
      case "sarw":
      case "sarl":
      case "sarq":
      case "shrb":
      case "shrw":
      case "shrl":
      case "shrq":
      case "rolb":
      case "rolw":
      case "roll":
      case "rolq":
      case "rorb":
      case "rorw":
      case "rorl":
      case "rorq":
      case "rclb":
      case "rclw":
      case "rcll":
      case "rclq":
      case "rcrb":
      case "rcrw":
      case "rcrl":
      case "rcrq":
      case "notb":
      case "notw":
      case "notl":
      case "notq":
      case "andb":
      case "andw":
      case "andl":
      case "andq":
      case "orb":
      case "orw":
      case "orl":
      case "orq":
      case "xorb":
      case "xorw":
      case "xorl":
      case "xorq":
      // operations setting flags
      case "cmpb":
      case "cmpw":
      case "cmpl":
      case "cmpq":
      case "testb":
      case "testw":
      case "testl":
      case "testq":
        if (instlst.length >= 3) {
          // first operand
          if (this.decideDataType(instlst[1]) == DATATYPE.label) {
            this.mem = instlst[1];
            // second operand
            if (this.decideDataType(instlst[2]) == DATATYPE.label) {
              this.flags |= INSTFLAG.useMemoryTwice;
            } else if (this.decideDataType(instlst[2]) == DATATYPE.register){
                this.dest = this.parseRegister(instlst[2]);
            } else {
                this.immVal = this.parseImmediate(instlst[2]);
                this.immValType = instlst[2][0];
            }
          } else if (this.decideDataType(instlst[1]) == DATATYPE.register) {
            this.src = this.parseRegister(instlst[1]);
            if (this.decideDataType(instlst[2]) == DATATYPE.label) {
              this.mem = instlst[2];
            } else if (this.decideDataType(instlst[2]) == DATATYPE.register){
              this.dest = this.parseRegister(instlst[2]);
            } else {
              this.immVal = this.parseImmediate(instlst[2]);
              this.immValType = instlst[2][0];
            }
          } else {
            this.immVal = this.parseImmediate(instlst[1]);
            if (this.decideDataType(instlst[2]) == DATATYPE.immediateValue){
              this.flags |= INSTFLAG.useImmediateTwice;
            } else if (this.decideDataType(instlst[2]) == DATATYPE.register){
              this.dest = this.parseRegister(instlst[2]);
            } else {
              this.mem = instlst[2];
            }
          }
          if (instlst[0][0] == 'c' || instlst[0][0] == 't'){
            this.optype = OPTYPE.controlOperation;
          } else {
            this.optype = OPTYPE.arithmeticOperation;
          }
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;

      case "enter":
        if (instlst.length >= 3) {
          this.immValArray.push(this.parseImmediate(instlst[1]));
          this.immValTypeArray.push(instlst[1][0]);
          this.immValArray.push(this.parseImmediate(instlst[2]));
          this.immValTypeArray.push(instlst[1][0]);
          this.optype = OPTYPE.controlOperation;
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;

      case "ret":
      case "leave":
      case "nop":
        this.optype = OPTYPE.aloneOperation;
        break;

      // Directives
      case ".align":
        if (instlst.length >= 2) {
          if (isAttasmNum(instlst[1])) {
            this.immVal = this.parseImmediate(instlst[1]);
            this.immValType = instlst[1][0];
          } else {
            this.mem = instlst[1];
          }
          this.optype = OPTYPE.directiveNumber;
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;

      case ".byte":
      case ".word":
      case ".long":
      case ".quad":
      case ".int":
        if (instlst.length >= 2) {
          for (let i = 0; i < instlst.length - 1; i++) {
            this.immValArray.push(this.parseImmediate(instlst[i+1]));
            this.immValTypeArray.push(instlst[i+1][0]);
            this.optype = OPTYPE.directiveNumber;
          }
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;
          
      case ".string":
      case ".ascii":
      case ".asciz":
        if (instlst.length >= 2) {
          this.mem = inst.slice(instlst[0].length).trim();
          this.optype = OPTYPE.directiveString;
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;

      case ".data":
        this.optype = OPTYPE.directiveData;
        break;

      case ".text":
        this.optype = OPTYPE.directiveText;
        break;

      case ".end":
        this.optype = OPTYPE.directiveEnd;

      case "call":
        if (instlst.length >= 2) {
          this.mem = instlst[1];
          this.optype = OPTYPE.controlOperation;
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }

      // Jump
      case "j":
      case "jmp":
      case "ja":
      case "jae":
      case "jb":
      case "jbe":
      case "je":
      case "jg":
      case "jge":
      case "jl":
      case "jle":
      case "jna":
      case "jnae":
      case "jnb":
      case "jnbe":
      case "jne":
      case "jng":
      case "jnge":
      case "jnl":
      case "jnle":
      case "jpe":
      case "jpo":
      case "jz":
      case "jnc":
      case "jno":
      case "jnp":
      case "jns":
      case "jnz":
      case "jcxz":
      case "jecxz":
        let signFlag = instlst[0].slice(1); // signFlag = "z"/"np"/...
        this.parseSignFlag(signFlag);
        if (instlst.length >= 2) {
          this.optype = OPTYPE.controlOperation;
          this.mem = instlst[1];
        } else {
          this.flags |= INSTFLAG.isIncomplete;
        }
        break;
      default:
        break;
    }
  }

  /***** HELPER FUNCTIONS *****/

  // Returns whether current instruction operates on memory
  public isMemType(): boolean {
    if (this.mem != ""){
      return true;
    } else {
      return false;
    }
  }

  // Returns whether current instruction is data
  public isData(): boolean {
    switch (this.optype) {
      case (OPTYPE.directiveNumber):
      case (OPTYPE.directiveString):
        return true;
      default:
        return false;
    }
  }

  // Returns whether current instruction ends a basic block
  public endBasicBlock(): boolean {
    switch (this.optype) {
      case OPTYPE.controlOperation:
        return true;
      default:
        if (this.nextInstruction && this.nextInstruction.isData()) {
          return true;
        } else {
          return false;
        }
    }
  }

  public setCC(): boolean {
    switch (this.optype) {
      case OPTYPE.arithmeticOperation:
        return true;
      default:
        return false;
    }
  }

  // Calculate destination memory for constant offsets
  public calcMem() {
    if (this.mem && isAttasmNum(this.mem)) {
      this.destMem = this.memAddr + 1 + this.parseImmediate(this.mem);
    }
  }

  private decideDataType(val:string): number {
    let dataType: number;
    val = val.trim();
    switch (val[0]) {
      case '$':
        dataType = DATATYPE.immediateValue;
        break;
      case '%':
        dataType = DATATYPE.register;
        break;
      default:
        dataType = DATATYPE.label;
    }
    return dataType;
  }

  // Helper function to parse a register from a string %eax, %ebx...
  // Possible value type: eax, ax, al...
  private parseRegister(val: string): string {
    let ret: string;
    if (val[0] == '%') {
      // Register
      if (!val.slice(1).match(/eax|ax|al|ar|ebx|bx|bl|br|ecx|cx|cl|cr|edx|dx|dl|dr|edi|di|esi|si|eip|esp|ebp/)) {
        ret = "invalid";
      } else {
        ret = val.slice(1); // e.g. eax, al, ar...
      }
    }
    return ret;
  }

  
  // Helper function to parse values from a string
  // Possible value type: decimal, hexadecimal, binary
  private parseImmediate(val: string): number {
    let ret: number;
    val = val.trim();
    switch (val[0]) {
      case '$':
        switch (val[1]) {
          case "0":
            // Hexadecimal or Octal
            if (val[2] == 'x') {
              if (val[3] == '-') {
                ret = -parseInt(val.slice(3), 16);
              } else {
                ret = parseInt(val.slice(2), 16);
              }
            } else {
              if (val[2] == '-') {
                ret = -parseInt(val.slice(3), 8);
              } else {
                ret = parseInt(val.slice(2), 8);
              }
            }
            break
          default:
            // Decimal
            if (val[1] == '-') {
              ret = -parseInt(val.slice(2), 10);
            } else {
              ret = parseInt(val.slice(1), 10);
            }
            break;
        }
        break;
      default:
        ret = null
        break
    }
    return ret;
  }

  // Assign CC according to the string input
  private parseSignFlag(cc: string) {
    switch (cc) {
      case "j":
      case "jmp":
        this.cc = CC.nzp;
        this.flags |= INSTFLAG.isAlwaysBR;
        break;
      case "b":
      case "l":
      case "na":
      case "ng":
        this.cc = CC.n;
        break;
      case "e":
      case "z":
        this.cc = CC.z;
        break;
      case "a":
      case "g":
      case "nb":
      case "nl":
        this.cc = CC.p;
        break;
      case "be":
      case "le":
        this.cc = CC.nz;
        break;
      case "ae":
      case "ge":
        this.cc = CC.zp;
        break;
      case "ne":
      case "nz":
        this.cc = CC.np;
        break;
      default:
        break;
    }
  }
}

export class Label {
  public memAddr: number;                         // Memory address
  public name: string;                            // Name of label
  public line: number;                            // Line number
  public instruction: Instruction | null = null;  // Instruction at the same memory address
  public flags: INSTFLAG;                         // Flags inherited from Instruction

  constructor(instruction: Instruction) {
    this.memAddr = instruction.memAddr;
    this.name = instruction.mem;
    this.line = instruction.line;
    this.flags = instruction.flags;
  }
}

// Returns true if the input string is a lc3 number: 0x52, 052, 52
export function isAttasmNum(str: string): boolean {
  const reg_hexd = /^0x-?[0-9a-f]+$/i;
  const reg_octa = /^0-?[0-7]+$/;
  const reg_deci = /^-?[0-9]+$/;
  return (str.match(reg_hexd) != null || str.match(reg_octa) != null || str.match(reg_deci) != null);
}

// Returns true if the input string is an attasm register: %eax
export function isAttasmReg(str: string): boolean {
  const reg = /eax|ax|al|ar|ebx|bx|bl|br|ecx|cx|cl|cr|edx|dx|dl|dr|edi|di|esi|si|eip|esp|ebp/i;
  return str.match(reg) != null;
}
