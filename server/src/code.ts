import Stack from 'ts-data.stack/stack';

import {
  BasicBlock,
} from "./basicBlock";

import {
  OPTYPE,
  Instruction,
  Label,
  CC,
  INSTFLAG,
} from './instruction'

export class Code {
  public instructions: Instruction[] = [];                      // Instructions array
  public labels: Label[] = [];                                  // Labels array (symbol table)
  public basicBlocks: BasicBlock[] = [];                        // Basic blocks
  public dataAddr: number = NaN;                                // Data address startpoint marked by .data
  public textAddr: number = NaN;                                // Text address startpoint marked by .text
  public endAddr: number = NaN;                                 // End address marked by .end
  public dataLine: number = NaN;                                // Line number of .data
  public textLine: number = NaN;                                // Line number of .text
  public endLine: number = NaN;                                 // Line number of .end
  private firstInstrIdx: number = NaN;                          // First instruction index after .ORIG
  private lineNum: number = 0;                                  // Keeps track of current line number (in the file)
  private memAddr: number = NaN;                                // Keep track of current memory address
  private stack: Stack<Instruction> = new Stack<Instruction>(); // Stack used for building CFG

  constructor(text: string) {
    // First round
    this.buildInstructions(text);
    this.linkLabels();
    // Forward-backword analyzation (up to 3 times)
    for (let i = 0; i < 5; i++) {
      this.resetStatus();
      this.analyzeCFG();
      this.markSubroutines(text);
      this.checkReachability();
      this.buildBlocks();
      this.analyzeBlocks();
    }
  }

  // Returns the label at the specified address
  public findLabelByAddress(address: number): Label {
    let label = new Label(new Instruction(""));
    for (let i = 0; i < this.labels.length; i++) {
      if (this.labels[i].memAddr == address) {
        label = this.labels[i];
      }
    }
    return label;
  }

  // Build all instructions in the code
  private buildInstructions(text: string) {
    let lines = text.split('\n');
    let instruction: Instruction;
    let line: string;
    
    // Construct each instruction
    let endWithSharp: boolean = false;
    let comment_block_flag: boolean = false;
    for (let idx = 0; idx < lines.length; idx++) {
      endWithSharp = false;
      line = lines[idx];
      line = line.trim();
      // remove '/* */'
      if (line.slice(0, 2) == '/*') {
        comment_block_flag = true;
      }
      if (comment_block_flag == true) {
        if (line.slice(line.length-2) == '*/') {
          comment_block_flag = false;
        }
        line = ""
      }
      // remove '#'
      for (let i = 0; i < line.length; i++) {
        if (line[i] == '#') {
          if (i > 0 && !line[i - 1].match(/\s/)) {
            endWithSharp = true;
          }
          line = line.slice(0, i);
          break;
        }
      }
      // Remove '//'
      if (line.slice(0, 2) == '//') {
        line = ""
      }
      if (line) {
        instruction = new Instruction(line);
        // Handle .ascii in multiple line manner
        if (instruction.optype == OPTYPE.directiveString && instruction.mem &&
          instruction.mem.split('"').length < 3) {
          idx = this.parseDirectiveString(instruction, idx, lines);
        }

        this.pushInstruction(instruction);

        // Handle instructions/directives right behind labels
        if (instruction.optype == OPTYPE.label) {
          line = line.slice(instruction.mem.length).trim();
          if (line) {
            instruction = new Instruction(line);
            // Handle string directives in multiple line manner
            if (instruction.optype == OPTYPE.directiveString && instruction.mem &&
              instruction.mem.split('"').length < 3) {
              idx = this.parseDirectiveString(instruction, idx, lines);
            }
            this.pushInstruction(instruction);
          }
        }
      }
      this.lineNum++;
    }

    // Mark the first instruction
    if (isNaN(this.dataAddr)) {
      this.firstInstrIdx = NaN;
    } else {
      for (let i = 0; i < this.instructions.length; i++) {
        instruction = this.instructions[i];
        if (instruction.memAddr == this.dataAddr) {
          this.firstInstrIdx = i;
        }
      }
    }
  }

  // Replicated code for STRINGZ. Returns the idx after pushing the STRINGZ
  private parseDirectiveString(instruction: Instruction, idx: number, lines: string[]): number {
    let line: string;
    while (++idx < lines.length) {
      this.lineNum++;
      instruction.mem = instruction.mem + '\n';
      line = lines[idx];
      for (let i = 0; i < line.length; i++) {
        if (line[i] == ';') {
          line = line.slice(0, i);
          break;
        }
      }
      instruction.mem = instruction.mem + line;
      for (let i = 0; i < line.length; i++) {
        if (line[i] == '"') {
          return idx;
        }
      }
    }
    return idx;
  }

  // Push an instruction according to its type ({push}/{not push}/{push to label})
  private pushInstruction(instruction: Instruction) {
    let label: Label;
    // Keep track of line numbers
    instruction.line = this.lineNum;

    // Handle .data, .text and .end here
    if (instruction.optype == OPTYPE.directiveData && isNaN(this.dataAddr)) {
      this.memAddr = instruction.memAddr;
      this.dataLine = instruction.line;
      this.dataAddr = this.memAddr;
    } else if (instruction.optype == OPTYPE.directiveText && isNaN(this.textAddr)){  
      this.memAddr = instruction.memAddr;
      this.textLine = instruction.line;
      this.textAddr = this.memAddr;
    } else if (instruction.optype == OPTYPE.directiveEnd && isNaN(this.endAddr)) {
      this.endAddr = this.memAddr;
      this.endLine = instruction.line;
    } else {
      instruction.memAddr = this.memAddr++;
    }

    // Decide what to do according to optype
    switch (instruction.optype) {
      case OPTYPE.directiveData:
      case OPTYPE.directiveText:
      case OPTYPE.directiveEnd:
        break;
      case OPTYPE.directiveNumber:
        this.instructions.push(instruction);
        break;
      case OPTYPE.directiveString:
        if (!isNaN(instruction.mem.length)) {
          instruction.mem.slice(1, instruction.mem.length - 1);
          this.memAddr += instruction.mem.length;
        }
        for (let i = 0; i < instruction.mem.length; i++) {
          // Take out the '\' characters
          if (instruction.mem[i] == '\\') {
            this.memAddr--;
          }
        }
        this.instructions.push(instruction);
        break;

      case OPTYPE.label:
        // Labels do not occupy memory addresses
        this.memAddr--;
        label = new Label(instruction);
        this.labels.push(label);
        break;
        
      default:
        instruction.calcMem();
        this.instructions.push(instruction);
        break;
    }
  }

  // Link labels with the instruction at that memory location
  private linkLabels() {
    for (let instruction_idx = 0; instruction_idx < this.instructions.length; instruction_idx++) {
      // Skip instructions before .data
      if (this.instructions[instruction_idx].memAddr == 0) { continue; }
      for (let label_idx = 0; label_idx < this.labels.length; label_idx++) {
        // Skip labels before .data
        if (this.labels[label_idx].memAddr == 0) { continue; }
        if (this.instructions[instruction_idx].memAddr == this.labels[label_idx].memAddr) {
          this.labels[label_idx].instruction = this.instructions[instruction_idx];
        }
      }
    }
  }

  // Build the CFG of the given code
  private analyzeCFG() {
    let instruction: Instruction;

    for (let i = 0; i < this.instructions.length; i++) {
      instruction = this.instructions[i];
      // Skip data
      if (instruction.memAddr == 0 || instruction.isData()) {
        continue;
      }
      // Link instructions
      if (i + 1 < this.instructions.length) {
        instruction.nextInstruction = this.instructions[i + 1];
      }
      if (instruction.optype == OPTYPE.controlOperation) {
        // BR
        instruction.jumpTarget = this.getTarget(i);
        if (instruction.flags & INSTFLAG.isNeverBR) {
          instruction.jumpTarget = null;
        }
        if (instruction.flags & INSTFLAG.isAlwaysBR) {
          instruction.nextInstruction = null;
        }
      } else if (instruction.optype == OPTYPE.aloneOperation) {
        // alone operations do not have nextInstruction
        instruction.nextInstruction = null;
      }
    }
  }

  // Mark subroutines according to #pragma
  private markSubroutines(text: string) {
    let lines = text.split('\n');
    let instruction: Instruction, target: Instruction;
    let line: string;
    let label: Label;

    // Iterate through all lines except for the last line for pragma
    for (let i = 0; i < lines.length - 1; i++) {
      line = lines[i];
      if (line.match("@SUBROUTINE")) {
        label = this.findLabelByLine(i + 1);
        if (label.instruction) {
          label.instruction.flags |= INSTFLAG.isSubroutineStart;
          label.instruction.subroutineNum = label.instruction.memAddr;
        }
      }
    }
  }

  // Returns the label at the specified line number (assuming line number is always legal)
  private findLabelByLine(line: number): Label {
    let label: Label;
    for (let i = 0; i < this.labels.length; i++) {
      label = this.labels[i];
      if (label.line == line) {
        return label;
      }
    }
    // Returns an empty label, required by compiler
    return new Label(new Instruction(""));
  }

  // Analyze code
  private checkReachability() {
    let instruction: Instruction;
    // Analyze main code
    if (this.instructions.length > 0 && !isNaN(this.firstInstrIdx)) {
      this.iterateCode(this.instructions[this.firstInstrIdx], this.dataAddr);
    }

    // Analyze subroutines
    for (let i = 0; i < this.instructions.length; i++) {
      instruction = this.instructions[i];
      if (instruction.flags & INSTFLAG.isSubroutineStart) {
        this.iterateCode(instruction, instruction.subroutineNum);
      }
    }
  }

  // Iterate through code to detect unreachable code
  private iterateCode(initial_instruction: Instruction, subroutineNum: number) {
    let cur_instruction: Instruction;
    let next_instrcution: Instruction | null;

    if (initial_instruction.flags & INSTFLAG.isSubroutineStart &&
      initial_instruction.subroutineNum != subroutineNum) {
      initial_instruction.codeOverlap = subroutineNum;
    } else {
      initial_instruction.flags |= INSTFLAG.isFound;
      initial_instruction.subroutineNum = subroutineNum;
      this.stack.push(initial_instruction);
    }

    while (!this.stack.isEmpty()) {
      // Pop one instruction
      cur_instruction = this.stack.pop();
      // Next instruction
      next_instrcution = cur_instruction.nextInstruction;
      if (next_instrcution) {
        this.pushToStack(next_instrcution, subroutineNum);
      }
      // Branch target
      next_instrcution = cur_instruction.jumpTarget;
      if (next_instrcution) {
        this.pushToStack(next_instrcution, subroutineNum);
      }
    }
  }

  // Do the checking and push one instruction onto stack
  private pushToStack(instruction: Instruction, subroutineNum: number) {
    if (instruction.flags & INSTFLAG.isSubroutineStart) {
      instruction.codeOverlap = subroutineNum;
    } else if (!(instruction.flags & INSTFLAG.isFound)) {
      instruction.flags |= INSTFLAG.isFound;
      instruction.subroutineNum = subroutineNum;
      this.stack.push(instruction);
    } else if (instruction.subroutineNum != subroutineNum) {
      // Have seen this instruction, check for code overlap
      instruction.codeOverlap = subroutineNum;
    }
  }

  // Get the instruction according to label
  private getTarget(idx: number): Instruction | null {
    for (let i = 0; i < this.labels.length; i++) {
      if (this.labels[i].name == this.instructions[idx].mem) {
        return this.labels[i].instruction;
      }
    }
    return null;
  }

  // Build the basic blocks structure
  private buildBlocks() {
    let bb: BasicBlock;
    let instruction: Instruction;

    // Explore the main routine
    if (isNaN(this.firstInstrIdx)) {
      return;
    }

    bb = this.buildOneBlock(this.instructions[this.firstInstrIdx], this.dataAddr);
    this.basicBlocks.push(bb);

    // Explore subroutines
    for (let i = 0; i < this.instructions.length; i++) {
      instruction = this.instructions[i];
      if (instruction.flags & INSTFLAG.isSubroutineStart) {
        bb = this.buildOneBlock(instruction, instruction.subroutineNum);
        this.basicBlocks.push(bb);
      }
    }
  }

  // Helper function to build one basic block
  private buildOneBlock(instruction: Instruction, subroutineNum: number): BasicBlock {
    let bb: BasicBlock | null;
    let cur: Instruction | null, next: Instruction | null;

    cur = instruction;
    bb = cur.inBlock;
    // Instruction already in a basic block
    if (bb != null) {
      // Accessd from another routine
      if (bb.subroutineNum != subroutineNum) {
        bb.overlapNumber = subroutineNum;
      }

      return bb;
    }

    // Create a new basic block
    bb = new BasicBlock();
    cur.inBlock = bb;
    bb.pushInstruction(cur);

    // Get next instruction
    next = cur.nextInstruction;
    while (!cur.endBasicBlock() && cur.jumpTarget == null && cur.jumpTarget == null &&
      next) {
      // Push next instruction into this basic block
      bb.pushInstruction(next);
      next.inBlock = bb;

      // Go to the next instruction
      cur = next;
      next = cur.nextInstruction;
    }

    // One instruction ends the current basic block
    // If it has a next instruction
    if (cur.nextInstruction) {
      bb.nextBlock = this.buildOneBlock(cur.nextInstruction, subroutineNum);
    }
    // If it has a branch target
    if (cur.jumpTarget) {
      bb.brBlock = this.buildOneBlock(cur.jumpTarget, subroutineNum);
    }

    // Return the built basic block
    return bb;
  }

  // Analyze blocks, including dead code, CC and save-restore checking
  // Returns 0 if there are no change to the CFG; non-zero otherwise
  private analyzeBlocks(): number {
    let ret: number = 0;

    for (let i = 0; i < this.basicBlocks.length; i++) {
      this.basicBlocks[i].analyzeBackward(this.basicBlocks[i]);
      ret |= this.basicBlocks[i].analyzeForward(CC.nzp);
    }
    return ret;
  }

  // Reset relevant flags in instructions and basic blocks
  private resetStatus() {
    // Clear flags in all found instructions
    for (let i = 0; i < this.instructions.length; i++) {
      this.instructions[i].flags &= ~(INSTFLAG.isFound);
    }
    this.basicBlocks = [];
  }
}
